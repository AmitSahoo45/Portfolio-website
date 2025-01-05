import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect("http://localhost:3000");
  response.cookies.set("youtube_token", "", { maxAge: 0 });
  return response;
}
