import { NextRequest, NextResponse } from 'next/server';

// This route returns the correct redirect URL based on the environment
export async function GET(request: NextRequest) {
  // Get the current origin
  const url = new URL(request.url);
  const origin = url.origin;
  const isLocalhost = origin.includes('localhost');
  
  // Always use production URL for redirects in production
  const redirectUrl = isLocalhost 
    ? `${origin}/auth/callback` 
    : 'https://lunch-box-ai.vercel.app/auth/callback';
  
  console.log('Auth config requested, returning redirectUrl:', redirectUrl);
  
  // Return the redirect URL as JSON
  return NextResponse.json({ redirectUrl });
}
