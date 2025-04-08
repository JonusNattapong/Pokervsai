
import React, { useState } from 'react';
import PlayingCard, { Rank, Suit } from './PlayingCard';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { evaluateHand } from '@/utils/pokerUtils';

const CardSelector: React.FC = () => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  const [selectedCards, setSelectedCards] = useState<Array<{suit: Suit, rank: Rank}>>([]);
  const [handResult, setHandResult] = useState<string | null>(null);

  const handleCardClick = (suit: Suit, rank: Rank) => {
    // Check if card is already selected
    const isAlreadySelected = selectedCards.some(
      card => card.suit === suit && card.rank === rank
    );

    if (isAlreadySelected) {
      // Remove the card
      setSelectedCards(selectedCards.filter(
        card => !(card.suit === suit && card.rank === rank)
      ));
      return;
    }

    // Check if we already have 5 cards
    if (selectedCards.length >= 5) {
      toast("คุณสามารถเลือกได้สูงสุด 5 ใบเท่านั้น");
      return;
    }

    // Add the card
    setSelectedCards([...selectedCards, { suit, rank }]);
  };

  const evaluateSelectedHand = () => {
    // Use our utility function to evaluate the hand
    if (selectedCards.length !== 5) {
      toast("กรุณาเลือกไพ่ 5 ใบ");
      return;
    }

    const result = evaluateHand(selectedCards, []);
    setHandResult(result);
    toast(`ผลลัพธ์: ${result}`);
  };

  const clearSelection = () => {
    setSelectedCards([]);
    setHandResult(null);
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6 border-2 border-poker-green">
        <CardHeader className="bg-poker-green text-white">
          <CardTitle>Your Selected Cards</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap justify-center gap-4 min-h-24 mb-4">
            {selectedCards.length === 0 ? (
              <p className="text-gray-500 italic">Select up to 5 cards to evaluate your hand</p>
            ) : (
              selectedCards.map((card, index) => (
                <PlayingCard 
                  key={index} 
                  rank={card.rank} 
                  suit={card.suit} 
                  selected={true}
                  onClick={() => handleCardClick(card.suit, card.rank)}
                />
              ))
            )}
          </div>
          
          <div className="flex justify-center gap-4 mt-4">
            <Button 
              onClick={evaluateSelectedHand}
              disabled={selectedCards.length !== 5}
              className="bg-poker-green hover:bg-poker-darkGreen text-white"
            >
              Evaluate Hand
            </Button>
            <Button 
              onClick={clearSelection}
              variant="outline"
              className="border-poker-green text-poker-green hover:bg-poker-green hover:text-white"
            >
              Clear Selection
            </Button>
          </div>
          
          {handResult && (
            <div className="mt-6 p-4 bg-poker-gold/10 border border-poker-gold rounded-md text-center">
              <h3 className="text-lg font-bold">Your Hand:</h3>
              <p className="text-2xl">{handResult}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-poker-green">
        <CardHeader className="bg-poker-green text-white">
          <CardTitle>Card Deck</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1">
            {suits.map((suit) => (
              <div key={suit} className="mb-6">
                <h3 className="text-lg font-semibold mb-2 capitalize">{suit}</h3>
                <div className="flex flex-wrap gap-2">
                  {ranks.map((rank) => (
                    <PlayingCard 
                      key={`${suit}-${rank}`} 
                      rank={rank} 
                      suit={suit} 
                      size="sm"
                      selected={selectedCards.some(card => card.suit === suit && card.rank === rank)}
                      onClick={() => handleCardClick(suit, rank)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CardSelector;
