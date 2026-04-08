import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Zap, Play, BarChart2, Users, ArrowLeft, RotateCcw, LogIn, LogOut, User } from 'lucide-react';
import RaceCanvas from './components/RaceCanvas';
import MathInput from './components/MathInput';
import { Problem, CarState, GameState, UserStats, Unlockables } from './types';
import { generateProblem, BASE_SPEED, RACE_DISTANCE, POKEMON_CHARACTERS, MAX_BOOST, EVOLUTION_CHAINS, WINS_TO_EVOLVE, BOSS_POKEMON, BOSS_PROBABILITY } from './constants';
import { auth, db, googleProvider, signInWithPopup, signOut, doc, getDoc, setDoc, serverTimestamp } from './firebase';
import { Sparkles } from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  // Auth State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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
  const [lastCorrectTime, setLastCorrectTime] = useState(0);
  
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
    points: 0,
    pokemonWins: {}
  });
  const [showEvolution, setShowEvolution] = useState<{ from: string, to: string } | null>(null);
  const [isBossBattle, setIsBossBattle] = useState(false);
  const [versusData, setVersusData] = useState<{ player: any, boss: any } | null>(null);

  const gameLoopRef = useRef<number>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Load data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUnlockables({
              characters: data.unlockedCharacters || [POKEMON_CHARACTERS[0].id],
              currentCharacter: data.currentCharacter || POKEMON_CHARACTERS[0].id,
              points: data.points || 0,
              pokemonWins: data.pokemonWins || {}
            });
            if (data.stats) {
              setStats(data.stats);
            }
          } else {
            // New user, create initial doc
            await saveToFirestore(firebaseUser.uid, {
              points: 0,
              unlockedCharacters: [POKEMON_CHARACTERS[0].id],
              currentCharacter: POKEMON_CHARACTERS[0].id,
              pokemonWins: {},
              stats: {
                totalProblems: 0,
                correctAnswers: 0,
                totalTime: 0,
                weakTypes: {}
              }
            });
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      } else {
        // Reset to defaults if logged out
        setUnlockables({
          characters: [POKEMON_CHARACTERS[0].id],
          currentCharacter: POKEMON_CHARACTERS[0].id,
          points: 0,
          pokemonWins: {}
        });
        setStats({
          totalProblems: 0,
          correctAnswers: 0,
          totalTime: 0,
          weakTypes: {}
        });
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const saveToFirestore = async (uid: string, data: any) => {
    try {
      await setDoc(doc(db, 'users', uid), {
        points: data.points,
        unlockedCharacters: data.unlockedCharacters,
        currentCharacter: data.currentCharacter,
        pokemonWins: data.pokemonWins || {},
        stats: data.stats,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  };

  // Sync state to Firestore when it changes
  useEffect(() => {
    if (user && !isAuthLoading && gameState === 'start') {
      saveToFirestore(user.uid, {
        points: unlockables.points,
        unlockedCharacters: unlockables.characters,
        currentCharacter: unlockables.currentCharacter,
        pokemonWins: unlockables.pokemonWins,
        stats: stats
      });
    }
  }, [unlockables, stats, user, isAuthLoading, gameState]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Initialize Race
  const startRace = () => {
    const playerChar = POKEMON_CHARACTERS.find(p => p.id === unlockables.currentCharacter) || POKEMON_CHARACTERS[0];
    
    const isBoss = Math.random() < BOSS_PROBABILITY;
    
    const initGame = (cars: CarState[], bossActive: boolean) => {
      setCars(cars);
      setIsBossBattle(bossActive);
      setCombo(0);
      setBoostGauge(0);
      setConsecutiveMisses(0);
      setStartTime(Date.now());
      setCurrentProblem(generateProblem(1));
      setUseNumpad(false);
      setGameState('playing');
    };

    if (isBoss) {
      const bossChar = BOSS_POKEMON[Math.floor(Math.random() * BOSS_POKEMON.length)];
      const initialCars = [
        { id: 'player', name: playerChar.name, image: playerChar.image, position: 0, speed: BASE_SPEED, baseSpeed: BASE_SPEED, isPlayer: true, rank: 1 },
        { id: 'boss', name: `BOSS: ${bossChar.name}`, image: bossChar.image, position: 0, speed: BASE_SPEED, baseSpeed: BASE_SPEED * 1.3, isPlayer: false, rank: 2 },
      ];
      
      setVersusData({ player: playerChar, boss: bossChar });
      
      // Wait for dramatic VS animation
      setTimeout(() => {
        setVersusData(null);
        initGame(initialCars, true);
      }, 3500);
    } else {
      // Pick 2 random rivals
      const rivals = POKEMON_CHARACTERS
        .filter(p => p.id !== playerChar.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);

      const initialCars = [
        { id: 'player', name: playerChar.name, image: playerChar.image, position: 0, speed: BASE_SPEED, baseSpeed: BASE_SPEED, isPlayer: true, rank: 1 },
        { id: 'cpu1', name: rivals[0].name, image: rivals[0].image, position: 0, speed: BASE_SPEED, baseSpeed: BASE_SPEED, isPlayer: false, rank: 2 },
        { id: 'cpu2', name: rivals[1].name, image: rivals[1].image, position: 0, speed: BASE_SPEED, baseSpeed: BASE_SPEED, isPlayer: false, rank: 3 },
      ];
      initGame(initialCars, false);
    }
  };

  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const update = () => {
      setCars(prevCars => {
        const newCars = prevCars.map(car => {
          let speed = car.speed;
          
          // CPU logic: faster and more competitive
          if (!car.isPlayer) {
            // Base speed for CPU is slightly higher than player's base
            // Bosses are even faster
            const cpuBase = car.baseSpeed * (car.id === 'boss' ? 1.4 : 1.25);
            // Oscillation + random factor
            const oscillation = Math.sin(Date.now() / 800 + (car.id === 'cpu1' ? 0 : 2)) * 0.6;
            speed = cpuBase + oscillation;
            
            // Adaptive difficulty: CPU gets a boost if player is far ahead
            const playerPos = prevCars.find(c => c.isPlayer)?.position || 0;
            const distanceToPlayer = playerPos - car.position;
            
            if (distanceToPlayer > 400) {
              speed += car.id === 'boss' ? 1.2 : 0.8; // Strong catch up boost
            } else if (distanceToPlayer > 100) {
              speed += car.id === 'boss' ? 0.5 : 0.3; // Slight catch up
            }
            
            // Final sprint: CPU speeds up significantly near the goal
            if (car.position > RACE_DISTANCE * 0.75) {
              speed += 0.5;
            }
          } else {
            // Player speed decay back to base
            if (speed > car.baseSpeed) {
              speed -= 0.04; // Faster decay
            } else if (speed < car.baseSpeed) {
              speed += 0.002; // Even slower recovery
            }
            if (isBoosting) speed += 2.5;
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
          let earnedPoints = (4 - playerRank) * 100;
          if (isBossBattle && playerRank === 1) {
            earnedPoints += 500; // Big bonus for beating boss
          }
          
          // Update points and Wins
          setUnlockables(prev => {
            const currentId = prev.currentCharacter;
            const isWinner = playerRank === 1;
            const currentWins = prev.pokemonWins[currentId] || 0;
            const newWins = isWinner ? currentWins + 1 : currentWins;
            const newPokemonWins = { ...prev.pokemonWins, [currentId]: newWins };
            
            let newCurrentCharacter = currentId;
            let newCharacters = [...prev.characters];
            
            // Evolution Check
            const evolutionData = EVOLUTION_CHAINS[currentId];
            if (evolutionData && newWins >= WINS_TO_EVOLVE) {
              // Evolve!
              let nextId: string;
              if (Array.isArray(evolutionData)) {
                // Branching evolution (like Eevee) - pick random
                nextId = evolutionData[Math.floor(Math.random() * evolutionData.length)];
              } else {
                nextId = evolutionData;
              }

              newCurrentCharacter = nextId;
              if (!newCharacters.includes(nextId)) {
                newCharacters.push(nextId);
              }
              // Reset wins for the new form
              newPokemonWins[nextId] = 0;
              
              // Trigger animation
              setTimeout(() => {
                setShowEvolution({ from: currentId, to: nextId });
              }, 1500);
            }
            
            return {
              ...prev,
              points: prev.points + earnedPoints,
              pokemonWins: newPokemonWins,
              currentCharacter: newCurrentCharacter,
              characters: newCharacters
            };
          });
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
      setLastCorrectTime(Date.now());
      
      // Calculate acceleration
      const timeBonus = Math.max(0, 5 - responseTime);
      const accel = 0.8 + (timeBonus * 0.3) + (combo * 0.1);
      
      setCars(prev => prev.map(c => {
        if (c.isPlayer) {
          return { ...c, speed: c.speed + accel };
        } else {
          // Knockback rivals: more combo = stronger push
          const knockback = 50 + (combo * 10);
          return { ...c, position: Math.max(0, c.position - knockback) };
        }
      }));
      setBoostGauge(prev => Math.min(MAX_BOOST, prev + 5 + (combo * 1)));
      
      // Perfect Answer Bonus (under 1.2s)
      const isPerfect = responseTime < 1.2;
      if (isPerfect) {
        setCars(prev => prev.map(c => c.isPlayer ? { ...c, speed: c.speed + 2.0 } : c));
        setFeedback('correct'); // Could be 'perfect' if we had a separate state
      }

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
      const penalty = 1.0 + (consecutiveMisses * 0.5);
      setCars(prev => prev.map(c => c.isPlayer ? { ...c, speed: Math.max(0.1, c.speed - penalty) } : c));
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
    <div className="min-h-screen bg-[#0a0a1a] font-sans text-gray-100 overflow-hidden select-none touch-none relative">
      {/* Stadium Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Digital Grid */}
        <div className="absolute inset-0 opacity-10" 
          style={{ 
            backgroundImage: `linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} 
        />
        {/* Stadium Lights */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full" />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-red-500/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[800px] h-96 bg-indigo-500/10 blur-[120px] rounded-full" />
        
        {/* Animated Scanning Line */}
        <motion.div 
          animate={{ y: ['0%', '1000%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-full h-[2px] bg-blue-400/20 shadow-[0_0_15px_rgba(96,165,250,0.5)]"
        />
      </div>

      <div className="relative z-10">
        <AnimatePresence mode="wait">
        {gameState === 'start' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center h-screen p-8 relative"
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <div className="text-[30rem] font-black italic text-white select-none">PKMN</div>
            </div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="relative z-10 text-center"
            >
              <h1 className="text-7xl md:text-9xl font-black text-white mb-2 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)] tracking-tighter italic">
                算数<span className="text-red-500">BATTLE!</span>
              </h1>
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent mb-6" />
              <p className="text-2xl font-bold text-blue-300 mb-12 tracking-widest uppercase">Pokemon Math Stadium</p>
            </motion.div>
            
            {/* Auth Section */}
            <div className="mb-12 flex flex-col items-center z-10">
              {isAuthLoading ? (
                <div className="animate-pulse text-blue-400 font-mono">INITIALIZING SYSTEM...</div>
              ) : user ? (
                <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl px-8 py-4 rounded-2xl shadow-2xl border border-white/10">
                  <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-12 h-12 rounded-full border-2 border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)]" referrerPolicy="no-referrer" />
                  <div className="text-left">
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Authenticated Trainer</p>
                    <p className="text-xl font-black text-white leading-tight">{user.displayName}</p>
                  </div>
                  <button onClick={handleLogout} className="ml-6 p-2 text-white/40 hover:text-red-500 transition-colors">
                    <LogOut size={24} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="flex items-center gap-4 bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-2xl font-black shadow-2xl border border-white/20 transition-all active:scale-95 backdrop-blur-md"
                >
                  <LogIn className="text-blue-400" />
                  Google LOGIN TO SAVE DATA
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-8 w-full max-w-4xl z-10">
              <button 
                onClick={startRace}
                className="col-span-2 bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white py-12 rounded-3xl text-5xl font-black shadow-[0_12px_0_rgb(30,58,138)] border-4 border-white/30 flex items-center justify-center gap-6 transition-all active:translate-y-2 active:shadow-none group"
              >
                <Play size={64} className="group-hover:scale-110 transition-transform" fill="currentColor" />
                ENTER STADIUM
              </button>
              
              <button 
                onClick={() => setGameState('pokemon')}
                className="bg-blue-400 hover:bg-blue-500 text-white py-6 rounded-2xl text-3xl font-bold shadow-[0_8px_0_rgb(37,99,235)] border-4 border-white flex items-center justify-center gap-3"
              >
                <Users size={32} />
                ポケモン
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
            className="flex flex-col h-[100dvh]"
          >
            {/* Top: Race View */}
            {isBossBattle && (
              <>
                <div className="absolute inset-0 pointer-events-none z-0 bg-red-900/10 animate-pulse" />
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-2 rounded-full text-2xl font-black italic animate-pulse shadow-xl border-4 border-white">
                  BOSS BATTLE!
                </div>
              </>
            )}
            <div className="p-1 md:p-2 bg-white/50 backdrop-blur-sm border-b-2 md:border-b-4 border-blue-200 relative z-10">
              <div className="flex justify-between items-center mb-1 px-1 md:px-2">
                <div className="flex items-center gap-1 md:gap-3">
                  <div className="bg-blue-600 text-white px-3 md:px-5 py-0.5 md:py-1 rounded-full text-lg md:text-xl font-black italic shadow-md">
                    {playerCar?.rank}位
                  </div>
                  <div className="text-xl md:text-2xl font-black text-orange-500 flex items-center gap-1">
                    <Zap size={18} fill="currentColor" />
                    {combo}
                  </div>
                </div>
                
                {/* Boost Gauge */}
                <div className="flex items-center gap-1 md:gap-3">
                  <div className="w-24 md:w-48 h-5 md:h-7 bg-gray-200 rounded-full border-2 border-white shadow-inner relative overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-orange-400 to-yellow-300"
                      animate={{ width: `${boostGauge}%` }}
                    />
                    {boostGauge >= 50 && (
                      <div className="absolute inset-0 flex items-center justify-center text-[8px] md:text-[10px] font-black text-white animate-pulse">
                        READY!
                      </div>
                    )}
                  </div>
                  <button 
                    onMouseDown={handleBoostStart}
                    onTouchStart={handleBoostStart}
                    disabled={boostGauge < 50}
                    className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${
                      boostGauge >= 50 ? 'bg-orange-500 shadow-lg scale-110 active:scale-95' : 'bg-gray-400 opacity-50'
                    }`}
                  >
                    <Zap size={20} className="md:w-7 md:h-7" color="white" fill="white" />
                  </button>
                </div>
              </div>
              
              <RaceCanvas 
                cars={cars} 
                playerProgress={playerProgress} 
                isBoosting={isBoosting} 
                lastCorrectTime={lastCorrectTime}
              />
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
            className="flex flex-col items-center justify-center h-screen p-8 relative z-10 text-white"
          >
            {isBossBattle && playerCar?.rank === 1 && (
              <motion.div 
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                className="mb-6 bg-gradient-to-r from-red-600 to-orange-500 text-white px-10 py-4 rounded-2xl text-4xl font-black italic shadow-[0_10px_0_rgb(153,27,27)] border-4 border-white flex items-center gap-4"
              >
                <Sparkles className="text-yellow-300" size={40} />
                BOSS SLAYER!
              </motion.div>
            )}
            <Trophy size={120} className="text-yellow-400 mb-6 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
            <h2 className="text-7xl font-black mb-2 italic tracking-tighter">ゴール！！</h2>
            <div className="text-9xl font-black mb-8 italic drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-300">
              {playerCar?.rank}位
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl mb-12 w-full max-w-2xl text-center border border-white/10 -skew-x-3">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xl opacity-60 uppercase tracking-widest font-black">せいかい数</p>
                  <p className="text-6xl font-black italic">{stats.correctAnswers}もん</p>
                </div>
                <div>
                  <p className="text-xl opacity-60 uppercase tracking-widest font-black">ゲットしたポイント</p>
                  <p className="text-6xl font-black text-yellow-300 italic">
                    {((4 - (playerCar?.rank || 3)) * 100) + (isBossBattle && playerCar?.rank === 1 ? 500 : 0)}pt
                  </p>
                </div>
              </div>
              
              {playerCar?.rank === 1 && EVOLUTION_CHAINS[unlockables.currentCharacter] && (
                <div className="mt-8 bg-blue-500/20 p-4 rounded-2xl border-2 border-blue-400/50">
                  <p className="text-2xl font-black text-blue-200 italic">
                    あと {WINS_TO_EVOLVE - (unlockables.pokemonWins[unlockables.currentCharacter] || 0)}回 1位で しんか！
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-6">
              <button 
                onClick={startRace}
                className="bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-white px-12 py-6 rounded-2xl text-4xl font-black shadow-[0_8px_0_rgb(161,98,7)] border-4 border-white/30 flex items-center gap-4 transition-all active:translate-y-2 active:shadow-none"
              >
                <RotateCcw size={40} />
                もういっかい！
              </button>
              <button 
                onClick={() => setGameState('start')}
                className="bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white px-12 py-6 rounded-2xl text-4xl font-black shadow-[0_8px_0_rgb(30,58,138)] border-4 border-white/30 flex items-center gap-4 transition-all active:translate-y-2 active:shadow-none"
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
            className="p-12 h-screen flex flex-col relative z-10"
          >
            <div className="flex items-center gap-6 mb-12">
              <button onClick={() => setGameState('start')} className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-full shadow-xl border border-white/20 backdrop-blur-md">
                <ArrowLeft size={40} />
              </button>
              <h2 className="text-6xl font-black text-white italic tracking-tighter drop-shadow-lg">きろく</h2>
            </div>

            <div className="grid grid-cols-3 gap-8 flex-1">
              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10 flex flex-col items-center justify-center -skew-x-3">
                <p className="text-2xl text-blue-300 mb-2 font-black uppercase tracking-widest">ぜんぶで</p>
                <p className="text-8xl font-black text-white italic">{stats.totalProblems}もん</p>
                <p className="text-2xl text-blue-300 mt-2 font-black uppercase tracking-widest">といたよ！</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10 flex flex-col items-center justify-center -skew-x-3">
                <p className="text-2xl text-green-300 mb-2 font-black uppercase tracking-widest">せいかいりつ</p>
                <p className="text-8xl font-black text-white italic">
                  {stats.totalProblems > 0 ? Math.round((stats.correctAnswers / stats.totalProblems) * 100) : 0}%
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10 flex flex-col items-center justify-center -skew-x-3">
                <p className="text-2xl text-red-300 mb-2 font-black uppercase tracking-widest">にがてなもの</p>
                <div className="text-5xl font-black text-white italic">
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

        {gameState === 'pokemon' && (
          <motion.div 
            key="pokemon"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="p-8 md:p-12 h-screen flex flex-col relative z-10"
          >
            <div className="flex items-center justify-between mb-8 md:mb-12">
              <div className="flex items-center gap-4 md:gap-6">
                <button onClick={() => setGameState('start')} className="p-3 md:p-4 bg-white/10 hover:bg-white/20 text-white rounded-full shadow-xl border border-white/20 backdrop-blur-md">
                  <ArrowLeft size={32} />
                </button>
                <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter drop-shadow-lg">ポケモンをえらぶ</h2>
              </div>
              <div className="bg-yellow-400 text-white px-6 md:px-8 py-2 md:py-4 rounded-2xl text-xl md:text-3xl font-black shadow-xl border-4 border-white -skew-x-6">
                {unlockables.points} pt
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 overflow-y-auto p-2 md:p-4">
              {POKEMON_CHARACTERS.filter(char => {
                // Show if it's a base form (not a result of evolution)
                // OR if it's already unlocked
                const evolvedIds = Object.values(EVOLUTION_CHAINS).flat();
                const isEvolvedForm = evolvedIds.includes(char.id);
                const isUnlocked = unlockables.characters.includes(char.id);
                return !isEvolvedForm || isUnlocked;
              }).map((char) => {
                const isUnlocked = unlockables.characters.includes(char.id);
                const isSelected = unlockables.currentCharacter === char.id;
                const wins = unlockables.pokemonWins[char.id] || 0;
                const hasEvolution = !!EVOLUTION_CHAINS[char.id];
                
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
                          currentCharacter: char.id,
                          pokemonWins: { ...prev.pokemonWins, [char.id]: 0 }
                        }));
                      }
                    }}
                    className={`p-3 md:p-4 rounded-3xl border-4 md:border-8 transition-all flex flex-col items-center gap-1 md:gap-2 relative -skew-x-2 ${
                      isSelected ? 'border-blue-500 bg-blue-500/20 scale-105 shadow-[0_0_30px_rgba(59,130,246,0.5)]' : 'border-white/10 bg-white/5 backdrop-blur-md'
                    } ${!isUnlocked && unlockables.points < 300 ? 'opacity-50 grayscale' : ''}`}
                  >
                    <img 
                      src={char.image} 
                      alt={char.name}
                      className="w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                    <p className="text-lg md:text-xl font-black text-white truncate w-full italic">{char.name}</p>
                    
                    {isUnlocked && hasEvolution && (
                      <p className="text-[10px] font-black text-green-400 uppercase tracking-tighter">あと{WINS_TO_EVOLVE - wins}回1位で進化</p>
                    )}

                    <p className={`text-xs md:text-sm font-black uppercase tracking-widest ${isSelected ? 'text-blue-400' : 'text-yellow-400'}`}>
                      {isUnlocked ? (isSelected ? 'SELECTED' : 'USE') : '300pt'}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Versus Screen */}
      <AnimatePresence>
        {versusData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black"
          >
            {/* Background Slants */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0 bg-blue-600 w-1/2 -skew-x-12 -translate-x-20 border-r-8 border-white"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: '0%' }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0 left-1/2 bg-red-600 w-1/2 -skew-x-12 translate-x-20 border-l-8 border-white"
            />

            <div className="relative z-10 flex items-center justify-center w-full h-full max-w-7xl px-8">
              {/* Player Side */}
              <motion.div
                initial={{ x: -200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex-1 flex flex-col items-center"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-400 blur-3xl opacity-30 rounded-full" />
                  <img 
                    src={versusData.player.image} 
                    className="w-48 h-48 md:w-80 md:h-80 object-contain drop-shadow-2xl relative z-10" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="text-4xl md:text-6xl font-black text-white mt-4 italic tracking-tighter drop-shadow-lg">
                  {versusData.player.name}
                </h3>
              </motion.div>

              {/* VS Center */}
              <motion.div
                initial={{ scale: 5, opacity: 0, rotate: -45 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ delay: 0.8, type: "spring", damping: 10 }}
                className="mx-4 md:mx-12 relative z-20"
              >
                <div className="text-8xl md:text-[12rem] font-black text-white italic drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] leading-none">
                  VS
                </div>
              </motion.div>

              {/* Boss Side */}
              <motion.div
                initial={{ x: 200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex-1 flex flex-col items-center"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-red-400 blur-3xl opacity-30 rounded-full" />
                  <img 
                    src={versusData.boss.image} 
                    className="w-48 h-48 md:w-80 md:h-80 object-contain drop-shadow-2xl relative z-10" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="text-4xl md:text-6xl font-black text-white mt-4 italic tracking-tighter drop-shadow-lg">
                  {versusData.boss.name}
                </h3>
              </motion.div>
            </div>

            {/* Flash Effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: 0.8, duration: 0.2 }}
              className="absolute inset-0 bg-white z-30 pointer-events-none"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evolution Modal */}
      <AnimatePresence>
        {showEvolution && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a1a]/95 backdrop-blur-2xl p-8 text-white text-center"
          >
            <div className="absolute inset-0 opacity-10" 
              style={{ 
                backgroundImage: `linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }} 
            />
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="flex flex-col items-center relative z-10"
            >
              <Sparkles size={80} className="text-yellow-300 mb-4 animate-bounce" />
              <h2 className="text-4xl md:text-6xl font-black mb-8 md:mb-12 italic tracking-tighter">おめでとう！しんかした！</h2>
              
              <div className="flex items-center gap-6 md:gap-12 mb-8 md:mb-12">
                <div className="flex flex-col items-center">
                  <img 
                    src={POKEMON_CHARACTERS.find(p => p.id === showEvolution.from)?.image} 
                    className="w-32 h-32 md:w-48 md:h-48 object-contain opacity-30 grayscale" 
                    referrerPolicy="no-referrer"
                  />
                  <p className="text-xl md:text-2xl font-black opacity-30 italic">{POKEMON_CHARACTERS.find(p => p.id === showEvolution.from)?.name}</p>
                </div>
                
                <motion.div
                  animate={{ x: [0, 10, 0], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-4xl md:text-6xl font-black text-blue-400"
                >
                  ▶▶
                </motion.div>

                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{ 
                      filter: ["drop-shadow(0 0 0px #fff)", "drop-shadow(0 0 30px #fff)", "drop-shadow(0 0 0px #fff)"]
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <motion.img 
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: [0, 1.2, 1], rotate: 0 }}
                      transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
                      src={POKEMON_CHARACTERS.find(p => p.id === showEvolution.to)?.image} 
                      className="w-40 h-40 md:w-64 md:h-64 object-contain" 
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="text-3xl md:text-5xl font-black text-yellow-300 italic drop-shadow-lg"
                  >
                    {POKEMON_CHARACTERS.find(p => p.id === showEvolution.to)?.name}
                  </motion.p>
                </div>
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                onClick={() => setShowEvolution(null)}
                className="bg-white text-blue-900 px-12 py-4 rounded-full text-2xl font-black hover:bg-blue-100 transition-colors shadow-xl"
              >
                やったー！
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
