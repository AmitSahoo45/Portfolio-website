import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!;
const REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL || "http://localhost:3000/api/auth/youtube/callback";
// Or your deployed URL + "/callback"

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
);

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    console.log("Search params:", searchParams.toString());
    console.log(request.url);

    // 1) Check if we have a 'code' param => callback scenario
    const code = searchParams.get("code");
    console.log("Code:", code);
    if (!code) {
        // No code => Start OAuth flow
        // Build the consent URL:
        const scopes = ["https://www.googleapis.com/auth/youtube"];
        const url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: scopes,
            // This redirect must match what's in Google Cloud Console
            redirect_uri: REDIRECT_URL,
            prompt: "consent",
        });
        // Redirect user to Google’s OAuth consent screen
        return NextResponse.redirect(url);
    }

    // 2) If we do have a 'code', that means we’re coming back from Google
    try {
        // 1. Exchange code for tokens, set up auth client
        const { tokens } = await oauth2Client.getToken({
            code,
            redirect_uri: REDIRECT_URL,
        });
        oauth2Client.setCredentials(tokens);

        // 2. Create the YouTube playlist
        const youtube = google.youtube("v3");
        const playlistCreation = await youtube.playlists.insert({
            auth: oauth2Client,
            part: ["snippet", "status"],
            requestBody: {
                snippet: {
                    title: "My Converted Spotify Playlist",
                    description: "Playlist created via Spotify2YouTube converter",
                },
                status: { privacyStatus: "private" },
            },
        });

        const newPlaylistId = playlistCreation.data.id;

        // 3. Prepare a list of failed tracks
        const failedTracks: Array<{ trackName: string; artistName: string }> = [];
        const tracks = globalThis["__SPOTIFY_TRACKS__"] || [];

        // 4. For each track, do search + insert
        for (const track of tracks) {
            try {
                const query = `${track.trackName} ${track.artistName}`;
                const searchRes = await youtube.search.list({
                    auth: oauth2Client,
                    part: ["snippet"],
                    q: query,
                    maxResults: 1,
                    type: ["video"],
                });

                const videoId =
                    searchRes.data.items && searchRes.data.items[0]
                        ? searchRes.data.items[0].id?.videoId
                        : null;
                if (!videoId) {
                    // If no video found, mark the track as failed
                    failedTracks.push(track);
                    continue;
                }

                // Insert video into playlist
                await youtube.playlistItems.insert({
                    auth: oauth2Client,
                    part: ["snippet"],
                    requestBody: {
                        snippet: {
                            playlistId: newPlaylistId,
                            resourceId: {
                                kind: "youtube#video",
                                videoId,
                            },
                        },
                    },
                });
            } catch (err) {
                // If something went wrong (e.g., API error), push to failed
                failedTracks.push(track);
            }
        }

        // 5. Return a JSON response with failed tracks (if any)
        return NextResponse.json({
            success: true,
            youtubePlaylistId: newPlaylistId,
            totalTracks: tracks.length,
            failedTracks, // so the frontend can show which ones didn't work
        });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
