
import { Player } from '@/utils/pokerUtils';

export interface PlayerStats {
  handsPlayed: number;
  handsWon: number;
  totalBetAmount: number;
  biggestPot: number;
  foldPercentage: number;
  allInCount: number;
  currentStreak: number;
  bestHand: string;
}

const DEFAULT_STATS: PlayerStats = {
  handsPlayed: 0,
  handsWon: 0,
  totalBetAmount: 0,
  biggestPot: 0,
  foldPercentage: 0,
  allInCount: 0,
  currentStreak: 0,
  bestHand: ''
};

// Get stats from localStorage or return default stats
export const getPlayerStats = (): PlayerStats => {
  try {
    const saved = localStorage.getItem('pokerPlayerStats');
    return saved ? JSON.parse(saved) : { ...DEFAULT_STATS };
  } catch (error) {
    console.error('Error getting player stats:', error);
    return { ...DEFAULT_STATS };
  }
};

// Save stats to localStorage
export const savePlayerStats = (stats: PlayerStats): void => {
  try {
    localStorage.setItem('pokerPlayerStats', JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving player stats:', error);
  }
};

// Update stats after a hand is complete
export const updateStatsAfterHand = (
  stats: PlayerStats,
  didWin: boolean,
  didFold: boolean,
  didAllIn: boolean,
  betAmount: number,
  potSize: number,
  winningHand?: string
): PlayerStats => {
  const newStats = { ...stats };
  
  // Update basic stats
  newStats.handsPlayed += 1;
  newStats.totalBetAmount += betAmount;
  
  if (didWin) {
    newStats.handsWon += 1;
    newStats.currentStreak = newStats.currentStreak > 0 ? newStats.currentStreak + 1 : 1;
    
    if (winningHand && (!newStats.bestHand || ['Royal Flush', 'Straight Flush', 'Four of a Kind'].includes(winningHand))) {
      newStats.bestHand = winningHand;
    }
  } else {
    newStats.currentStreak = newStats.currentStreak < 0 ? newStats.currentStreak - 1 : -1;
  }
  
  if (didFold) {
    // Recalculate fold percentage
    const totalFolds = (newStats.foldPercentage * (newStats.handsPlayed - 1) / 100) + 1;
    newStats.foldPercentage = (totalFolds / newStats.handsPlayed) * 100;
  } else {
    // Recalculate fold percentage when not folding
    const totalFolds = (newStats.foldPercentage * (newStats.handsPlayed - 1) / 100);
    newStats.foldPercentage = (totalFolds / newStats.handsPlayed) * 100;
  }
  
  if (didAllIn) {
    newStats.allInCount += 1;
  }
  
  if (potSize > newStats.biggestPot) {
    newStats.biggestPot = potSize;
  }
  
  return newStats;
};

// Calculate win rate percentage
export const getWinRate = (stats: PlayerStats): number => {
  if (stats.handsPlayed === 0) return 0;
  return (stats.handsWon / stats.handsPlayed) * 100;
};
