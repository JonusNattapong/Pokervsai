
import { CreditCard, Gamepad2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SoundSettings from "./SoundSettings";

interface HeaderProps {
  onTabChange: (tab: 'rankings' | 'cardSelector' | 'game') => void;
  activeTab: 'rankings' | 'cardSelector' | 'game';
}

const Header = ({ onTabChange, activeTab }: HeaderProps) => {
  return (
    <header className="bg-poker-green text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
        <div className="flex items-center mb-4 sm:mb-0">
          <CreditCard className="h-8 w-8 mr-2 text-poker-gold" />
          <h1 className="text-2xl font-bold">Thai Poker Helper</h1>
        </div>
        <div className="flex items-center">
          <nav className="flex flex-wrap gap-2 mr-2">
            <Button 
              variant={activeTab === 'rankings' ? "default" : "outline"}
              onClick={() => onTabChange('rankings')}
              className={activeTab === 'rankings' 
                ? "bg-white text-poker-green hover:bg-poker-gold hover:text-white transition-colors duration-300" 
                : "bg-transparent border-white text-white hover:bg-white hover:text-poker-green transition-colors duration-300"}
            >
              Hand Rankings
            </Button>
            <Button 
              variant={activeTab === 'cardSelector' ? "default" : "outline"}
              onClick={() => onTabChange('cardSelector')}
              className={activeTab === 'cardSelector' 
                ? "bg-white text-poker-green hover:bg-poker-gold hover:text-white transition-colors duration-300" 
                : "bg-transparent border-white text-white hover:bg-white hover:text-poker-green transition-colors duration-300"}
            >
              Card Selector
            </Button>
            <Button 
              variant={activeTab === 'game' ? "default" : "outline"}
              onClick={() => onTabChange('game')}
              className={activeTab === 'game' 
                ? "bg-white text-poker-green hover:bg-poker-gold hover:text-white transition-colors duration-300" 
                : "bg-transparent border-white text-white hover:bg-white hover:text-poker-green transition-colors duration-300"}
            >
              <Gamepad2 className="mr-1 animate-pulse" />
              Play Game
            </Button>
          </nav>
          <SoundSettings />
        </div>
      </div>
    </header>
  );
};

export default Header;
