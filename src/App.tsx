import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Zap, Play, BarChart2, Car, ArrowLeft, RotateCcw } from 'lucide-react';
import RaceCanvas from './components/RaceCanvas';
import MathInput from './components/MathInput';
import { Problem, CarState, GameState, UserStats, Unlockables } from './types';
import { generateProblem, BASE_SPEED, RACE_DISTANCE, POKEMON_CHARACTERS, MAX_BOOST } from './constants';

export default function App() {
  // Game State
  const [gameState, setGameState] = useState<GameState>('start');
  const [cars, setCars] = useState<CarState[]>([]);
  const [currentProblem, setCurrentProblem] = useState<Problem>(generateProblem(1));
  const [combo, setCombo] = useState(0);
  const [boostGauge, setBoostGauge] = useState(0);
  const [isBoosting, setIsBoosting] = useState(false);
  const [useNumpad, setUseNumpad] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  
  // Stats & Progress
  const [stats, setStats] = useState<UserStats>({
    totalProblems: 0,
    correctAnswers: 0,
    totalTime: 0,
    weakTypes: {}
  });
  const [unlockables, setUnlockables] = useState<Unlockables>({
    characters: [POKEMON_CHARACTERS[0].id],
    currentCharacter: POKEMON_CHARACTERS[0].id,
    points: 0
  });

  const gameLoopRef = useRef<number>(null);

  // Initialize Race
  const startRace = () => {
    const playerChar = POKEMON_CHARACTERS.find(p => p.id === unlockables.currentCharacter) || POKEMON_CHARACTERS[0];
    
    // Pick 2 random rivals
    const rivals = POKEMON_CHARACTERS
      .filter(p => p.id !== playerChar.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    const initialCars: CarState[] = [
      { id: 'player', name: playerChar.name, image: playerChar.image, position: 0, speed: BASE_SPEED, baseSpeed: BASE_SPEED, isPlayer: true, rank: 1 },
      { id: 'cpu1', name: rivals[0].name, image: rivals[0].image, position: 0, speed: BASE_SPEED, baseSpeed: BASE_SPEED, isPlayer: false, rank: 2 },
      { id: 'cpu2', name: rivals[1].name, image: rivals[1].image, position: 0, speed: BASE_SPEED, baseSpeed: BASE_SPEED, isPlayer: false, rank: 3 },
    ];
    setCars(initialCars);
    setGameState('playing');
    setCombo(0);
    setBoostGauge(0);
    setConsecutiveMisses(0);
    setStartTime(Date.now());
    setCurrentProblem(generateProblem(1));
    setUseNumpad(false);
  };

  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const update = () => {
      setCars(prevCars => {
        const newCars = prevCars.map(car => {
          let speed = car.speed;
          
          // CPU logic: random speed fluctuations
          if (!car.isPlayer) {
            speed = car.baseSpeed + (Math.sin(Date.now() / 1000 + (car.id === 'cpu1' ? 0 : 2)) * 0.5);
          } else {
            // Player speed decay back to base
            if (speed > car.baseSpeed) {
              speed -= 0.02;
            } else if (speed < car.baseSpeed) {
              speed += 0.01;
            }
            if (isBoosting) speed += 2;
          }

          const newPos = car.position + speed;
          return { ...car, position: newPos, speed };
        });

        // Update ranks
        const sorted = [...newCars].sort((a, b) => b.position - a.position);
        newCars.forEach(car => {
          car.rank = sorted.findIndex(c => c.id === car.id) + 1;
        });

        // Check for finish
        if (newCars.some(c => c.position >= RACE_DISTANCE)) {
          setGameState('result');
          const playerRank = newCars.find(c => c.isPlayer)?.rank || 3;
          const earnedPoints = (4 - playerRank) * 100;
          setUnlockables(prev => ({ ...prev, points: prev.points + earnedPoints }));
        }

        return newCars;
      });

      gameLoopRef.current = requestAnimationFrame(update);
    };

    gameLoopRef.current = requestAnimationFrame(update);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, isBoosting]);

  const handleAnswer = (answer: number) => {
    const isCorrect = answer === currentProblem.answer;
    const responseTime = (Date.now() - startTime) / 1000;

    if (isCorrect) {
      setFeedback('correct');
      setCombo(prev => prev + 1);
      setConsecutiveMisses(0);
      
      // Calculate acceleration
      const timeBonus = Math.max(0, 5 - responseTime);
      const accel = 0.5 + (timeBonus * 0.2) + (combo * 0.05);
      
      setCars(prev => prev.map(c => c.isPlayer ? { ...c, speed: c.speed + accel } : c));
      setBoostGauge(prev => Math.min(MAX_BOOST, prev + 5 + (combo * 1)));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalProblems: prev.totalProblems + 1,
        correctAnswers: prev.correctAnswers + 1,
        totalTime: prev.totalTime + responseTime
      }));

    } else {
      setFeedback('wrong');
      setCombo(0);
      setConsecutiveMisses(prev => prev + 1);
      
      // Deceleration penalty
      const penalty = 0.5 + (consecutiveMisses * 0.2);
      setCars(prev => prev.map(c => c.isPlayer ? { ...c, speed: Math.max(0.2, c.speed - penalty) } : c));
      setBoostGauge(prev => Math.max(0, prev - 20));

      // Update stats
      setStats(prev => {
        const type = currentProblem.type;
        const newWeakTypes = { ...prev.weakTypes };
        newWeakTypes[type] = (newWeakTypes[type] || 0) + 1;
        return {
          ...prev,
          totalProblems: prev.totalProblems + 1,
          weakTypes: newWeakTypes
        };
      });
    }

    // Reset feedback and generate new problem
    setTimeout(() => {
      setFeedback(null);
      setCurrentProblem(generateProblem(1));
      setStartTime(Date.now());
    }, 600);
  };

  const handleBoostStart = () => {
    if (boostGauge >= 50) {
      setIsBoosting(true);
      setBoostGauge(prev => Math.max(0, prev - 50));
      setTimeout(() => setIsBoosting(false), 2000);
    }
  };

  const playerCar = cars.find(c => c.isPlayer);
  const playerProgress = playerCar ? playerCar.position / RACE_DISTANCE : 0;

  return (
    <div className="min-h-screen bg-sky-100 font-sans text-gray-800 overflow-hidden select-none touch-none">
      <AnimatePresence mode="wait">
        {gameState === 'start' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-screen p-8"
          >
            <h1 className="text-8xl font-black text-blue-600 mb-4 drop-shadow-lg tracking-tighter">
              算数<span className="text-red-500">カーレース！</span>
            </h1>
            <p className="text-2xl font-bold text-blue-400 mb-12">小学2年生むけ けいさんゲーム</p>
            
            <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
              <button 
                onClick={startRace}
                className="col-span-2 bg-yellow-400 hover:bg-yellow-500 text-white py-10 rounded-3xl text-5xl font-black shadow-[0_12px_0_rgb(202,138,4)] border-8 border-white flex items-center justify-center gap-4 transition-all active:translate-y-2 active:shadow-none"
              >
                <Play size={64} fill="currentColor" />
                レースをはじめる！
              </button>
              
              <button 
                onClick={() => setGameState('garage')}
                className="bg-blue-400 hover:bg-blue-500 text-white py-6 rounded-2xl text-3xl font-bold shadow-[0_8px_0_rgb(37,99,235)] border-4 border-white flex items-center justify-center gap-3"
              >
                <Car size={32} />
                ガレージ
              </button>
              
              <button 
                onClick={() => setGameState('stats')}
                className="bg-green-400 hover:bg-green-500 text-white py-6 rounded-2xl text-3xl font-bold shadow-[0_8px_0_rgb(22,163,74)] border-4 border-white flex items-center justify-center gap-3"
              >
                <BarChart2 size={32} />
                きろく
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-screen"
          >
            {/* Top: Race View */}
            <div className="p-4 bg-white/50 backdrop-blur-sm border-b-4 border-blue-200">
              <div className="flex justify-between items-center mb-2 px-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 text-white px-6 py-2 rounded-full text-2xl font-black italic shadow-md">
                    {playerCar?.rank}位
                  </div>
                  <div className="text-3xl font-black text-orange-500 flex items-center gap-2">
                    <Zap fill="currentColor" />
                    {combo} COMBO!
                  </div>
                </div>
                
                {/* Boost Gauge */}
                <div className="flex items-center gap-4">
                  <div className="w-64 h-8 bg-gray-200 rounded-full border-4 border-white shadow-inner relative overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-orange-400 to-yellow-300"
                      animate={{ width: `${boostGauge}%` }}
                    />
                    {boostGauge >= 50 && (
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white animate-pulse">
                        BOOST READY!
                      </div>
                    )}
                  </div>
                  <button 
                    onMouseDown={handleBoostStart}
                    onTouchStart={handleBoostStart}
                    disabled={boostGauge < 50}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                      boostGauge >= 50 ? 'bg-orange-500 shadow-lg scale-110 active:scale-95' : 'bg-gray-400 opacity-50'
                    }`}
                  >
                    <Zap size={40} color="white" fill="white" />
                  </button>
                </div>
              </div>
              
              <RaceCanvas cars={cars} playerProgress={playerProgress} isBoosting={isBoosting} />
            </div>

            {/* Bottom: Math Input */}
            <div className="flex-1 flex items-center justify-center relative">
              <MathInput problem={currentProblem} onAnswer={handleAnswer} useNumpad={useNumpad} />
              
              {/* Feedback Overlay */}
              <AnimatePresence>
                {feedback && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    className={`absolute pointer-events-none text-9xl font-black z-50 ${
                      feedback === 'correct' ? 'text-red-500' : 'text-blue-500'
                    }`}
                  >
                    {feedback === 'correct' ? '○' : '×'}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {gameState === 'result' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-screen p-8 bg-blue-600 text-white"
          >
            <Trophy size={120} className="text-yellow-400 mb-6" />
            <h2 className="text-7xl font-black mb-2">ゴール！！</h2>
            <div className="text-9xl font-black mb-8 italic drop-shadow-xl">
              {playerCar?.rank}位
            </div>
            
            <div className="bg-white/20 backdrop-blur-md p-8 rounded-3xl mb-12 w-full max-w-2xl text-center">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xl opacity-80">せいかい数</p>
                  <p className="text-5xl font-black">{stats.correctAnswers}もん</p>
                </div>
                <div>
                  <p className="text-xl opacity-80">ゲットしたポイント</p>
                  <p className="text-5xl font-black text-yellow-300">{(4 - (playerCar?.rank || 3)) * 100}pt</p>
                </div>
              </div>
            </div>

            <div className="flex gap-6">
              <button 
                onClick={startRace}
                className="bg-yellow-400 hover:bg-yellow-500 text-white px-12 py-6 rounded-2xl text-4xl font-black shadow-[0_8px_0_rgb(202,138,4)] border-4 border-white flex items-center gap-4"
              >
                <RotateCcw size={40} />
                もういっかい！
              </button>
              <button 
                onClick={() => setGameState('start')}
                className="bg-blue-400 hover:bg-blue-500 text-white px-12 py-6 rounded-2xl text-4xl font-black shadow-[0_8px_0_rgb(37,99,235)] border-4 border-white flex items-center gap-4"
              >
                <ArrowLeft size={40} />
                もどる
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'stats' && (
          <motion.div 
            key="stats"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="p-12 h-screen flex flex-col"
          >
            <div className="flex items-center gap-6 mb-12">
              <button onClick={() => setGameState('start')} className="p-4 bg-white rounded-full shadow-md">
                <ArrowLeft size={40} />
              </button>
              <h2 className="text-6xl font-black text-blue-600">きろく</h2>
            </div>

            <div className="grid grid-cols-3 gap-8 flex-1">
              <div className="bg-white p-8 rounded-3xl shadow-xl border-4 border-blue-100 flex flex-col items-center justify-center">
                <p className="text-2xl text-gray-500 mb-2">ぜんぶで</p>
                <p className="text-7xl font-black text-blue-600">{stats.totalProblems}もん</p>
                <p className="text-2xl text-gray-500 mt-2">といたよ！</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-xl border-4 border-green-100 flex flex-col items-center justify-center">
                <p className="text-2xl text-gray-500 mb-2">せいかいりつ</p>
                <p className="text-7xl font-black text-green-600">
                  {stats.totalProblems > 0 ? Math.round((stats.correctAnswers / stats.totalProblems) * 100) : 0}%
                </p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-xl border-4 border-red-100 flex flex-col items-center justify-center">
                <p className="text-2xl text-gray-500 mb-2">にがてなもの</p>
                <div className="text-4xl font-black text-red-500">
                  {Object.keys(stats.weakTypes).length > 0 ? (
                    (() => {
                      const entries = Object.entries(stats.weakTypes);
                      const sorted = entries.sort((a, b) => (b[1] as number) - (a[1] as number));
                      return sorted[0][0] === 'add' ? 'たしざん' : 'ひきざん';
                    })()
                  ) : 'なし！'}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'garage' && (
          <motion.div 
            key="garage"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="p-12 h-screen flex flex-col"
          >
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-6">
                <button onClick={() => setGameState('start')} className="p-4 bg-white rounded-full shadow-md">
                  <ArrowLeft size={40} />
                </button>
                <h2 className="text-6xl font-black text-blue-600">ポケモンをえらぶ</h2>
              </div>
              <div className="bg-yellow-400 text-white px-8 py-4 rounded-2xl text-3xl font-black shadow-md border-4 border-white">
                {unlockables.points} pt
              </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-5 gap-6 overflow-y-auto p-4">
              {POKEMON_CHARACTERS.map((char) => {
                const isUnlocked = unlockables.characters.includes(char.id);
                const isSelected = unlockables.currentCharacter === char.id;
                
                return (
                  <button
                    key={char.id}
                    onClick={() => {
                      if (isUnlocked) {
                        setUnlockables(prev => ({ ...prev, currentCharacter: char.id }));
                      } else if (unlockables.points >= 300) {
                        setUnlockables(prev => ({
                          ...prev,
                          points: prev.points - 300,
                          characters: [...prev.characters, char.id],
                          currentCharacter: char.id
                        }));
                      }
                    }}
                    className={`p-4 rounded-3xl border-8 transition-all flex flex-col items-center gap-2 ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-white bg-white'
                    } ${!isUnlocked && unlockables.points < 300 ? 'opacity-50 grayscale' : ''}`}
                  >
                    <img 
                      src={char.image} 
                      alt={char.name}
                      className="w-24 h-24 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <p className="text-xl font-bold">{char.name}</p>
                    <p className="text-sm font-black text-blue-600">
                      {isUnlocked ? (isSelected ? 'えらんでる！' : 'つかう') : '300pt'}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
