import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  console.log('Spotify callback received:', { code: !!code, error, url: request.url });

  if (error) {
    // Handle OAuth errors
    console.log('Spotify OAuth error, redirecting to main page with error');
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://lunch-box-ai.vercel.app'}?error=spotify_` + error
    );
  }

  if (code) {
    // Successful OAuth - redirect back to main page with code
    console.log('Spotify OAuth success, redirecting to main page');
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://lunch-box-ai.vercel.app'}?spotify_code=` + code
    );
  }

  // No code or error - redirect to main page
  console.log('No Spotify OAuth params, redirecting to main page');
  return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL || 'https://lunch-box-ai.vercel.app');
}
