'use client';

import { useState } from 'react';
import { PlayIcon, PauseIcon, MusicalNoteIcon, PlusIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { SpotifyTrack } from '@/services/spotifyService';

interface MusicPlayerProps {
  tracks: SpotifyTrack[];
  onPlayTrack: (trackId: string) => void;
  onCreatePlaylist: (tracks: SpotifyTrack[]) => void;
}

export default function MusicPlayer({ tracks, onPlayTrack, onCreatePlaylist }: MusicPlayerProps) {
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);

  const handlePlayTrack = (trackId: string) => {
    setPlayingTrack(trackId);
    onPlayTrack(trackId);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (tracks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <MusicalNoteIcon className="w-5 h-5 text-green-500" />
          <h3 className="font-medium text-gray-800">Music Suggestions</h3>
        </div>
        <button
          onClick={() => onCreatePlaylist(tracks)}
          className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Save Playlist</span>
        </button>
      </div>

      <div className="space-y-2">
        {tracks.map((track) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Image
              src={track.albumArt}
              alt={track.album}
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg object-cover"
            />
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{track.name}</p>
              <p className="text-sm text-gray-600 truncate">{track.artist}</p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">{formatDuration(track.duration)}</span>
              <button
                onClick={() => handlePlayTrack(track.id)}
                className={`p-2 rounded-full transition-colors ${
                  playingTrack === track.id
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'
                }`}
              >
                {playingTrack === track.id ? (
                  <PauseIcon className="w-4 h-4" />
                ) : (
                  <PlayIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
