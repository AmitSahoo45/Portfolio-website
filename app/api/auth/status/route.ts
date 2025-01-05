import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const tokenCookie = request.cookies.get("youtube_token")?.value;
    return NextResponse.json({ isAuthenticated: !!tokenCookie });
}
