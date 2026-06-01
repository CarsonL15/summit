import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getResend, FROM_EMAIL } from '@/lib/email/resend'
import { buildResultsEmailHtml, buildResultsEmailText } from '@/lib/email/templates/results'
import { checkRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the caller — only clinic, assessor, and admin can send emails
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 10 emails per minute per user
    const { success: withinLimit } = checkRateLimit(`email:${user.id}`, 10, 60 * 1000)
    if (!withinLimit) {
      logger.warn('Rate limit exceeded on email send', { userId: user.id })
      return NextResponse.json({ error: 'Too many requests. Please wait before sending more emails.' }, { status: 429 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }

    if (!userData || !['clinic', 'assessor', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      firefighterName,
      firefighterEmail,
      riskLevel,
      weakAreas,
      totalScore,
    } = body

    // Validate required fields
    if (!firefighterEmail || typeof firefighterEmail !== 'string') {
      return NextResponse.json({ error: 'Valid firefighterEmail is required' }, { status: 400 })
    }
    if (!firefighterName || typeof firefighterName !== 'string') {
      return NextResponse.json({ error: 'Valid firefighterName is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(firefighterEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate name length
    if (firefighterName.trim().length < 1 || firefighterName.trim().length > 200) {
      return NextResponse.json({ error: 'Name must be between 1 and 200 characters' }, { status: 400 })
    }

    // Validate totalScore range
    if (totalScore !== undefined && totalScore !== null) {
      const score = Number(totalScore)
      if (isNaN(score) || score < 0 || score > 21) {
        return NextResponse.json({ error: 'totalScore must be between 0 and 21' }, { status: 400 })
      }
    }

    // Validate riskLevel
    const validRiskLevels = ['High Risk', 'Moderate', 'Low Risk']
    if (riskLevel && !validRiskLevels.includes(riskLevel)) {
      return NextResponse.json({ error: 'Invalid riskLevel value' }, { status: 400 })
    }

    // Validate weakAreas is an array of strings
    if (weakAreas && (!Array.isArray(weakAreas) || !weakAreas.every((a: unknown) => typeof a === 'string'))) {
      return NextResponse.json({ error: 'weakAreas must be an array of strings' }, { status: 400 })
    }

    // Sanitize inputs for HTML email
    const safeName = escapeHtml(firefighterName.trim())
    const safeWeakAreas = (weakAreas || []).map((area: string) => escapeHtml(area))

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fire-app.vercel.app'
    const loginLink = `${appUrl}/auth/login`

    const html = buildResultsEmailHtml({
      firefighterName: safeName,
      riskLevel: riskLevel || 'Moderate',
      weakAreas: safeWeakAreas,
      totalScore: totalScore || 0,
      appLink: loginLink,
    })

    const text = buildResultsEmailText({
      firefighterName: safeName,
      riskLevel: riskLevel || 'Moderate',
      weakAreas: safeWeakAreas,
      totalScore: totalScore || 0,
      appLink: loginLink,
    })

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: firefighterEmail,
      subject: 'Your Results Are In – Take the Next Step in Your Performance',
      html,
      text,
    })

    if (error) {
      logger.error('Resend API error', { error: error.message, to: firefighterEmail })
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    logger.info('Results email sent', { to: firefighterEmail, emailId: data?.id })
    return NextResponse.json({ success: true, id: data?.id })
  } catch (error) {
    logger.error('Email send error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
