import config from "./config";
import { GoogleProfileSchema, type GoogleProfile } from "../models";

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token: string;
}

export function getAuthorizationUrl(state: string): string {
  // Use localhost when running offline
  const redirectUri = process.env.IS_OFFLINE
    ? "http://localhost:3000/oauth/google/callback"
    : config.google.redirectUri!;

  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: redirectUri,
    scope: "openid email profile",
    response_type: "code",
    state: state,
    access_type: "offline",
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string
): Promise<GoogleTokenResponse> {
  const tokenEndpoint = "https://oauth2.googleapis.com/token";

  // Use localhost when running offline
  const redirectUri = process.env.IS_OFFLINE
    ? "http://localhost:3000/oauth/google/callback"
    : config.google.redirectUri!;

  const body = new URLSearchParams({
    client_id: config.google.clientId,
    client_secret: config.google.clientSecret,
    code: code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

export async function getProfile(accessToken: string): Promise<GoogleProfile> {
  const profileEndpoint = "https://www.googleapis.com/oauth2/v2/userinfo";

  const response = await fetch(profileEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Profile fetch failed: ${response.status} ${errorText}`);
  }

  const profileData = await response.json();
  
  // Validate the profile data with our schema
  return GoogleProfileSchema.parse(profileData);
}
