
import { Rank, Suit } from '@/components/PlayingCard';

const ROYAL_FLUSH_RANKS: Rank[] = ['A', 'K', 'Q', 'J', '10'];

export type Card = {
  suit: Suit;
  rank: Rank;
};

export type Player = {
  id: number;
  name: string;
  hand: Card[];
  chips: number;
  currentBet: number;
  isActive: boolean;
  isFolded: boolean;
  isAllIn: boolean;
};

export type GameState = {
  deck: Card[];
  communityCards: Card[];
  players: Player[];
  currentPlayerIndex: number;
  pot: number;
  currentBet: number;
  minRaise: number;
  dealerIndex: number;
  gamePhase: 'waiting' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';
  winner: Player | null;
  winningHand: string | null;
};

// Create a full deck of cards
export const createDeck = (): Card[] => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }

  return deck;
};

// Shuffle the deck using Fisher-Yates algorithm
export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Deal cards to players with validation
export const dealCards = (players: Player[], deck: Card[]): { updatedPlayers: Player[], updatedDeck: Card[] } => {
  // Input validation
  if (!Array.isArray(players) || !Array.isArray(deck)) {
    throw new Error('Invalid input: players and deck must be arrays');
  }
  if (players.some(p => !p.hand || !Array.isArray(p.hand))) {
    throw new Error('Invalid players: each player must have a hand array');
  }
  if (deck.length < players.length * 2) {
    throw new Error('Not enough cards in deck to deal to all players');
  }

  const updatedPlayers = players.map(p => ({ ...p, hand: [...p.hand] }));
  const updatedDeck = [...deck];
  
  try {
    // Deal 2 cards to each player
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < updatedPlayers.length; j++) {
        if (!updatedPlayers[j].isFolded) {
          const card = updatedDeck.pop();
          if (!card) throw new Error('Unexpected empty deck during dealing');
          updatedPlayers[j].hand.push(card);
        }
      }
    }
    
    return { updatedPlayers, updatedDeck };
  } catch (error) {
    console.error('Error dealing cards:', error);
    throw error;
  }
};

// Deal community cards
export const dealCommunityCards = (
  communityCards: Card[], 
  deck: Card[], 
  count: number
): { updatedCommunityCards: Card[], updatedDeck: Card[] } => {
  const updatedCommunityCards = [...communityCards];
  const updatedDeck = [...deck];
  
  for (let i = 0; i < count; i++) {
    const card = updatedDeck.pop();
    if (card) {
      updatedCommunityCards.push(card);
    }
  }
  
  return { updatedCommunityCards, updatedDeck };
};

// Rank values for quick lookup
const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

// Evaluate a hand to determine its rank (optimized version)
export const evaluateHand = (playerHand: Card[], communityCards: Card[]): string => {
  const allCards = [...playerHand, ...communityCards];
  
  // Early return if not enough cards
  if (allCards.length < 5) return "High Card (ไฮการ์ด)";

  // Count ranks and suits in a single pass
  const rankCounts: Record<string, number> = {};
  const suitCounts: Record<string, number> = {};
  const rankValues: number[] = [];

  for (const card of allCards) {
    // Count ranks
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    
    // Count suits
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    
    // Store numerical values
    rankValues.push(RANK_VALUES[card.rank]);
  }

  // Check for flush (5+ cards of same suit)
  const isFlush = Object.values(suitCounts).some(count => count >= 5);

  // Sort and dedupe ranks for straight check
  const uniqueSortedRanks = [...new Set(rankValues)].sort((a, b) => a - b);
  
  // Check for straight (optimized)
  let isStraight = false;
  if (uniqueSortedRanks.length >= 5) {
    // Check normal straight
    for (let i = 0; i <= uniqueSortedRanks.length - 5; i++) {
      if (uniqueSortedRanks[i + 4] - uniqueSortedRanks[i] === 4) {
        isStraight = true;
        break;
      }
    }
    
    // Check Ace-low straight (A-5)
    if (!isStraight && uniqueSortedRanks.includes(14)) {
      const lowStraightRanks = [2, 3, 4, 5];
      if (lowStraightRanks.every(r => uniqueSortedRanks.includes(r))) {
        isStraight = true;
      }
    }
  }

  // Count pairs, triplets, quads
  const counts = Object.values(rankCounts);
  const pairs = counts.filter(c => c === 2).length;
  const triplets = counts.filter(c => c === 3).length;
  const quads = counts.filter(c => c === 4).length;

  // Check for royal flush first (optimized order)
  if (isFlush && isStraight) {
    const flushSuit = Object.entries(suitCounts).find(([_, count]) => count >= 5)?.[0] as Suit;
    if (flushSuit) {
      const flushCards = allCards.filter(card => card.suit === flushSuit);
      const flushRanks = new Set<Rank>(flushCards.map(c => c.rank));
      if (ROYAL_FLUSH_RANKS.every(r => flushRanks.has(r))) {
        return "Royal Flush (รอยัล ฟลัช)";
      }
    }
    return "Straight Flush (สเตรท ฟลัช)";
  }

  // Other hand types in descending order of strength
  if (quads) return "Four of a Kind (โฟร์ออฟอะคายด์)";
  if (triplets && pairs) return "Full House (ฟูลเฮาส์)";
  if (isFlush) return "Flush (ฟลัช)";
  if (isStraight) return "Straight (สเตรท)";
  if (triplets) return "Three of a Kind (ทรี ออฟ อะ คายด์)";
  if (pairs >= 2) return "Two Pair (ทูแพร์)";
  if (pairs === 1) return "One Pair (วันแพร์)";
  
  return "High Card (ไฮการ์ด)";
};

// Compare hands to determine winner
export const compareHands = (players: Player[], communityCards: Card[]): { winner: Player, handRank: string } => {
  const handRankValue = {
    "Royal Flush (รอยัล ฟลัช)": 10,
    "Straight Flush (สเตรท ฟลัช)": 9,
    "Four of a Kind (โฟร์ออฟอะคายด์)": 8,
    "Full House (ฟูลเฮาส์)": 7,
    "Flush (ฟลัช)": 6,
    "Straight (สเตรท)": 5,
    "Three of a Kind (ทรี ออฟ อะ คายด์)": 4,
    "Two Pair (ทูแพร์)": 3,
    "One Pair (วันแพร์)": 2,
    "High Card (ไฮการ์ด)": 1
  };

  let winner = players[0];
  let bestHandRank = evaluateHand(players[0].hand, communityCards);
  let bestHandValue = handRankValue[bestHandRank];

  for (let i = 1; i < players.length; i++) {
    if (!players[i].isFolded) {
      const handRank = evaluateHand(players[i].hand, communityCards);
      const handValue = handRankValue[handRank];

      if (handValue > bestHandValue) {
        bestHandValue = handValue;
        bestHandRank = handRank;
        winner = players[i];
      }
      // If equal hand value, implement tiebreaker logic here (not implemented for simplicity)
    }
  }

  return { winner, handRank: bestHandRank };
};

// Find the next active player
export const findNextActivePlayer = (players: Player[], currentIndex: number): number => {
  const count = players.length;
  let nextIndex = (currentIndex + 1) % count;
  let loopCount = 0;

  while (loopCount < count) {
    if (!players[nextIndex].isFolded && players[nextIndex].isActive) {
      return nextIndex;
    }
    nextIndex = (nextIndex + 1) % count;
    loopCount += 1;
  }

  return -1; // No active players found
};

// Calculate hand strength percentage (simplified version)
export const calculateHandStrength = (playerHand: Card[], communityCards: Card[]): number => {
  const handRank = evaluateHand(playerHand, communityCards);
  const handRankValue = {
    "Royal Flush (รอยัล ฟลัช)": 10,
    "Straight Flush (สเตรท ฟลัช)": 9,
    "Four of a Kind (โฟร์ออฟอะคายด์)": 8,
    "Full House (ฟูลเฮาส์)": 7,
    "Flush (ฟลัช)": 6,
    "Straight (สเตรท)": 5,
    "Three of a Kind (ทรี ออฟ อะ คายด์)": 4,
    "Two Pair (ทูแพร์)": 3,
    "One Pair (วันแพร์)": 2,
    "High Card (ไฮการ์ด)": 1
  };

  // Convert rank to percentage (1-10 scale to 0-100%)
  return (handRankValue[handRank] / 10) * 100;
};

// Create initial game state
export const createInitialGameState = (playerCount: number = 4, startingChips: number = 1000): GameState => {
  const deck = shuffleDeck(createDeck());
  const players: Player[] = [];

  for (let i = 0; i < playerCount; i++) {
    players.push({
      id: i,
      name: i === 0 ? 'You' : `Player ${i}`,
      hand: [],
      chips: startingChips,
      currentBet: 0,
      isActive: true,
      isFolded: false,
      isAllIn: false
    });
  }

  return {
    deck,
    communityCards: [],
    players,
    currentPlayerIndex: 0,
    pot: 0,
    currentBet: 0,
    minRaise: 20, // minimum bet
    dealerIndex: 0,
    gamePhase: 'waiting',
    winner: null,
    winningHand: null
  };
};
