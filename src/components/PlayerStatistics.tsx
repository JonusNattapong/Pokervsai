
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerStats, getWinRate } from '@/services/statsService';
import { Trophy, Clock, DollarSign, Percent, ArrowBigUp, Medal } from 'lucide-react';

interface PlayerStatisticsProps {
  stats: PlayerStats;
}

const PlayerStatistics: React.FC<PlayerStatisticsProps> = ({ stats }) => {
  const winRate = getWinRate(stats);
  
  return (
    <Card className="shadow-md border-poker-green/20">
      <CardHeader className="bg-poker-green text-white">
        <CardTitle className="flex items-center">
          <Trophy className="mr-2 h-5 w-5 text-poker-gold" />
          สถิติผู้เล่น
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-fade-in">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <Clock className="mr-1 h-4 w-4" />
              <span>เกมที่เล่น</span>
            </div>
            <p className="text-xl font-bold">{stats.handsPlayed}</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <Trophy className="mr-1 h-4 w-4 text-poker-gold" />
              <span>ชนะ</span>
            </div>
            <p className="text-xl font-bold">{stats.handsWon}</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <Percent className="mr-1 h-4 w-4" />
              <span>อัตราชนะ</span>
            </div>
            <p className="text-xl font-bold">{winRate.toFixed(1)}%</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <DollarSign className="mr-1 h-4 w-4" />
              <span>กองใหญ่สุด</span>
            </div>
            <p className="text-xl font-bold">฿{stats.biggestPot}</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <ArrowBigUp className="mr-1 h-4 w-4" />
              <span>ออลอินทั้งหมด</span>
            </div>
            <p className="text-xl font-bold">{stats.allInCount}</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <Medal className="mr-1 h-4 w-4" />
              <span>มือดีที่สุด</span>
            </div>
            <p className="text-lg font-bold truncate">
              {stats.bestHand || "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerStatistics;
