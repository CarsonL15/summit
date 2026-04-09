import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication and specific roles
const protectedRoutes: Record<string, string[]> = {
  '/firefighter': ['firefighter', 'admin'],
  '/chief': ['chief', 'admin'],
  '/clinic': ['clinic', 'admin'],
  '/assessor': ['assessor', 'admin'],
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session (important for keeping auth alive)
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Check if this is a protected route
  const matchedRoute = Object.keys(protectedRoutes).find(route =>
    pathname.startsWith(route)
  )

  if (matchedRoute) {
    // Not logged in — redirect to login
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    // Check role from the database
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (userData as { role: string } | null)?.role

    if (!role || !protectedRoutes[matchedRoute].includes(role)) {
      // Wrong role — redirect to correct dashboard
      const redirectPath = role === 'chief' ? '/chief'
        : role === 'clinic' ? '/clinic'
        : role === 'assessor' ? '/assessor'
        : role === 'firefighter' ? '/firefighter'
        : '/auth/login'

      const url = request.nextUrl.clone()
      url.pathname = redirectPath
      return NextResponse.redirect(url)
    }
  }

  // Signup is disabled — redirect to login
  if (pathname === '/auth/signup') {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in and visiting login, redirect to their dashboard
  if (user && pathname === '/auth/login') {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (userData as { role: string } | null)?.role

    if (role) {
      const redirectPath = role === 'chief' ? '/chief'
        : role === 'clinic' ? '/clinic'
        : role === 'assessor' ? '/assessor'
        : '/firefighter'

      const url = request.nextUrl.clone()
      url.pathname = redirectPath
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/firefighter/:path*',
    '/chief/:path*',
    '/clinic/:path*',
    '/assessor/:path*',
    '/auth/login',
    '/auth/signup',
    '/profile/:path*',
  ],
}
