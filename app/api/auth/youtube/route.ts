import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!;
const REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL || "http://localhost:3000/api/auth/youtube";

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URL
);

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    console.log("Search params:", searchParams.toString());
    console.log(request.url);

    const code = searchParams.get("code");
    console.log("Code:", code);
    if (!code) {
        const scopes = ["https://www.googleapis.com/auth/youtube"];
        const url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: scopes,
            redirect_uri: REDIRECT_URL,
            prompt: "consent",
        });
        return NextResponse.redirect(url);
    }

    try {
        const { tokens } = await oauth2Client.getToken({
            code,
            redirect_uri: REDIRECT_URL,
        });
        oauth2Client.setCredentials(tokens);

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

        const failedTracks: Array<{ trackName: string; artistName: string }> = [];
        const tracks = globalThis["__SPOTIFY_TRACKS__"] || [];

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
                    failedTracks.push(track);
                    continue;
                }

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
                failedTracks.push(track);
            }
        }

        return NextResponse.json({
            success: true,
            youtubePlaylistId: newPlaylistId,
            totalTracks: tracks.length,
            failedTracks, 
        });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
