import { NextRequest, NextResponse } from "next/server";



export function middleware(req: NextRequest) {

    const token = req.cookies.get("token")?.value;

    if (token && req.nextUrl.pathname !== "/auth/login") {
        return NextResponse.redirect(new URL("/auth/login", req.url))
    }

    return NextResponse.next();
}
export const config = {
  matcher: [
    "/((?!auth|_next/static|_next/image|favicon.ico).*)",
  ],
};