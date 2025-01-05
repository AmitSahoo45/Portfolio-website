export interface Track {
    trackName: string;
    artistName: string;
}

export interface Playlist {
    name: string;
    description: string;
    ownerName: string;
    tracks: Track[];
}
