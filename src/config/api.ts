// API Configuration for Lunchbox.ai
export const API_CONFIG = {
  // Groq API for AI features
  GROQ: {
    API_KEY: process.env.NEXT_PUBLIC_GROQ_API_KEY || '',
    BASE_URL: 'https://api.groq.com/openai/v1',
    MODEL: process.env.NEXT_PUBLIC_GROQ_MODEL || 'llama3-8b-8192' // Using Llama3 model
  },
  
  // Supabase Configuration
  SUPABASE: {
    URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    AUTH_CALLBACK: process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback` : ''
  },
  
  // Google OAuth via Supabase
  GOOGLE: {
    CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    REDIRECT_URI: process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback` : '',
    SCOPES: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]
  },
  
  // Discord OAuth via Supabase
  DISCORD: {
    CLIENT_ID: '', // Add your Discord client ID here
    CLIENT_SECRET: '', // Add your Discord client secret here
    REDIRECT_URI: 'https://caxkvknseivgyfuddlym.supabase.co/auth/v1/callback',
    SCOPES: ['identify', 'guilds']
  },
  
  // Spotify OAuth (will use Vercel URL)
  SPOTIFY: {
    CLIENT_ID: '', // Add your Spotify client ID here
    CLIENT_SECRET: '', // Add your Spotify client secret here
    REDIRECT_URI: '', // Will be set to Vercel URL when deployed
    SCOPES: [
      'user-read-private',
      'user-read-email',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'playlist-read-private',
      'playlist-read-collaborative',
      'streaming'
    ].join(' ')
  }
};

// Environment check
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// API endpoints
export const API_ENDPOINTS = {
  GROQ_CHAT: `${API_CONFIG.GROQ.BASE_URL}/chat/completions`,
  SUPABASE_AUTH: `${API_CONFIG.SUPABASE.URL}/auth/v1`,
  GOOGLE_AUTH: 'https://accounts.google.com/o/oauth2/v2/auth',
  GOOGLE_TOKEN: 'https://oauth2.googleapis.com/token',
  DISCORD_AUTH: 'https://discord.com/api/oauth2/authorize',
  DISCORD_TOKEN: 'https://discord.com/api/oauth2/token',
  SPOTIFY_AUTH: 'https://accounts.spotify.com/oauth2/authorize',
  SPOTIFY_TOKEN: 'https://accounts.spotify.com/api/token'
};
