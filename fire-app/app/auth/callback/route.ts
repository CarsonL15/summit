import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? '/auth/reset-password'
  // Prevent open redirect — only allow relative paths, block protocol-relative URLs
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/auth/reset-password'

  if (code) {
    // Create the redirect response FIRST, then set cookies directly on it.
    // This avoids the Next.js issue where cookies().set() doesn't persist
    // on a separately-created NextResponse.redirect().
    const redirectUrl = `${origin}${next}`
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return response
    }
  }

  // If code exchange failed or no code, redirect to reset page with error
  return NextResponse.redirect(`${origin}/auth/reset-password?error=link_expired`)
}
