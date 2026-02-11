import { motion } from 'framer-motion';
import { Download, X, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';
import { VideoPlayer } from './VideoPlayer';

interface VideoPlayerScreenProps {
  videoUrl: string;
  dreamTitle: string;
  onClose: () => void;
}

export function VideoPlayerScreen({ videoUrl, dreamTitle, onClose }: VideoPlayerScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDownload = async () => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dreamTitle.replace(/[^a-z0-9]/gi, '_')}_dream_video.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
    >
      <div className="relative w-full max-w-4xl">
        {/* Close Button */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-8 h-8" />
        </motion.button>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-white text-2xl font-serif font-bold mb-4 text-center"
        >
          {dreamTitle}
        </motion.h2>

        {/* Video Player */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative bg-black rounded-xl overflow-hidden shadow-2xl"
        >
          <VideoPlayer 
            src={videoUrl}
          />
          
          {/* Play/Pause Overlay */}
          <div 
            className="absolute inset-0 flex items-center justify-center cursor-pointer group"
            onClick={togglePlayPause}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: isPlaying ? 0 : 1 }}
              className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors"
            >
              <Play className="w-10 h-10 text-white ml-1" />
            </motion.div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4 mt-6 justify-center"
        >
          <Button
            onClick={handleDownload}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Download className="w-5 h-5" />
            Download Video
          </Button>
          
          <Button
            onClick={togglePlayPause}
            size="lg"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 gap-2"
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Play
              </>
            )}
          </Button>
        </motion.div>

        {/* Info Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/60 text-center mt-4 text-sm"
        >
          Your dream has been brought to life with AI-generated cinematic frames
        </motion.p>
      </div>
    </motion.div>
  );
}
