
import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Trophy, BarChart2, Volume2, VolumeX } from "lucide-react";
import PlayingCard from '@/components/PlayingCard';
import PlayerStatistics from '@/components/PlayerStatistics';
import { 
  createInitialGameState, 
  dealCards, 
  dealCommunityCards,
  findNextActivePlayer,
  evaluateHand,
  compareHands,
  calculateHandStrength,
  GameState,
  Player
} from '@/utils/pokerUtils';
import { initializeAIPersonalities, getAIDecision } from '@/utils/aiLogic';
import { playSound, preloadSounds } from '@/utils/soundEffects';
import { 
  getPlayerStats, 
  savePlayerStats, 
  updateStatsAfterHand, 
  PlayerStats 
} from '@/services/statsService';

const PokerGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [betAmount, setBetAmount] = useState<number>(20);
  const [handStrength, setHandStrength] = useState<number>(0);
  const [isDealing, setIsDealing] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats>(getPlayerStats());
  const [roundStartTime, setRoundStartTime] = useState<number>(0);
  const [communityCardAnimation, setCommunityCardAnimation] = useState<boolean>(false);
  
  // Preload sounds when component mounts
  useEffect(() => {
    preloadSounds();
  }, []);
  
  const startGame = () => {
    const initialState = createInitialGameState();
    
    // Initialize AI personalities
    const playersWithPersonalities = initializeAIPersonalities(initialState.players);
    
    // Deal cards to players
    const { updatedPlayers, updatedDeck } = dealCards(playersWithPersonalities, initialState.deck);
    
    setGameState({
      ...initialState,
      players: updatedPlayers,
      deck: updatedDeck,
      gamePhase: 'pre-flop'
    });
    
    // Set round start time for timing decisions
    setRoundStartTime(Date.now());
    
    // Play card dealing sound
    playSound('cardDeal');
    
    toast("แจกไพ่แล้ว! เริ่มเกมได้เลย");
  };
  
  const handleFold = () => {
    const updatedPlayers = [...gameState.players];
    updatedPlayers[0].isFolded = true;
    
    setGameState(prevState => ({
      ...prevState,
      players: updatedPlayers,
      currentPlayerIndex: findNextActivePlayer(updatedPlayers, 0)
    }));
    
    // Play fold sound
    playSound('fold');
    
    toast("คุณพับไพ่แล้ว");
    
    // AI actions after player folds
    setTimeout(playAITurns, 500);
  };
  
  const handleCheck = () => {
    // Only allowed if no one has bet yet
    if (gameState.currentBet > 0 && gameState.players[0].currentBet < gameState.currentBet) {
      toast("คุณไม่สามารถเช็คได้ คุณต้องเรียกหรือพับ");
      return;
    }
    
    const nextPlayerIndex = findNextActivePlayer(gameState.players, 0);
    
    setGameState(prevState => ({
      ...prevState,
      currentPlayerIndex: nextPlayerIndex
    }));
    
    // Play check sound
    playSound('check');
    
    toast("คุณเช็ค");
    
    // AI actions after player checks
    setTimeout(playAITurns, 500);
  };
  
  const handleCall = () => {
    const updatedPlayers = [...gameState.players];
    const player = updatedPlayers[0];
    const callAmount = gameState.currentBet - player.currentBet;
    
    // Ensure player has enough chips
    if (callAmount > player.chips) {
      handleAllIn();
      return;
    }
    
    player.chips -= callAmount;
    player.currentBet = gameState.currentBet;
    
    setGameState(prevState => ({
      ...prevState,
      players: updatedPlayers,
      pot: prevState.pot + callAmount,
      currentPlayerIndex: findNextActivePlayer(updatedPlayers, 0)
    }));
    
    // Play call sound
    playSound('call');
    
    toast(`คุณเรียกเดิมพัน ${callAmount} chips`);
    
    // AI actions after player calls
    setTimeout(playAITurns, 500);
  };
  
  const handleBet = () => {
    if (betAmount < gameState.minRaise) {
      toast(`เดิมพันขั้นต่ำคือ ${gameState.minRaise} chips`);
      return;
    }
    
    if (betAmount > gameState.players[0].chips) {
      toast("คุณมี chips ไม่พอ");
      return;
    }
    
    const updatedPlayers = [...gameState.players];
    updatedPlayers[0].chips -= betAmount;
    updatedPlayers[0].currentBet = betAmount;
    
    // Play chip sound
    playSound('chipStack');
    
    setGameState(prevState => ({
      ...prevState,
      players: updatedPlayers,
      pot: prevState.pot + betAmount,
      currentBet: betAmount,
      minRaise: betAmount * 2,
      currentPlayerIndex: findNextActivePlayer(updatedPlayers, 0)
    }));
    
    toast(`คุณเดิมพัน ${betAmount} chips`);
    
    // AI actions after player bets
    setTimeout(playAITurns, 500);
  };
  
  const handleRaise = () => {
    if (betAmount <= gameState.currentBet) {
      toast(`การเพิ่มเดิมพันต้องมากกว่า ${gameState.currentBet} chips`);
      return;
    }
    
    if (betAmount - gameState.currentBet < gameState.minRaise) {
      toast(`การเพิ่มเดิมพันขั้นต่ำคือ ${gameState.minRaise} chips`);
      return;
    }
    
    if (betAmount > gameState.players[0].chips) {
      toast("คุณมี chips ไม่พอ");
      return;
    }
    
    const updatedPlayers = [...gameState.players];
    const raiseAmount = betAmount - updatedPlayers[0].currentBet;
    updatedPlayers[0].chips -= raiseAmount;
    updatedPlayers[0].currentBet = betAmount;
    
    // Play raise sound
    playSound('raise');
    
    setGameState(prevState => ({
      ...prevState,
      players: updatedPlayers,
      pot: prevState.pot + raiseAmount,
      currentBet: betAmount,
      minRaise: betAmount * 2,
      currentPlayerIndex: findNextActivePlayer(updatedPlayers, 0)
    }));
    
    toast(`คุณเพิ่มเดิมพันเป็น ${betAmount} chips`);
    
    // AI actions after player raises
    setTimeout(playAITurns, 500);
  };
  
  const handleAllIn = () => {
    const updatedPlayers = [...gameState.players];
    const allInAmount = updatedPlayers[0].chips;
    
    updatedPlayers[0].currentBet += allInAmount;
    updatedPlayers[0].chips = 0;
    updatedPlayers[0].isAllIn = true;
    
    const newCurrentBet = Math.max(gameState.currentBet, updatedPlayers[0].currentBet);
    
    // Play all-in sound
    playSound('allIn');
    
    setGameState(prevState => ({
      ...prevState,
      players: updatedPlayers,
      pot: prevState.pot + allInAmount,
      currentBet: newCurrentBet,
      minRaise: newCurrentBet * 2,
      currentPlayerIndex: findNextActivePlayer(updatedPlayers, 0)
    }));
    
    toast("คุณ All-in!");
    
    // AI actions after player goes all-in
    setTimeout(playAITurns, 500);
  };
  
  const playAITurns = () => {
    if (gameState.currentPlayerIndex === 0 || gameState.currentPlayerIndex === -1) {
      return;
    }
    
    setIsDealing(true);
    
    const simulateAITurn = (playerIndex: number) => {
      setTimeout(() => {
        const updatedGameState = { ...gameState };
        const player = updatedGameState.players[playerIndex];
        
        if (player.isFolded || player.isAllIn) {
          const nextPlayerIndex = findNextActivePlayer(updatedGameState.players, playerIndex);
          
          if (nextPlayerIndex === 0 || nextPlayerIndex === -1) {
            checkRoundEnd(updatedGameState);
          } else {
            setGameState(prevState => ({
              ...prevState,
              currentPlayerIndex: nextPlayerIndex
            }));
            simulateAITurn(nextPlayerIndex);
          }
          return;
        }
        
        // Enhanced AI decision-making using the new AI logic
        const aiStrength = calculateHandStrength(player.hand, updatedGameState.communityCards);
        const callAmount = updatedGameState.currentBet - player.currentBet;
        
        const aiDecision = getAIDecision(
          player as any, // Cast to AIPlayer type
          updatedGameState.communityCards,
          updatedGameState.currentBet,
          updatedGameState.pot,
          aiStrength,
          callAmount,
          updatedGameState.minRaise,
          updatedGameState.gamePhase
        );
        
        // Execute AI decision
        switch (aiDecision.action) {
          case 'fold':
            player.isFolded = true;
            playSound('fold');
            toast(`${player.name} พับ`);
            break;
            
          case 'check':
            playSound('check');
            toast(`${player.name} เช็ค`);
            break;
            
          case 'call':
            if (callAmount > player.chips) {
              // AI goes all-in if can't call
              updatedGameState.pot += player.chips;
              player.currentBet += player.chips;
              player.chips = 0;
              player.isAllIn = true;
              playSound('allIn');
              toast(`${player.name} All-in!`);
            } else {
              // AI calls
              updatedGameState.pot += callAmount;
              player.chips -= callAmount;
              player.currentBet = updatedGameState.currentBet;
              playSound('call');
              toast(`${player.name} เรียก`);
            }
            break;
            
          case 'raise':
            const raiseAmount = aiDecision.amount || updatedGameState.minRaise;
            
            if (raiseAmount + callAmount >= player.chips) {
              // AI goes all-in
              updatedGameState.pot += player.chips;
              player.currentBet += player.chips;
              player.chips = 0;
              player.isAllIn = true;
              updatedGameState.currentBet = Math.max(updatedGameState.currentBet, player.currentBet);
              playSound('allIn');
              toast(`${player.name} All-in!`);
            } else {
              // AI raises
              const totalBet = updatedGameState.currentBet + raiseAmount;
              updatedGameState.pot += (totalBet - player.currentBet);
              player.chips -= (totalBet - player.currentBet);
              player.currentBet = totalBet;
              updatedGameState.currentBet = totalBet;
              updatedGameState.minRaise = raiseAmount;
              playSound('raise');
              toast(`${player.name} เพิ่มเดิมพันเป็น ${totalBet}`);
            }
            break;
            
          case 'all-in':
            // AI goes all-in
            updatedGameState.pot += player.chips;
            player.currentBet += player.chips;
            const newBet = player.currentBet;
            player.chips = 0;
            player.isAllIn = true;
            updatedGameState.currentBet = Math.max(updatedGameState.currentBet, newBet);
            playSound('allIn');
            toast(`${player.name} All-in!`);
            break;
        }
        
        const nextPlayerIndex = findNextActivePlayer(updatedGameState.players, playerIndex);
        
        // If next player is human or no active players, end AI turns
        if (nextPlayerIndex === 0 || nextPlayerIndex === -1) {
          checkRoundEnd(updatedGameState);
        } else {
          // Continue with next AI player
          setGameState(updatedGameState);
          simulateAITurn(nextPlayerIndex);
        }
      }, 1000 + Math.random() * 500); // Randomize AI decision time for more natural feel
    };
    
    simulateAITurn(gameState.currentPlayerIndex);
  };
  
  const checkRoundEnd = (currentGameState: GameState) => {
    const { players, gamePhase, deck, communityCards } = currentGameState;
    let updatedGameState = { ...currentGameState };
    
    // Check if round is over (everyone has bet the same amount or folded/all-in)
    const activePlayers = players.filter(player => !player.isFolded);
    const allBetsEqual = activePlayers.every(player => 
      player.currentBet === updatedGameState.currentBet || player.isAllIn
    );
    
    // If only one player remains, they win
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      updatedGameState.winner = winner;
      updatedGameState.winningHand = evaluateHand(winner.hand, communityCards);
      winner.chips += updatedGameState.pot;
      
      // Play win sound if player won, lose sound if AI won
      if (winner.name === 'You') {
        playSound('win');
        
        // Update player stats
        const updatedStats = updateStatsAfterHand(
          playerStats,
          true, // won
          false, // didn't fold
          updatedGameState.players[0].isAllIn,
          updatedGameState.players[0].currentBet,
          updatedGameState.pot,
          updatedGameState.winningHand
        );
        setPlayerStats(updatedStats);
        savePlayerStats(updatedStats);
      } else {
        playSound('lose');
        
        // Update player stats on loss
        const updatedStats = updateStatsAfterHand(
          playerStats,
          false, // didn't win
          updatedGameState.players[0].isFolded,
          updatedGameState.players[0].isAllIn,
          updatedGameState.players[0].currentBet,
          updatedGameState.pot
        );
        setPlayerStats(updatedStats);
        savePlayerStats(updatedStats);
      }
      
      setGameState(updatedGameState);
      setIsDealing(false);
      
      toast(`${winner.name} ชนะด้วยการที่ผู้เล่นอื่นพับทั้งหมด!`);
      return;
    }
    
    if (allBetsEqual) {
      // Move to next phase
      switch (gamePhase) {
        case 'pre-flop':
          // Deal the flop (3 community cards)
          const flopResult = dealCommunityCards(communityCards, deck, 3);
          updatedGameState.communityCards = flopResult.updatedCommunityCards;
          updatedGameState.deck = flopResult.updatedDeck;
          updatedGameState.gamePhase = 'flop';
          
          // Reset bets for new round
          updatedGameState.players = players.map(player => ({
            ...player,
            currentBet: 0
          }));
          updatedGameState.currentBet = 0;
          updatedGameState.currentPlayerIndex = findNextActivePlayer(updatedGameState.players, updatedGameState.dealerIndex);
          
          // Play card dealing sound and trigger animation
          playSound('cardDeal');
          setCommunityCardAnimation(true);
          setTimeout(() => setCommunityCardAnimation(false), 500);
          
          toast("แจกไพ่กลาง 3 ใบแล้ว");
          break;
          
        case 'flop':
          // Deal the turn (1 more community card)
          const turnResult = dealCommunityCards(communityCards, deck, 1);
          updatedGameState.communityCards = turnResult.updatedCommunityCards;
          updatedGameState.deck = turnResult.updatedDeck;
          updatedGameState.gamePhase = 'turn';
          
          // Reset bets for new round
          updatedGameState.players = players.map(player => ({
            ...player,
            currentBet: 0
          }));
          updatedGameState.currentBet = 0;
          updatedGameState.currentPlayerIndex = findNextActivePlayer(updatedGameState.players, updatedGameState.dealerIndex);
          
          // Play card dealing sound and trigger animation
          playSound('cardDeal');
          setCommunityCardAnimation(true);
          setTimeout(() => setCommunityCardAnimation(false), 500);
          
          toast("แจกไพ่กลางใบที่ 4 แล้ว");
          break;
          
        case 'turn':
          // Deal the river (1 final community card)
          const riverResult = dealCommunityCards(communityCards, deck, 1);
          updatedGameState.communityCards = riverResult.updatedCommunityCards;
          updatedGameState.deck = riverResult.updatedDeck;
          updatedGameState.gamePhase = 'river';
          
          // Reset bets for new round
          updatedGameState.players = players.map(player => ({
            ...player,
            currentBet: 0
          }));
          updatedGameState.currentBet = 0;
          updatedGameState.currentPlayerIndex = findNextActivePlayer(updatedGameState.players, updatedGameState.dealerIndex);
          
          // Play card dealing sound and trigger animation
          playSound('cardDeal');
          setCommunityCardAnimation(true);
          setTimeout(() => setCommunityCardAnimation(false), 500);
          
          toast("แจกไพ่กลางใบสุดท้ายแล้ว");
          break;
          
        case 'river':
          // Showdown - determine winner
          updatedGameState.gamePhase = 'showdown';
          
          const activePlayersForShowdown = activePlayers.filter(player => !player.isFolded);
          if (activePlayersForShowdown.length > 1) {
            const { winner, handRank } = compareHands(activePlayersForShowdown, communityCards);
            updatedGameState.winner = winner;
            updatedGameState.winningHand = handRank;
            winner.chips += updatedGameState.pot;
            
            if (winner.name === 'You') {
              playSound('win');
              
              // Update player stats
              const updatedStats = updateStatsAfterHand(
                playerStats,
                true, // won
                false, // didn't fold
                updatedGameState.players[0].isAllIn,
                updatedGameState.players[0].currentBet,
                updatedGameState.pot,
                handRank
              );
              setPlayerStats(updatedStats);
              savePlayerStats(updatedStats);
            } else {
              playSound('lose');
              
              // Update player stats
              const updatedStats = updateStatsAfterHand(
                playerStats,
                false, // didn't win
                false, // didn't fold
                updatedGameState.players[0].isAllIn,
                updatedGameState.players[0].currentBet,
                updatedGameState.pot
              );
              setPlayerStats(updatedStats);
              savePlayerStats(updatedStats);
            }
            
            toast(`${winner.name} ชนะด้วย ${handRank}!`);
          } else if (activePlayersForShowdown.length === 1) {
            const winner = activePlayersForShowdown[0];
            updatedGameState.winner = winner;
            updatedGameState.winningHand = evaluateHand(winner.hand, communityCards);
            winner.chips += updatedGameState.pot;
            
            if (winner.name === 'You') {
              playSound('win');
              
              // Update player stats
              const updatedStats = updateStatsAfterHand(
                playerStats,
                true, // won
                false, // didn't fold
                updatedGameState.players[0].isAllIn,
                updatedGameState.players[0].currentBet,
                updatedGameState.pot,
                updatedGameState.winningHand
              );
              setPlayerStats(updatedStats);
              savePlayerStats(updatedStats);
            } else {
              playSound('lose');
              
              // Update player stats
              const updatedStats = updateStatsAfterHand(
                playerStats,
                false, // didn't win
                updatedGameState.players[0].isFolded,
                updatedGameState.players[0].isAllIn,
                updatedGameState.players[0].currentBet,
                updatedGameState.pot
              );
              setPlayerStats(updatedStats);
              savePlayerStats(updatedStats);
            }
            
            toast(`${winner.name} ชนะ!`);
          }
          break;
          
        default:
          break;
      }
      
      setGameState(updatedGameState);
      setIsDealing(false);
      
      // Calculate hand strength if it's the player's turn
      if (updatedGameState.currentPlayerIndex === 0 && 
          !updatedGameState.players[0].isFolded && 
          updatedGameState.gamePhase !== 'showdown') {
        const strength = calculateHandStrength(
          updatedGameState.players[0].hand, 
          updatedGameState.communityCards
        );
        setHandStrength(strength);
      }
      
      // If it's AI's turn and not showdown, continue AI turns
      if (updatedGameState.currentPlayerIndex !== 0 && 
          updatedGameState.gamePhase !== 'showdown') {
        setTimeout(playAITurns, 1000);
      }
    } else {
      // Continue with current phase
      updatedGameState.currentPlayerIndex = 0;
      setGameState(updatedGameState);
      setIsDealing(false);
    }
  };
  
  const startNewHand = () => {
    // Reset game state for a new hand
    const updatedPlayers = gameState.players.map(player => ({
      ...player,
      hand: [],
      currentBet: 0,
      isActive: player.chips > 0,
      isFolded: false,
      isAllIn: false
    }));
    
    // Move dealer button
    const newDealerIndex = (gameState.dealerIndex + 1) % updatedPlayers.length;
    
    const newGameState = {
      ...createInitialGameState(),
      players: updatedPlayers,
      dealerIndex: newDealerIndex
    };
    
    // Deal cards to players
    const { updatedPlayers: playersWithCards, updatedDeck } = dealCards(newGameState.players, newGameState.deck);
    
    // Play dealing sound
    playSound('cardDeal');
    
    setGameState({
      ...newGameState,
      players: playersWithCards,
      deck: updatedDeck,
      gamePhase: 'pre-flop',
    });
    
    toast("แจกไพ่แล้ว! เริ่มเกมได้เลย");
  };
  
  // Update hand strength calculation when community cards are dealt
  useEffect(() => {
    if (gameState.gamePhase !== 'waiting' && 
        gameState.gamePhase !== 'showdown' && 
        !gameState.players[0].isFolded) {
      const strength = calculateHandStrength(
        gameState.players[0].hand, 
        gameState.communityCards
      );
      setHandStrength(strength);
    }
  }, [gameState.communityCards]);
  
  // Update bet amount slider max value based on player's chips
  useEffect(() => {
    if (gameState.players[0] && gameState.players[0].chips < betAmount) {
      setBetAmount(gameState.players[0].chips);
    }
  }, [gameState.players]);
  
  const renderActionButtons = () => {
    const isPlayerTurn = gameState.currentPlayerIndex === 0;
    const isShowdown = gameState.gamePhase === 'showdown';
    const isWaiting = gameState.gamePhase === 'waiting';
    const playerFolded = gameState.players[0].isFolded;
    
    if (isWaiting) {
      return (
        <Button 
          onClick={startGame} 
          className="bg-poker-green hover:bg-poker-darkGreen text-white animate-pulse transition-all duration-300"
        >
          เริ่มเกม
        </Button>
      );
    }
    
    if (isShowdown) {
      return (
        <Button 
          onClick={startNewHand} 
          className="bg-poker-gold hover:bg-poker-darkGreen text-white transition-all duration-300"
        >
          แจกมือต่อไป
        </Button>
      );
    }
    
    if (playerFolded) {
      return <p className="text-lg text-red-500 font-bold">คุณพับไพ่ไปแล้ว</p>;
    }
    
    return (
      <div className={`space-y-4 ${!isPlayerTurn ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button 
            onClick={handleFold} 
            variant="outline" 
            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-300"
            disabled={!isPlayerTurn || isDealing}
          >
            พับ
          </Button>
          <Button 
            onClick={handleCheck} 
            variant="outline" 
            className="border-gray-500 hover:bg-gray-500 hover:text-white transition-colors duration-300"
            disabled={
              !isPlayerTurn || 
              isDealing || 
              (gameState.currentBet > 0 && gameState.players[0].currentBet < gameState.currentBet)
            }
          >
            เช็ค
          </Button>
          <Button 
            onClick={handleCall} 
            variant="outline" 
            className="border-poker-green hover:bg-poker-green hover:text-white transition-colors duration-300"
            disabled={
              !isPlayerTurn || 
              isDealing || 
              gameState.currentBet === 0 || 
              gameState.players[0].currentBet === gameState.currentBet
            }
          >
            เรียก ({gameState.currentBet - gameState.players[0].currentBet})
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <span className="w-14 text-right">฿{gameState.minRaise}</span>
            <Slider
              value={[betAmount]}
              min={gameState.minRaise}
              max={gameState.players[0].chips}
              step={5}
              onValueChange={(value) => setBetAmount(value[0])}
              disabled={!isPlayerTurn || isDealing}
              className="flex-1"
            />
            <span className="w-14">฿{gameState.players[0].chips}</span>
          </div>
          
          <div className="flex justify-center gap-2">
            <Button 
              onClick={gameState.currentBet === 0 ? handleBet : handleRaise} 
              className="bg-poker-gold hover:bg-amber-600 text-white transition-colors duration-300"
              disabled={!isPlayerTurn || isDealing || betAmount > gameState.players[0].chips}
            >
              {gameState.currentBet === 0 ? `เดิมพัน ${betAmount}` : `เพิ่มเป็น ${betAmount}`}
            </Button>
            <Button 
              onClick={handleAllIn} 
              className="bg-red-600 hover:bg-red-700 text-white transition-colors duration-300"
              disabled={!isPlayerTurn || isDealing || gameState.players[0].chips === 0}
            >
              All-in ({gameState.players[0].chips})
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Game Board */}
        <Card className="border-2 border-poker-green transition-all duration-300 hover:shadow-xl">
          <CardHeader className="bg-poker-green text-white">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Gamepad2 className="mr-2 h-5 w-5 text-poker-gold" />
                โต๊ะโป๊กเกอร์
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowStats(!showStats)}
                  className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white hover:text-poker-green transition-all duration-300"
                >
                  <BarChart2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Game status info */}
            <div className="mb-4 flex flex-wrap justify-between items-center">
              <div>
                <p className="text-lg font-bold">
                  เฟส: {(() => {
                    switch (gameState.gamePhase) {
                      case 'waiting': return "รอเริ่มเกม";
                      case 'pre-flop': return "Pre-flop";
                      case 'flop': return "Flop";
                      case 'turn': return "Turn";
                      case 'river': return "River";
                      case 'showdown': return "Showdown";
                      default: return gameState.gamePhase;
                    }
                  })()}
                </p>
                <p className="text-lg">เงินกอง: 
                  <span className="font-bold text-poker-gold ml-1 animate-pulse">฿{gameState.pot}</span>
                </p>
              </div>
              <div>
                <p className="text-lg">เดิมพันปัจจุบัน: ฿{gameState.currentBet}</p>
                <p className="text-lg">เพิ่มขั้นต่ำ: ฿{gameState.minRaise}</p>
              </div>
            </div>
            
            {/* Community cards */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">ไพ่กลาง</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {gameState.communityCards.length > 0 ? (
                  gameState.communityCards.map((card, index) => (
                    <div 
                      key={index} 
                      className={`transition-all duration-300 ${
                        communityCardAnimation && index >= gameState.communityCards.length - (gameState.gamePhase === 'flop' ? 3 : 1) 
                          ? 'animate-card-flip scale-110' 
                          : ''
                      }`}
                    >
                      <PlayingCard
                        rank={card.rank}
                        suit={card.suit}
                        size="md"
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">ยังไม่มีไพ่กลาง</p>
                )}
              </div>
            </div>
            
            {/* Opponents */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">ผู้เล่นอื่น</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {gameState.players.slice(1).map((player, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border transition-all duration-300 ${
                      player.isFolded 
                        ? 'bg-gray-100 border-gray-300' 
                        : gameState.currentPlayerIndex === index + 1 
                        ? 'bg-yellow-50 border-poker-gold shadow-md animate-pulse' 
                        : 'bg-white border-gray-200 hover:border-poker-green'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{player.name}</span>
                      <span className="text-sm">
                        {player.isAllIn ? 'All-in' : player.isFolded ? 'พับ' : `฿${player.chips}`}
                      </span>
                    </div>
                    
                    <div className="flex justify-center gap-1">
                      {player.hand.length > 0 && (
                        gameState.gamePhase === 'showdown' && !player.isFolded ? (
                          // Show actual cards in showdown
                          player.hand.map((card, cardIndex) => (
                            <div 
                              key={cardIndex}
                              className="transition-all duration-500 animate-fade-in"
                            >
                              <PlayingCard
                                rank={card.rank}
                                suit={card.suit}
                                size="sm"
                              />
                            </div>
                          ))
                        ) : (
                          // Show card backs
                          Array(2).fill(0).map((_, cardIndex) => (
                            <div 
                              key={cardIndex}
                              className="w-10 h-14 rounded bg-poker-darkGreen border border-poker-gold transition-all duration-300 hover:shadow-md"
                            />
                          ))
                        )
                      )}
                    </div>
                    
                    {player.currentBet > 0 && (
                      <div className="mt-2 text-center">
                        <span className="text-sm p-1 bg-poker-green text-white rounded">เดิมพัน: ฿{player.currentBet}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Player hand */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">มือของคุณ</h3>
                <span className="bg-poker-green text-white px-2 py-1 rounded transition-all duration-300 hover:bg-poker-gold">
                  Chips: ฿{gameState.players[0].chips}
                </span>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 mb-4">
                {gameState.players[0].hand.length > 0 ? (
                  gameState.players[0].hand.map((card, index) => (
                    <div 
                      key={index}
                      className="transition-all duration-300 hover:scale-105"
                    >
                      <PlayingCard
                        rank={card.rank}
                        suit={card.suit}
                        size="lg"
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">ยังไม่ได้รับไพ่</p>
                )}
              </div>
              
              {gameState.players[0].currentBet > 0 && (
                <div className="text-center mb-2">
                  <span className="text-sm p-1 bg-poker-green text-white rounded">เดิมพันของคุณ: ฿{gameState.players[0].currentBet}</span>
                </div>
              )}
              
              {gameState.gamePhase !== 'waiting' && gameState.gamePhase !== 'showdown' && !gameState.players[0].isFolded && (
                <div className="bg-gray-100 rounded-lg p-3 mb-4 transition-all duration-300 hover:shadow-md">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">ความแข็งแกร่งของมือ:</span>
                    <span className="text-sm font-bold">{Math.round(handStrength)}%</span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2 mt-1 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full h-2 transition-all duration-300" 
                      style={{ width: `${handStrength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Winner announcement */}
            {gameState.winner && (
              <div className="mb-6 p-4 bg-poker-gold/20 border border-poker-gold rounded-md text-center animate-fade-in">
                <h3 className="text-xl font-bold">
                  {gameState.winner.name === 'You' ? 'คุณชนะ!' : `${gameState.winner.name} ชนะ!`}
                </h3>
                {gameState.winningHand && (
                  <p className="text-lg">{gameState.winningHand}</p>
                )}
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex justify-center">
              {renderActionButtons()}
            </div>
          </CardContent>
        </Card>
        
        {/* Player Statistics */}
        {showStats && (
          <div className="animate-fade-in">
            <PlayerStatistics stats={playerStats} />
          </div>
        )}
        
        {/* Game Rules */}
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>กฎการเล่น</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>1. ผู้เล่นแต่ละคนได้รับไพ่ 2 ใบ</p>
              <p>2. เล่นแบบ Texas Hold'em โดยมีการเปิดไพ่กลาง 5 ใบ (Flop 3 ใบ, Turn 1 ใบ, River 1 ใบ)</p>
              <p>3. ผู้เล่นสามารถ เช็ค, เรียก, เพิ่มเดิมพัน, หรือพับไพ่ได้</p>
              <p>4. มือที่ชนะจะเป็นผู้เล่นที่สร้างชุดไพ่ที่ดีที่สุดจากไพ่มือ 2 ใบและไพ่กลาง</p>
              <p>5. ยิ่งผู้เล่นมี chips มากเท่าไหร่ก็ยิ่งสามารถเล่นต่อได้นานขึ้น</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PokerGame;
