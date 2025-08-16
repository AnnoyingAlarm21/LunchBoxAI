import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

// This route checks and returns the current auth configuration
export async function GET(request: NextRequest) {
  // Get the current origin
  const url = new URL(request.url);
  const origin = url.origin;
  
  // Return the current configuration
  return NextResponse.json({
    origin,
    supabaseUrl: API_CONFIG.SUPABASE.URL,
    supabaseAuthCallback: API_CONFIG.SUPABASE.AUTH_CALLBACK,
    googleRedirectUri: API_CONFIG.GOOGLE.REDIRECT_URI,
    discordRedirectUri: API_CONFIG.DISCORD.REDIRECT_URI,
    // Don't expose secrets
    hasGoogleClientId: !!API_CONFIG.GOOGLE.CLIENT_ID,
    hasDiscordClientId: !!API_CONFIG.DISCORD.CLIENT_ID,
    environment: process.env.NODE_ENV,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'not set',
  });
}
