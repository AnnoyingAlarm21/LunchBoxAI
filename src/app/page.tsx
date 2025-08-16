'use client';

import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, PaperClipIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { groqService, GroqMessage } from '@/services/groqService';
import { userProfileService, UserProfile } from '@/services/userProfileService';
// Spotify functionality removed
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
  const [user, setUser] = useState<User | null>(null);
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

  // Spotify functionality removed

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

  // Spotify functionality removed

  // DIRECT GOOGLE LOGIN - Bypass Supabase
  const handleDirectGoogleLogin = () => {
    // Directly redirect to Google OAuth
    const clientId = '469811368622-9i9sdihjmb7akcd0q18jcjmcmh6o73ev.apps.googleusercontent.com';
    const redirectUri = 'https://lunch-box-ai.vercel.app/auth/callback';
    const scope = 'email profile';
    const responseType = 'code';
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}`;
    
    console.log('Direct Google login URL:', googleAuthUrl);
    window.location.href = googleAuthUrl;
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
            {!user ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDirectGoogleLogin}
                  className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Sign in with Google (Direct)
                </button>
                <a 
                  href="https://caxkvknseivgyfuddlym.supabase.co/auth/v1/authorize?provider=discord&redirect_to=https://lunch-box-ai.vercel.app/auth/callback"
                  className="px-3 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Sign in with Discord (Direct)
                </a>
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

          {/* Spotify functionality removed */}

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