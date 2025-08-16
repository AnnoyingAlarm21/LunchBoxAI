# 🚀 Deployment Guide for Lunchbox.ai

## Vercel Deployment

### 1. Prepare Your Repository
```bash
# Make sure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3. Environment Variables
Add these environment variables in your Vercel project settings:

#### Required Variables:
```env
# Groq API
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Discord OAuth
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here

# Spotify API
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here

# App URL (will be your Vercel domain)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 4. Update Spotify Configuration
After deployment, update your Spotify app settings:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Add redirect URI: `https://your-app.vercel.app/auth/spotify/callback`
4. Update the environment variable in Vercel

### 5. Update Supabase Auth Settings
1. Go to your Supabase project dashboard
2. Navigate to Authentication > URL Configuration
3. Add your Vercel domain to the Site URL
4. Update redirect URLs to include your Vercel domain

### 6. Deploy and Test
1. Click "Deploy" in Vercel
2. Wait for build to complete
3. Test all authentication flows:
   - Google Sign-in
   - Discord Sign-in
   - Spotify Connection
   - AI Chat functionality

## Post-Deployment Checklist

- [ ] All environment variables are set
- [ ] Spotify redirect URI is updated
- [ ] Supabase auth URLs are configured
- [ ] Google OAuth is working
- [ ] Discord OAuth is working
- [ ] Spotify integration is working
- [ ] AI chat is functioning
- [ ] Music suggestions are working

## Troubleshooting

### Common Issues:
1. **Environment Variables**: Make sure all variables are set in Vercel
2. **Redirect URIs**: Verify all OAuth redirect URIs match your Vercel domain
3. **CORS**: Check if any CORS errors appear in browser console
4. **API Routes**: Ensure `/api/spotify/token` route is accessible

### Debug Steps:
1. Check Vercel function logs
2. Verify environment variables in Vercel dashboard
3. Test API endpoints individually
4. Check browser console for errors

## Support
If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables
3. Test locally with production URLs
4. Check Supabase and Spotify dashboard configurations
