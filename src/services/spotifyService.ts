import { supabase } from '@/lib/supabase';

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  previewUrl?: string;
  spotifyUrl: string;
  duration: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: SpotifyTrack[];
}

export class SpotifyService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage
    this.loadTokens();
  }

  private loadTokens() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('spotify_access_token');
      this.refreshToken = localStorage.getItem('spotify_refresh_token');
    }
  }

  private saveTokens(accessToken: string, refreshToken: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('spotify_access_token', accessToken);
      localStorage.setItem('spotify_refresh_token', refreshToken);
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
    }
  }

  // Initialize Spotify authentication
  async authenticate(): Promise<void> {
    // Use direct Spotify OAuth instead of Supabase
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/auth/spotify/callback'
      : 'https://lunch-box-ai.vercel.app/auth/spotify/callback';
    
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'playlist-read-private',
      'playlist-read-collaborative',
      'streaming'
    ].join(' ');
    
    const authUrl = `https://accounts.spotify.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    
    console.log('Direct Spotify OAuth URL:', authUrl);
    window.location.href = authUrl;
  }

  // Handle authentication callback - now handled by Supabase
  async handleCallback(_code: string): Promise<boolean> {
    // This is now handled by Supabase OAuth
    // The access token will be available through Supabase session
    return true;
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const hasProviderToken = !!session?.provider_token;
      const provider = session?.user?.app_metadata?.provider;
      
      console.log('=== SPOTIFY AUTH DEBUG ===');
      console.log('Session exists:', !!session);
      console.log('User exists:', !!session?.user);
      console.log('OAuth provider:', provider);
      console.log('Provider token:', session?.provider_token ? '✅ Present' : '❌ Missing');
      console.log('Token preview:', session?.provider_token ? session.provider_token.substring(0, 20) + '...' : 'none');
      console.log('========================');
      
      // Only return true if we have a Spotify provider token (not Google)
      if (hasProviderToken && provider === 'spotify') {
        // Check if it's not a Google token
        if (!session.provider_token.startsWith('ya29.')) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking Spotify auth:', error);
      return false;
    }
  }

  // Search for tracks based on mood/activity
  async searchTracks(query: string, limit: number = 5): Promise<SpotifyTrack[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check what OAuth provider we actually have
      const providerToken = session?.provider_token;
      const accessToken = session?.access_token;
      
      console.log('=== SPOTIFY SEARCH DEBUG ===');
      console.log('Provider token type:', providerToken ? providerToken.substring(0, 20) + '...' : 'none');
      console.log('Access token type:', accessToken ? accessToken.substring(0, 20) + '...' : 'none');
      console.log('Session user:', session?.user?.app_metadata?.provider);
      console.log('==========================');
      
      // For Spotify, we need the provider_token to be a valid Spotify token
      const spotifyToken = providerToken;
      
      if (!spotifyToken) {
        throw new Error('Not authenticated with Spotify - no provider token found');
      }
      
      // Check if this looks like a Spotify token (should not start with 'ya29.')
      if (spotifyToken.startsWith('ya29.')) {
        throw new Error('Invalid Spotify token - this appears to be a Google OAuth token. Please reconnect to Spotify.');
      }

      const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`;
      console.log('Search URL:', searchUrl);
      
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Spotify API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Spotify API error response:', errorText);
        throw new Error(`Failed to search Spotify: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Spotify API response data:', data);
      
      if (!data.tracks || !data.tracks.items) {
        console.error('Unexpected Spotify API response structure:', data);
        return [];
      }

      return data.tracks.items.map((track: {
        id: string;
        name: string;
        artists: Array<{ name: string }>;
        album: { name: string; images: Array<{ url: string }> };
        preview_url?: string;
        external_urls: { spotify: string };
        duration_ms: number;
      }) => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        albumArt: track.album.images[0]?.url || '',
        previewUrl: track.preview_url,
        spotifyUrl: track.external_urls.spotify,
        duration: track.duration_ms
      }));
    } catch (error) {
      console.error('Error searching Spotify:', error);
      throw error; // Re-throw to see the actual error
    }
  }

  // Get music suggestions based on user input
  async getMusicSuggestions(userInput: string): Promise<SpotifyTrack[]> {
    const lowerInput = userInput.toLowerCase();
    let searchQuery = '';

    // Map user input to music moods/genres with more specific queries
    if (lowerInput.includes('study') || lowerInput.includes('homework') || lowerInput.includes('focus')) {
      searchQuery = 'lofi hip hop study beats';
    } else if (lowerInput.includes('workout') || lowerInput.includes('exercise') || lowerInput.includes('gym')) {
      searchQuery = 'high energy workout music 2024';
    } else if (lowerInput.includes('chill') || lowerInput.includes('relax') || lowerInput.includes('calm')) {
      searchQuery = 'chill lofi beats';
    } else if (lowerInput.includes('party') || lowerInput.includes('fun') || lowerInput.includes('dance')) {
      searchQuery = 'party hits 2024 dance music';
    } else if (lowerInput.includes('sleep') || lowerInput.includes('bedtime')) {
      searchQuery = 'sleep meditation ambient music';
    } else if (lowerInput.includes('sad') || lowerInput.includes('down') || lowerInput.includes('moody')) {
      searchQuery = 'melancholy indie music';
    } else if (lowerInput.includes('happy') || lowerInput.includes('upbeat') || lowerInput.includes('positive')) {
      searchQuery = 'happy pop music 2024';
    } else if (lowerInput.includes('rap') || lowerInput.includes('hip hop')) {
      searchQuery = 'hip hop rap 2024';
    } else if (lowerInput.includes('rock') || lowerInput.includes('guitar')) {
      searchQuery = 'rock music 2024';
    } else if (lowerInput.includes('electronic') || lowerInput.includes('edm')) {
      searchQuery = 'electronic dance music 2024';
    } else if (lowerInput.includes('jazz') || lowerInput.includes('smooth')) {
      searchQuery = 'smooth jazz music';
    } else if (lowerInput.includes('classical') || lowerInput.includes('piano')) {
      searchQuery = 'classical piano music';
    } else {
      // Default to trending music
      searchQuery = 'trending songs 2024';
    }

    console.log('Searching for music with query:', searchQuery);
    return await this.searchTracks(searchQuery, 5);
  }

  // Create a playlist for the user
  async createPlaylist(name: string, tracks: SpotifyTrack[]): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.provider_token;
    
    if (!accessToken) {
      throw new Error('Not authenticated with Spotify');
    }

    try {
      // First create the playlist
      const userResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!userResponse.ok) return null;
      const userData = await userResponse.json();

      const playlistResponse = await fetch(`https://api.spotify.com/v1/users/${userData.id}/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Lunchbox.ai - ${name}`,
          description: 'Created by Lunchbox.ai for your tasks!',
          public: false
        })
      });

      if (!playlistResponse.ok) return null;
      const playlistData = await playlistResponse.json();

      // Add tracks to the playlist
      if (tracks.length > 0) {
        const trackUris = tracks.map(track => `spotify:track:${track.id}`);
        await fetch(`https://api.spotify.com/v1/playlists/${playlistData.id}/tracks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: trackUris
          })
        });
      }

      return playlistData.external_urls.spotify;
    } catch (error) {
      console.error('Error creating Spotify playlist:', error);
      return null;
    }
  }

  // Play a track (requires Spotify app to be open)
  async playTrack(trackId: string): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.provider_token;
    
    if (!accessToken) {
      throw new Error('Not authenticated with Spotify');
    }

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [`spotify:track:${trackId}`]
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error playing track:', error);
      return false;
    }
  }

  // Logout
  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('spotify_access_token');
      localStorage.removeItem('spotify_refresh_token');
      this.accessToken = null;
      this.refreshToken = null;
    }
  }
}

// Export a singleton instance
export const spotifyService = new SpotifyService();
