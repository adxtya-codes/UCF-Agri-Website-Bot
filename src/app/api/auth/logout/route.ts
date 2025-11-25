import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({ success: true });

    // Clear cookie
    response.cookies.delete("admin_session");

    return response;
}
