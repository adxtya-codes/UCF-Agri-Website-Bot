import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Define public paths that don't require authentication
    const publicPaths = ["/login", "/api/auth/login", "/api/auth/logout"];

    // Check if the path is public
    const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath));

    // Get the session cookie
    const session = request.cookies.get("admin_session");

    // If trying to access a protected route without a session, redirect to login
    if (!isPublicPath && !session && !path.startsWith("/_next") && !path.startsWith("/static")) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // If trying to access login page with an active session, redirect to dashboard
    if (path === "/login" && session) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (except auth routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
