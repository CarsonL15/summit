import { Resend } from 'resend'

let _resend: Resend | null = null

export function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

// During development, Resend sends from their test domain
// In production, replace with your verified domain
export const FROM_EMAIL = process.env.EMAIL_FROM || 'Summit Performance <onboarding@resend.dev>'
