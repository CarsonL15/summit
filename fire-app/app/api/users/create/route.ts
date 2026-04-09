import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Authenticate the caller — only clinic and admin can create users
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 10 user creations per minute per caller
    const { success: withinLimit } = checkRateLimit(`create-user:${user.id}`, 10, 60 * 1000)
    if (!withinLimit) {
      logger.warn('Rate limit exceeded on user creation', { userId: user.id })
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
    }

    const { data: callerData } = await supabase
      .from('users')
      .select('role, station_id')
      .eq('id', user.id)
      .single() as { data: { role: string; station_id: string } | null }

    if (!callerData || !['clinic', 'admin'].includes(callerData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!callerData.station_id) {
      return NextResponse.json({ error: 'No station assigned to your account' }, { status: 400 })
    }

    const body = await request.json()
    const { name, email, badgeNumber } = body

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()
    const cleanName = name.trim()

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    }

    // Generate a cryptographically secure temporary password
    const array = new Uint8Array(12)
    crypto.getRandomValues(array)
    const tempPassword = `FireFMS!${Array.from(array, x => x.toString(36).padStart(2, '0')).join('').slice(0, 12)}`

    // Create auth user using service role key (server-side only)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: cleanName }
    })

    if (authError) {
      logger.error('Auth user creation failed', { error: authError.message, email: cleanEmail })
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!newAuthUser.user) {
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 })
    }

    // Insert user record in public.users table
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newAuthUser.user.id,
        name: cleanName,
        email: cleanEmail,
        badge_number: badgeNumber?.trim() || null,
        role: 'firefighter',
        station_id: callerData.station_id,
        points: 0,
        current_streak: 0,
        longest_streak: 0
      })

    if (insertError) {
      logger.error('DB insert failed, cleaning up auth user', { userId: newAuthUser.user.id, error: insertError.message })
      await supabaseAdmin.auth.admin.deleteUser(newAuthUser.user.id)
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
    }

    logger.info('User created', { userId: newAuthUser.user.id, email: cleanEmail, role: 'firefighter' })
    return NextResponse.json({
      success: true,
      tempPassword,
      userId: newAuthUser.user.id,
    })
  } catch (error) {
    logger.error('User creation error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
