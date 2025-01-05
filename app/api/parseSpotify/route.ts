import { Playlist } from "@/app/types/playlist";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import querystring from "node:querystring";

declare global {
    var __SPOTIFY_TRACKS__: { trackName: string; artistName: string }[];
}

export async function POST(request: NextRequest) {
    try {
        const { spotifyUrl } = await request.json();

        let playlistId = "",
            accessToken = "";

        const match = spotifyUrl.match(/playlist\/([A-Za-z0-9]+)/);
        if (match) {
            playlistId = match[1];
        } else {
            return NextResponse.json(
                { error: "Invalid Spotify playlist URL" },
                { status: 400 }
            );
        }


        const clientId = process.env.NEXT_PUBLIC_CLIENT_ID,
            clientSecret = process.env.NEXT_PUBLIC_CLIENT_SECRET;

        const tokenData = querystring.stringify({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
        });

        const { data } = await axios.post("https://accounts.spotify.com/api/token", tokenData, { headers: { "Content-Type": "application/x-www-form-urlencoded" } });

        accessToken = data.access_token;

        const { data: playlistData } = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, { headers: { Authorization: `Bearer ${accessToken}` } });
        console.log(playlistData)
        const tracks = (playlistData.tracks.items || []).map((item: any) => {
            const trackName = item.track?.name || "";
            const artistName = item.track?.artists?.[0]?.name || "Unknown Artist";
            return { trackName, artistName };
        });

        const playlist: Playlist = {
            name: playlistData.name,
            description: playlistData.description,
            ownerName: playlistData.owner.display_name,
            tracks
        }

        globalThis["__SPOTIFY_TRACKS__"] = tracks;

        return NextResponse.json({ success: true, playlist });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
