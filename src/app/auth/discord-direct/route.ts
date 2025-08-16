import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Discord OAuth parameters
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '';
  const redirectUri = 'https://lunch-box-ai.vercel.app/auth/callback';
  const scope = 'identify email';
  const responseType = 'code';
  
  // Build the Discord OAuth URL
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}`;
  
  console.log('Direct Discord login URL:', discordAuthUrl);
  
  // Redirect to Discord OAuth
  return NextResponse.redirect(discordAuthUrl);
}
