export const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
export const CLIENT_SECRET = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!;
export const REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL || "http://localhost:3000/api/auth/youtube";
export const SCOPES = [process.env.NEXT_PUBLIC_GOOGLE_YOUTUBE_SCOPES];
export const HOSTED_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";