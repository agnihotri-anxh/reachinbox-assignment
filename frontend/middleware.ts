import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    // Skip middleware for all API routes and static files
    if (
        req.nextUrl.pathname.startsWith('/api') ||
        req.nextUrl.pathname.startsWith('/_next') ||
        req.nextUrl.pathname.startsWith('/favicon.ico')
    ) {
        return null
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const isAuth = !!token

    // Allow access to home page (login page)
    if (req.nextUrl.pathname === '/') {
        return null
    }

    // Redirect unauthenticated users to home/login
    if (!isAuth) {
        return NextResponse.redirect(new URL('/', req.url))
    }

    return null
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
