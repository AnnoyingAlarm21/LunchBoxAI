'use client';

import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, PaperClipIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { groqService, GroqMessage } from '@/services/groqService';
import { userProfileService, UserProfile } from '@/services/userProfileService';
import { spotifyService, SpotifyTrack } from '@/services/spotifyService';
import MusicPlayer from '@/components/MusicPlayer';
import { auth, supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [musicSuggestions, setMusicSuggestions] = useState<SpotifyTrack[]>([]);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [spotifyAuthenticated, setSpotifyAuthenticated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for existing user profile on component mount
  useEffect(() => {
    const existingProfile = userProfileService.loadProfile();
    if (existingProfile && existingProfile.onboardingComplete) {
      setUserProfile(existingProfile);
      // Add welcome back message
      const welcomeBackMessage: Message = {
        id: `welcome-back-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: "Welcome back! What's on your plate today?",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages([welcomeBackMessage]);
    } else {
      // Start onboarding in chat
      const onboardingMessage: Message = {
        id: `onboarding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: "Hey! I'm your Lunchbox.ai buddy. Let me get to know you first. Do you play sports?",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages([onboardingMessage]);
    }
  }, []);

  // Check authentication status
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check Spotify authentication status
  useEffect(() => {
    const checkSpotifyAuth = async () => {
      try {
        const isAuth = await spotifyService.isAuthenticated();
        console.log('Setting Spotify auth state:', isAuth);
        setSpotifyAuthenticated(isAuth);
      } catch (error) {
        console.error('Error checking Spotify auth:', error);
        setSpotifyAuthenticated(false);
      }
    };
    
    checkSpotifyAuth();
    
    // Also check when the page becomes visible (after OAuth redirect)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(checkSpotifyAuth, 1000); // Check after 1 second
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]); // Re-check when user changes

  // Check for OAuth redirects and refresh auth status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth');
    const error = urlParams.get('error');
    const code = urlParams.get('code');
    
    console.log('Checking OAuth params:', { authSuccess, error, code });
    
    if (authSuccess === 'success' || code) {
      console.log('OAuth success detected, clearing URL and refreshing auth');
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Refresh authentication status after a short delay
      setTimeout(async () => {
        try {
          const isAuth = await spotifyService.isAuthenticated();
          console.log('Auth refresh result:', isAuth);
          setSpotifyAuthenticated(isAuth);
          
          if (isAuth) {
            // Show success message
            const successMessage: Message = {
              id: `spotify-success-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              text: "🎵 Spotify connected successfully! Now I can suggest music for you!",
              sender: 'ai',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, successMessage]);
          }
        } catch (error) {
          console.error('Error refreshing auth status:', error);
        }
      }, 2000); // Increased delay to 2 seconds
    } else if (error) {
      console.log('OAuth error detected:', error);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Show error message
      const errorMessage: Message = {
        id: `oauth-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: `❌ Spotify connection was cancelled. Let's try again!`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, []);

  const handleConnectSpotify = async () => {
    try {
      console.log('Starting Spotify OAuth...');
      console.log('Current environment:', process.env.NODE_ENV);
      console.log('Current origin:', window.location.origin);
      
      const { data, error } = await auth.signInWithSpotify();
      
      if (error) {
        console.error('Spotify OAuth error:', error);
      } else {
        console.log('Spotify OAuth initiated:', data);
        // Check if we need to redirect
        if (data?.url) {
          console.log('Full redirect URL:', data.url);
          console.log('About to redirect...');
          // Use window.open for OAuth to avoid redirect issues
          window.open(data.url, '_self');
        } else {
          console.log('No redirect URL received from OAuth');
        }
      }
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

            const userMessage: Message = {
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: inputText,
          sender: 'user',
          timestamp: new Date()
        };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      if (!userProfile?.onboardingComplete) {
        // Handle onboarding responses
        const onboardingResponse = handleOnboardingResponse(inputText);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: onboardingResponse.text,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        
        if (onboardingResponse.complete) {
          const completedProfile = userProfileService.completeOnboarding(onboardingResponse.interests);
          if (completedProfile) {
            setUserProfile(completedProfile);
            const welcomeMessage: Message = {
              id: (Date.now() + 2).toString(),
              text: "Perfect! Now what's on your plate today?",
              sender: 'ai',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, welcomeMessage]);
          }
        }
      } else {
        // Check for music requests first
        await checkForMusicRequest(inputText);
        
        // Normal AI chat
        const groqMessages: GroqMessage[] = messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

        groqMessages.push({
          role: 'user',
          content: inputText
        });

        const aiResponse = await groqService.chat(groqMessages);
        
        const aiMessage: Message = {
          id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: aiResponse,
          sender: 'ai',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleOnboardingResponse = (userInput: string) => {
    const lowerInput = userInput.toLowerCase();
    const currentStep = messages.filter(m => m.sender === 'ai').length - 1;
    
    if (currentStep === 1) {
      // Sports question
      const likesSports = lowerInput.includes('yes') || lowerInput.includes('yeah') || lowerInput.includes('sure');
      return {
        text: likesSports ? "Cool! Do you like to go out with friends?" : "Got it. Do you like to go out with friends?",
        interests: { sports: likesSports, socializing: false, gaming: false, otherInterests: [] },
        complete: false
      };
    } else if (currentStep === 2) {
      // Socializing question
      const likesSocializing = lowerInput.includes('yes') || lowerInput.includes('yeah') || lowerInput.includes('sure');
      return {
        text: likesSocializing ? "Nice! Do you play games with friends?" : "Got it. Do you play games with friends?",
        interests: { sports: true, socializing: likesSocializing, gaming: false, otherInterests: [] },
        complete: false
      };
    } else if (currentStep === 3) {
      // Gaming question
      const likesGaming = lowerInput.includes('yes') || lowerInput.includes('yeah') || lowerInput.includes('sure');
      return {
        text: "Anything else you like?",
        interests: { sports: true, socializing: true, gaming: likesGaming, otherInterests: [] },
        complete: false
      };
    } else if (currentStep === 4) {
      // Other interests
      return {
        text: "Got it! What's on your plate today?",
        interests: { sports: true, socializing: true, gaming: true, otherInterests: [userInput] },
        complete: true
      };
    }
    
    return {
      text: "Do you play sports?",
      interests: { sports: false, socializing: false, gaming: false, otherInterests: [] },
      complete: false
    };
  };

  // Check if user input is music-related and get suggestions
  const checkForMusicRequest = async (userInput: string) => {
    const musicKeywords = ['music', 'song', 'playlist', 'spotify', 'listen', 'sound', 'beat', 'rhythm', 'melody', 'tune', 'play', 'sing', 'dance', 'jam', 'vibes', 'mood', 'energy'];
    const hasMusicKeyword = musicKeywords.some(keyword => userInput.toLowerCase().includes(keyword));
    
    if (hasMusicKeyword) {
      if (spotifyAuthenticated) {
        try {
          const suggestions = await spotifyService.getMusicSuggestions(userInput);
          if (suggestions.length > 0) {
            setMusicSuggestions(suggestions);
            setShowMusicPlayer(true);
            
            // Add AI message about the music suggestions
            const musicMessage: Message = {
              id: `music-suggestions-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              text: `🎵 Great idea! Here are some songs that might match your vibe. You can play them directly or save them to a playlist!`,
              sender: 'ai',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, musicMessage]);
            
            return true;
          } else {
            // No suggestions found
            const noMusicMessage: Message = {
              id: `no-music-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              text: `🎵 I couldn't find any songs matching "${userInput}". Try asking for a different type of music!`,
              sender: 'ai',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, noMusicMessage]);
            return true;
          }
        } catch (error) {
          console.error('Error getting music suggestions:', error);
          
          // Show error message to user
          const errorMessage: Message = {
            id: Date.now().toString(),
            text: `❌ Sorry, I couldn't get music suggestions right now. The error was: ${error instanceof Error ? error.message : 'Unknown error'}`,
            sender: 'ai',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          return true;
        }
      } else {
        // User wants music but Spotify isn't connected
        const connectMessage: Message = {
          id: Date.now().toString(),
          text: `🎵 I'd love to suggest some music for you! First, let's connect your Spotify account so I can find the perfect songs. Click "Connect Spotify" in the header!`,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, connectMessage]);
        return true;
      }
    }
    return false;
  };

  // Handle playing a track
  const handlePlayTrack = async (trackId: string) => {
    try {
      await spotifyService.playTrack(trackId);
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  // Handle creating a playlist
  const handleCreatePlaylist = async (tracks: SpotifyTrack[]) => {
    try {
      const playlistUrl = await spotifyService.createPlaylist('Task Music', tracks);
      if (playlistUrl) {
        // Add message about playlist creation
        const playlistMessage: Message = {
          id: `playlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: `I've created a Spotify playlist for you! Check it out: ${playlistUrl}`,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, playlistMessage]);
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🥪</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">Lunchbox.ai</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {!spotifyAuthenticated ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleConnectSpotify}
                  className="px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Connect Spotify
                </button>
                <button
                  onClick={async () => {
                    try {
                      const isAuth = await spotifyService.isAuthenticated();
                      console.log('Manual refresh - Spotify auth:', isAuth);
                      setSpotifyAuthenticated(isAuth);
                    } catch (error) {
                      console.error('Error during manual refresh:', error);
                    }
                  }}
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  title="Refresh Spotify connection status"
                >
                  🔄
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-green-600 text-sm font-medium">🎵 Spotify Connected</span>
                <button
                  onClick={async () => {
                    try {
                      // Sign out from Supabase (which includes Spotify)
                      const { error } = await auth.signOut();
                      if (error) {
                        console.error('Error signing out from Spotify:', error);
                      } else {
                        // Update UI state
                        setSpotifyAuthenticated(false);
                        // Show disconnect message
                                const disconnectMessage: Message = {
          id: `spotify-disconnect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: "🎵 Disconnected from Spotify. You can reconnect anytime!",
          sender: 'ai',
          timestamp: new Date()
        };
                        setMessages(prev => [...prev, disconnectMessage]);
                      }
                    } catch (error) {
                      console.error('Error during Spotify sign out:', error);
                    }
                  }}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Sign Out Spotify
                </button>
              </div>
            )}
            
            {!user ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => auth.signInWithGoogle()}
                  className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Sign in with Google
                </button>
                <button
                  onClick={() => auth.signInWithDiscord()}
                  className="px-3 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Sign in with Discord
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Hi, {user.email || user.user_metadata?.full_name || 'User'}!
                </span>
                <button
                  onClick={() => auth.signOut()}
                  className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full text-center">
          {/* Main Heading */}
          <h2 className="text-3xl font-semibold text-gray-800 mb-8">
            What can I help you pack today?
          </h2>

          {/* Chat Messages - Moved above input */}
          {messages.length > 0 && (
            <div className="mb-8 max-h-96 overflow-y-auto scrollbar-hide">
              <div className="space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-2xl ${
                          message.sender === 'user'
                            ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line">{message.text}</p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Music Player */}
          {showMusicPlayer && musicSuggestions.length > 0 && (
            <MusicPlayer
              tracks={musicSuggestions}
              onPlayTrack={handlePlayTrack}
              onCreatePlaylist={handleCreatePlaylist}
            />
          )}

          {/* Chat Input */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                <span className="text-sm font-medium text-gray-700">o3-mini</span>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <GlobeAltIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Tell me what's on your plate today..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-left"
              />
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <PaperClipIcon className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleSendMessage}
                className="p-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-6">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="text-gray-600">X</span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="text-gray-600">GitHub</span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="text-gray-600">Discord</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-800 transition-colors">Privacy</a>
            <span>/</span>
            <a href="#" className="hover:text-gray-800 transition-colors">Terms</a>
            <span>/</span>
            <a href="#" className="hover:text-gray-800 transition-colors">Help center</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
