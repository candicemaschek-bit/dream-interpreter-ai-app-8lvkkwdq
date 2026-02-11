/**
 * Second Dream Engagement Toast
 * Special toast that appears after 2nd dream for Free tier users
 * Includes: Profile link, Social sharing, "Don't show again" checkbox
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, User } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { ShareAppButton } from './ShareAppButton';
import { useNavigate } from 'react-router-dom';

interface SecondDreamEngagementToastProps {
  isOpen: boolean;
  onClose: () => void;
  onDontShowAgain: () => void;
}

export function SecondDreamEngagementToast({
  isOpen,
  onClose,
  onDontShowAgain
}: SecondDreamEngagementToastProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => {
    if (dontShowAgain) {
      onDontShowAgain();
    }
    onClose();
  };

  const handleProfileClick = () => {
    navigate('/');
    // Small delay to ensure navigation completes
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('navigateToSettings'));
    }, 100);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 max-w-md backdrop-blur-md bg-background/95 border border-primary/40 shadow-md shadow-primary/10 rounded-lg p-4 z-50"
        >
          <div className="space-y-4">
            {/* Header with close button */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Share2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                    Share your dream with your friends
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-foreground/40 hover:text-foreground/70 transition-colors flex-shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <ShareAppButton variant="default" size="sm" className="flex-1" />
              <Button
                onClick={handleProfileClick}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <User className="w-4 h-4" />
                Profile
              </Button>
            </div>

            {/* Don't show again checkbox */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <Checkbox
                id="dont-show-engagement"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              />
              <label
                htmlFor="dont-show-engagement"
                className="text-xs text-muted-foreground cursor-pointer select-none"
              >
                Don't show this again
              </label>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
