
import React from 'react';
import { Club, Diamond, Heart, Spade } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface PlayingCardProps {
  suit: Suit;
  rank: Rank;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const PlayingCard: React.FC<PlayingCardProps> = ({ 
  suit, 
  rank, 
  selected = false,
  onClick,
  size = 'md'
}) => {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  
  const suitIcon = {
    hearts: <Heart className={cn("fill-current", size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-6 w-6')} />,
    diamonds: <Diamond className={cn("fill-current", size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-6 w-6')} />,
    clubs: <Club className={cn("fill-current", size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-6 w-6')} />,
    spades: <Spade className={cn("fill-current", size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-6 w-6')} />
  };

  const sizeClasses = {
    sm: 'w-10 h-14 text-xs',
    md: 'w-16 h-24 text-base',
    lg: 'w-20 h-32 text-xl'
  };

  return (
    <div 
      className={cn(
        "relative bg-white rounded-md shadow-md flex flex-col justify-between p-1 cursor-pointer transform transition-transform duration-200",
        sizeClasses[size],
        selected && "ring-2 ring-poker-gold scale-105",
        isRed ? "text-poker-red" : "text-poker-black",
        onClick && "hover:scale-105"
      )}
      onClick={onClick}
    >
      <div className="flex flex-col items-start">
        <div>{rank}</div>
        <div>{suitIcon[suit]}</div>
      </div>
      <div className="self-center absolute inset-0 flex items-center justify-center">
        <div className={cn(size === 'sm' ? 'text-xl' : size === 'md' ? 'text-3xl' : 'text-5xl')}>
          {suitIcon[suit]}
        </div>
      </div>
      <div className="flex flex-col items-end rotate-180">
        <div>{rank}</div>
        <div>{suitIcon[suit]}</div>
      </div>
    </div>
  );
};

export default PlayingCard;
