import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? '/auth/reset-password'
  // Prevent open redirect — only allow relative paths, block protocol-relative URLs
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/auth/reset-password'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If code exchange failed or no code, redirect to login with error
  return NextResponse.redirect(`${origin}/auth/reset-password?error=link_expired`)
}
