"use client";

import axios from "axios";
import { useState } from "react";

const Dashboard = () => {
    const [spotifyUrl, setSpotifyUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [conversionResult, setConversionResult] = useState<any>(null);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setConversionResult(null);

        try {
            // 1) Hit an API route to parse the Spotify playlist & store track data in session (or DB)
            // const parseRes = await fetch("/api/parseSpotify", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({ spotifyUrl }),
            // });

            // if (!parseRes.ok) {
            //     throw new Error("Failed to parse Spotify playlist");
            // }

            const parseRes = await axios.post("/api/parseSpotify", { spotifyUrl });

            // 2) Redirect the user to Google OAuth
            window.location.href = "/api/auth/youtube";
            // This route will handle Google login. 
            // After Google login, you’ll create the YouTube playlist in a callback.

        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };



    return (
        <div>
            <h1>Spotify to YouTube Converter</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Enter Spotify Playlist URL"
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Processing..." : "Convert"}
                </button>
            </form>
            {error && <p style={{ color: "red" }}>Error: {error}</p>}
            {conversionResult && (
                <div>
                    <p>Conversion done! YouTube link: {conversionResult.youtubeLink}</p>
                </div>
            )}
        </div>
    )
}

export default Dashboard