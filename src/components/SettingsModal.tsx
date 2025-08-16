'use client';

import { useState } from 'react';
import { XMarkIcon, CalendarIcon, PhoneIcon, ChatBubbleLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Connection {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  isConnected: boolean;
  color: string;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [connections, setConnections] = useState<Connection[]>([
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      icon: <CalendarIcon className="w-6 h-6" />,
      description: 'Sync your tasks with Google Calendar',
      isConnected: false,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'phone',
      name: 'Phone Number',
      icon: <PhoneIcon className="w-6 h-6" />,
      description: 'Get SMS reminders for important tasks',
      isConnected: false,
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: <ChatBubbleLeftIcon className="w-6 h-6" />,
      description: 'Create tasks directly from Discord',
      isConnected: false,
      color: 'from-purple-500 to-pink-600'
    }
  ]);

  const toggleConnection = (id: string) => {
    setConnections(prev => prev.map(conn => 
      conn.id === id ? { ...conn, isConnected: !conn.isConnected } : conn
    ));
  };

  const handleConnect = async (connection: Connection) => {
    // Simulate connection process
    if (connection.id === 'google-calendar') {
      // In a real app, this would open Google OAuth
      alert('Opening Google Calendar authorization...');
    } else if (connection.id === 'phone') {
      const phone = prompt('Enter your phone number:');
      if (phone) {
        alert(`Verification code sent to ${phone}`);
      }
    } else if (connection.id === 'discord') {
      // In a real app, this would open Discord OAuth
      alert('Opening Discord authorization...');
    }
    
    toggleConnection(connection.id);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Settings & Connections</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Connect your accounts to enhance your Lunchbox.ai experience
            </p>
          </div>

          {/* Connections */}
          <div className="p-6 space-y-4">
            {connections.map((connection) => (
              <motion.div
                key={connection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  connection.isConnected 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${connection.color} flex items-center justify-center text-white`}>
                      {connection.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{connection.name}</h3>
                      <p className="text-sm text-gray-600">{connection.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {connection.isConnected && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">Connected</span>
                      </div>
                    )}
                    <button
                      onClick={() => handleConnect(connection)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        connection.isConnected
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : `bg-gradient-to-r ${connection.color} hover:opacity-90 text-white`
                      }`}
                    >
                      {connection.isConnected ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Your data is encrypted and secure. We never share your personal information.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
