
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HandRankings from '@/components/HandRankings';
import CardSelector from '@/components/CardSelector';
import PokerGame from '@/components/PokerGame';
import { preloadSounds } from '@/utils/soundEffects';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'rankings' | 'cardSelector' | 'game'>('rankings');

  // Preload sounds when the app starts
  useEffect(() => {
    preloadSounds();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 animate-fade-in">
        {activeTab === 'rankings' ? (
          <HandRankings />
        ) : activeTab === 'cardSelector' ? (
          <CardSelector />
        ) : (
          <PokerGame />
        )}
      </main>
      
      <footer className="bg-poker-darkGreen text-white py-4 text-center">
        <p>© 2025 Thai Poker Helper | สร้างด้วย Lovable</p>
      </footer>
    </div>
  );
};

export default Index;
