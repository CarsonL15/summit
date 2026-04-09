import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

// During development, Resend sends from their test domain
// In production, replace with your verified domain
export const FROM_EMAIL = process.env.EMAIL_FROM || 'Summit Performance <onboarding@resend.dev>'
