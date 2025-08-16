import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  console.log('Auth callback received:', { code: !!code, error, url: request.url });

  if (error) {
    // Handle OAuth errors
    console.log('OAuth error, redirecting to main page with error');
    return NextResponse.redirect(
      'http://localhost:3000?error=' + error
    );
  }

  if (code) {
    // Successful OAuth - redirect back to main page
    console.log('OAuth success, redirecting to main page');
    return NextResponse.redirect(
      'http://localhost:3000?auth=success&code=' + code
    );
  }

  // No code or error - redirect to main page
  console.log('No OAuth params, redirecting to main page');
  return NextResponse.redirect('http://localhost:3000');
}
