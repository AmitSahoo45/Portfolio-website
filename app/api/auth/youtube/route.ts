import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URL, SCOPES, HOSTED_URL } from '@/app/constants'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code"),
    oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

  if (!code) {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES as string[],
      redirect_uri: REDIRECT_URL,
      prompt: "consent",
    });

    return NextResponse.redirect(url);
  }

  try {
    const { tokens } = await oauth2Client.getToken({ code, redirect_uri: REDIRECT_URL });
    oauth2Client.setCredentials(tokens);

    const response = NextResponse.redirect(HOSTED_URL);
    response.cookies.set("youtube_token", JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
