
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { setMuted } from '@/utils/soundEffects';

const SoundSettings: React.FC = () => {
  const [isMuted, setIsMuted] = useState(() => {
    const savedMuted = localStorage.getItem('pokerSoundMuted');
    return savedMuted === 'true';
  });
  
  useEffect(() => {
    // Set the muted state when component mounts
    setMuted(isMuted);
    localStorage.setItem('pokerSoundMuted', String(isMuted));
  }, [isMuted]);
  
  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    setMuted(newMutedState);
    localStorage.setItem('pokerSoundMuted', String(newMutedState));
  };
  
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleMute}
      title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
      className="rounded-full"
    >
      {isMuted ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
};

export default SoundSettings;
