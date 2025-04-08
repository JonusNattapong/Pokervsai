import { Player, Card } from '@/utils/pokerUtils';

type AIPersonality = 'aggressive' | 'conservative' | 'balanced' | 'unpredictable';

interface AIPlayer extends Player {
  personality: AIPersonality;
  confidenceLevel: number; // 0-100 representing how confident AI is in current hand
  bluffFactor: number; // 0-100 representing how likely AI is to bluff
}

// Initialize AI personalities for each AI player
export const initializeAIPersonalities = (players: Player[]): AIPlayer[] => {
  const personalities: AIPersonality[] = ['aggressive', 'conservative', 'balanced', 'unpredictable'];
  
  return players.map((player, index) => {
    if (player.name === 'You') {
      return player as AIPlayer;
    }
    
    // Assign different personalities to different AI players
    const personality = personalities[index % personalities.length];
    
    return {
      ...player,
      personality,
      confidenceLevel: 50, // default confidence
      bluffFactor: personality === 'unpredictable' ? 70 : 
                   personality === 'aggressive' ? 60 : 
                   personality === 'conservative' ? 20 : 40,
    };
  });
};

// Update AI confidence based on community cards and hand strength
export const updateAIConfidence = (
  aiPlayer: AIPlayer, 
  communityCards: Card[], 
  handStrength: number
): AIPlayer => {
  let updatedPlayer = { ...aiPlayer };
  
  // Base confidence on hand strength
  updatedPlayer.confidenceLevel = handStrength;
  
  // Adjust based on personality
  switch (aiPlayer.personality) {
    case 'aggressive':
      // More confident than they should be
      updatedPlayer.confidenceLevel = Math.min(100, updatedPlayer.confidenceLevel * 1.2);
      break;
    case 'conservative':
      // Less confident than they should be
      updatedPlayer.confidenceLevel = updatedPlayer.confidenceLevel * 0.8;
      break;
    case 'unpredictable':
      // Sometimes overconfident, sometimes underconfident
      const randomFactor = Math.random() > 0.5 ? 1.3 : 0.7;
      updatedPlayer.confidenceLevel = Math.min(100, updatedPlayer.confidenceLevel * randomFactor);
      break;
    default:
      // Balanced - confidence matches hand strength
      break;
  }
  
  return updatedPlayer;
};

interface AIDecision {
  action: 'fold' | 'check' | 'call' | 'raise' | 'all-in';
  amount?: number;
}

// Get AI decision based on game state and AI personality
export const getAIDecision = (
  aiPlayer: AIPlayer,
  communityCards: Card[],
  currentBet: number,
  potSize: number,
  handStrength: number,
  callAmount: number,
  minRaise: number,
  gamePhase: string
): AIDecision => {
  // Update confidence with current hand strength
  const playerWithUpdatedConfidence = updateAIConfidence(aiPlayer, communityCards, handStrength);
  const { confidenceLevel, bluffFactor, personality, chips } = playerWithUpdatedConfidence;
  
  // Randomly decide if this is a bluffing round
  const isBluffing = Math.random() * 100 < bluffFactor;
  
  // Base decision factor - either actual confidence or bluff confidence
  let decisionFactor = isBluffing ? 
    Math.min(100, 100 - confidenceLevel + bluffFactor) : // Inverse confidence for bluffing
    confidenceLevel;
  
  // If the AI is bluffing, don't reveal it too early (more likely to bluff in later rounds)
  if (isBluffing && gamePhase === 'pre-flop') {
    decisionFactor = Math.min(decisionFactor, 70); // Cap bluff confidence in pre-flop
  }
  
  // Adjust decisions based on pot odds
  const potOdds = callAmount / (potSize + callAmount);
  const valueProposition = handStrength / 100 > potOdds;
  
  // If can't even call, must decide between all-in or fold
  if (callAmount >= chips) {
    // Decision to go all-in is based on confidence and pot size
    const allInThreshold = personality === 'aggressive' ? 40 :
                          personality === 'conservative' ? 70 : 55;
    
    return decisionFactor > allInThreshold || handStrength > 80
      ? { action: 'all-in' }
      : { action: 'fold' };
  }
  
  // Decisions based on confidence level and personality
  if (decisionFactor < 30) {
    // Low confidence or strong bluff
    return currentBet === 0 ? { action: 'check' } : { action: 'fold' };
  } else if (decisionFactor < 50) {
    // Moderate confidence
    return currentBet === 0 ? { action: 'check' } : valueProposition ? { action: 'call' } : { action: 'fold' };
  } else if (decisionFactor < 75) {
    // Good confidence
    if (currentBet === 0) {
      // Make a reasonable bet
      const betAmount = Math.min(
        Math.floor((potSize * 0.5) + (Math.random() * potSize * 0.3)),
        chips
      );
      return { action: 'raise', amount: Math.max(minRaise, betAmount) };
    } else {
      return valueProposition ? { action: 'call' } : { action: 'fold' };
    }
  } else {
    // High confidence
    if (handStrength > 85 && personality === 'aggressive') {
      // Strong hand for aggressive player might go all-in
      return Math.random() > 0.7 ? { action: 'all-in' } : { action: 'raise', amount: Math.min(chips, minRaise * 3) };
    }
    
    // Otherwise make a strong raise
    const raiseMultiplier = personality === 'aggressive' ? 2.5 :
                          personality === 'conservative' ? 1.5 : 2;
    
    const raiseAmount = Math.min(
      Math.floor(minRaise * raiseMultiplier),
      chips
    );
    
    return { action: 'raise', amount: raiseAmount };
  }
};
