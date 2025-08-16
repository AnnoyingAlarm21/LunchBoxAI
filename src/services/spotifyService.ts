import { API_CONFIG, API_ENDPOINTS } from '@/config/api';

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
    const redirectUri = API_CONFIG.SPOTIFY.REDIRECT_URI || `${window.location.origin}/auth/spotify/callback`;
    const authUrl = `${API_ENDPOINTS.SPOTIFY_AUTH}?client_id=${API_CONFIG.SPOTIFY.CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(API_CONFIG.SPOTIFY.SCOPES)}`;
    
    window.location.href = authUrl;
  }

  // Handle authentication callback
  async handleCallback(code: string): Promise<boolean> {
    try {
      const response = await fetch('/api/spotify/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      });

      if (response.ok) {
        const data = await response.json();
        this.saveTokens(data.access_token, data.refresh_token);
        return true;
      }
    } catch (error) {
      console.error('Error getting Spotify tokens:', error);
    }
    return false;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Search for tracks based on mood/activity
  async searchTracks(query: string, limit: number = 5): Promise<SpotifyTrack[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Spotify');
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to search Spotify');
      }

      const data = await response.json();
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
      return [];
    }
  }

  // Get music suggestions based on user input
  async getMusicSuggestions(userInput: string): Promise<SpotifyTrack[]> {
    const lowerInput = userInput.toLowerCase();
    let searchQuery = '';

    // Map user input to music moods/genres
    if (lowerInput.includes('study') || lowerInput.includes('homework') || lowerInput.includes('focus')) {
      searchQuery = 'lofi study music';
    } else if (lowerInput.includes('workout') || lowerInput.includes('exercise') || lowerInput.includes('gym')) {
      searchQuery = 'workout motivation music';
    } else if (lowerInput.includes('chill') || lowerInput.includes('relax') || lowerInput.includes('calm')) {
      searchQuery = 'chill vibes music';
    } else if (lowerInput.includes('party') || lowerInput.includes('fun') || lowerInput.includes('dance')) {
      searchQuery = 'party dance music';
    } else if (lowerInput.includes('sleep') || lowerInput.includes('bedtime')) {
      searchQuery = 'sleep ambient music';
    } else if (lowerInput.includes('sad') || lowerInput.includes('down') || lowerInput.includes('moody')) {
      searchQuery = 'sad mood music';
    } else if (lowerInput.includes('happy') || lowerInput.includes('upbeat') || lowerInput.includes('positive')) {
      searchQuery = 'happy upbeat music';
    } else {
      // Default to popular music
      searchQuery = 'popular music 2024';
    }

    return await this.searchTracks(searchQuery, 5);
  }

  // Create a playlist for the user
  async createPlaylist(name: string, tracks: SpotifyTrack[]): Promise<string | null> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Spotify');
    }

    try {
      // First create the playlist
      const userResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
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
    if (!this.accessToken) {
      throw new Error('Not authenticated with Spotify');
    }

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
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
