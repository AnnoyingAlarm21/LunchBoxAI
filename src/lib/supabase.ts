import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '@/config/api';

const supabaseUrl = API_CONFIG.SUPABASE.URL;
const supabaseAnonKey = API_CONFIG.SUPABASE.ANON_KEY;

// Create Supabase client with the configured credentials
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helper functions
export const auth = {
  // Sign in with Google
  signInWithGoogle: async () => {
    // HARDCODED PRODUCTION URL - This is the most reliable solution
    const redirectUrl = 'https://lunch-box-ai.vercel.app/auth/callback';
    console.log('Google OAuth redirectUrl (HARDCODED):', redirectUrl);
      
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
    return { data, error };
  },

  // Sign in with Discord
  signInWithDiscord: async () => {
    // HARDCODED PRODUCTION URL - This is the most reliable solution
    const redirectUrl = 'https://lunch-box-ai.vercel.app/auth/callback';
    console.log('Discord OAuth redirectUrl (HARDCODED):', redirectUrl);
      
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: redirectUrl
      }
    });
    return { data, error };
  },

  // Spotify functionality removed

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  }
};

// Database helper functions
export const db = {
  // Get user profile
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  // Update user profile
  updateUserProfile: async (userId: string, updates: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId);
    return { data, error };
  },

  // Create user profile
  createUserProfile: async (profile: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single();
    return { data, error };
  }
};
