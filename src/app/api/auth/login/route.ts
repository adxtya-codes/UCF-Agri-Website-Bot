import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        // Check credentials
        if (username === "UCF ADMIN" && password === "Add1ngt0N@26") {
            const response = NextResponse.json({ success: true });

            // Set HTTP-only cookie
            response.cookies.set("admin_session", "true", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 60 * 60 * 24, // 1 day
                path: "/",
            });

            return response;
        }

        return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
