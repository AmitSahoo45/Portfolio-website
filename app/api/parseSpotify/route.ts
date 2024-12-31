import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import querystring from "node:querystring";

declare global {
    var __SPOTIFY_TRACKS__: { trackName: string; artistName: string }[];
}

export async function POST(request: NextRequest) {
    try {
        console.log("Parsing Spotify playlist...");
        const { spotifyUrl } = await request.json();

        let playlistId = "";
        let accessToken = "";

        // 1) Extract the playlist ID
        const match = spotifyUrl.match(/playlist\/([A-Za-z0-9]+)/);
        if (match) {
            playlistId = match[1];
        } else {
            return NextResponse.json(
                { error: "Invalid Spotify playlist URL" },
                { status: 400 }
            );
        }

        console.log("Playlist ID:", playlistId);

        const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
        const clientSecret = process.env.NEXT_PUBLIC_CLIENT_SECRET;

        console.log("Client ID:", clientId);
        console.log("Client Secret:", clientSecret);

        const tokenData = querystring.stringify({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
        });

        const tokenResponse = await axios.post(
            "https://accounts.spotify.com/api/token",
            tokenData,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        accessToken = tokenResponse.data.access_token;
        console.log("Access token:", accessToken);

        const playlistResponse = await axios.get(
            `https://api.spotify.com/v1/playlists/${playlistId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const playlistData = playlistResponse.data;
        console.log("Playlist data:", playlistData);

        const tracks = (playlistData.tracks.items || []).map((item: any) => {
            const trackName = item.track?.name || "";
            const artistName = item.track?.artists?.[0]?.name || "Unknown Artist";
            return { trackName, artistName };
        });
        console.log("Tracks:", tracks);

        return NextResponse.json({ success: true, tracks });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
