
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PlayingCard from './PlayingCard';

interface PokerHand {
  name: string;
  thaiName: string;
  description: string;
  exampleCards: Array<{
    rank: string;
    suit: string;
  }>;
}

const HandRankings: React.FC = () => {
  const pokerHands: PokerHand[] = [
    {
      name: "Royal Flush",
      thaiName: "รอยัล ฟลัช",
      description: "A, K, Q, J, 10 in the same suit",
      exampleCards: [
        { rank: "A", suit: "hearts" },
        { rank: "K", suit: "hearts" },
        { rank: "Q", suit: "hearts" },
        { rank: "J", suit: "hearts" },
        { rank: "10", suit: "hearts" },
      ]
    },
    {
      name: "Straight Flush",
      thaiName: "สเตรท ฟลัช",
      description: "Five cards in sequence, all in the same suit",
      exampleCards: [
        { rank: "9", suit: "clubs" },
        { rank: "8", suit: "clubs" },
        { rank: "7", suit: "clubs" },
        { rank: "6", suit: "clubs" },
        { rank: "5", suit: "clubs" },
      ]
    },
    {
      name: "Four of a Kind",
      thaiName: "โฟร์ออฟอะคายด์",
      description: "Four cards of the same rank",
      exampleCards: [
        { rank: "K", suit: "clubs" },
        { rank: "K", suit: "hearts" },
        { rank: "K", suit: "diamonds" },
        { rank: "K", suit: "spades" },
        { rank: "4", suit: "hearts" },
      ]
    },
    {
      name: "Full House",
      thaiName: "ฟูลเฮาส์",
      description: "Three of a kind with a pair",
      exampleCards: [
        { rank: "J", suit: "spades" },
        { rank: "J", suit: "hearts" },
        { rank: "J", suit: "diamonds" },
        { rank: "7", suit: "clubs" },
        { rank: "7", suit: "spades" },
      ]
    },
    {
      name: "Flush",
      thaiName: "ฟลัช",
      description: "Five cards of the same suit, not in sequence",
      exampleCards: [
        { rank: "A", suit: "diamonds" },
        { rank: "10", suit: "diamonds" },
        { rank: "8", suit: "diamonds" },
        { rank: "6", suit: "diamonds" },
        { rank: "3", suit: "diamonds" },
      ]
    },
    {
      name: "Straight",
      thaiName: "สเตรท",
      description: "Five cards in sequence, not all in the same suit",
      exampleCards: [
        { rank: "Q", suit: "hearts" },
        { rank: "J", suit: "spades" },
        { rank: "10", suit: "diamonds" },
        { rank: "9", suit: "clubs" },
        { rank: "8", suit: "hearts" },
      ]
    },
    {
      name: "Three of a Kind",
      thaiName: "ทรี ออฟ อะ คายด์",
      description: "Three cards of the same rank",
      exampleCards: [
        { rank: "8", suit: "hearts" },
        { rank: "8", suit: "clubs" },
        { rank: "8", suit: "diamonds" },
        { rank: "K", suit: "spades" },
        { rank: "3", suit: "hearts" },
      ]
    },
    {
      name: "Two Pair",
      thaiName: "ทูแพร์",
      description: "Two different pairs",
      exampleCards: [
        { rank: "A", suit: "hearts" },
        { rank: "A", suit: "diamonds" },
        { rank: "10", suit: "clubs" },
        { rank: "10", suit: "spades" },
        { rank: "9", suit: "hearts" },
      ]
    },
    {
      name: "One Pair",
      thaiName: "วันแพร์",
      description: "Two cards of the same rank",
      exampleCards: [
        { rank: "J", suit: "hearts" },
        { rank: "J", suit: "diamonds" },
        { rank: "9", suit: "spades" },
        { rank: "5", suit: "clubs" },
        { rank: "2", suit: "hearts" },
      ]
    },
    {
      name: "High Card",
      thaiName: "ไฮการ์ด",
      description: "When no other hand ranks are made",
      exampleCards: [
        { rank: "A", suit: "spades" },
        { rank: "J", suit: "hearts" },
        { rank: "9", suit: "diamonds" },
        { rank: "5", suit: "clubs" },
        { rank: "3", suit: "spades" },
      ]
    }
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pokerHands.map((hand, index) => (
          <Card key={index} className="border-2 border-poker-green">
            <CardHeader className="bg-poker-green text-white">
              <CardTitle>{hand.name}</CardTitle>
              <CardDescription className="text-white/80">{hand.thaiName}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4 text-gray-600">{hand.description}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {hand.exampleCards.map((card, cardIndex) => (
                  <PlayingCard 
                    key={cardIndex} 
                    rank={card.rank as any} 
                    suit={card.suit as any}
                    size="sm"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HandRankings;
