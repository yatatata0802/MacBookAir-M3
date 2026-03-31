export type Problem = {
  id: string;
  question: string;
  answer: number;
  options: number[];
  type: 'add' | 'sub';
};

export type CarState = {
  id: string;
  name: string;
  image: string;
  position: number; // 0 to RACE_DISTANCE
  speed: number;
  baseSpeed: number;
  isPlayer: boolean;
  rank: number;
};

export type GameState = 'start' | 'playing' | 'result' | 'stats' | 'garage';

export type UserStats = {
  totalProblems: number;
  correctAnswers: number;
  totalTime: number; // seconds
  weakTypes: { [key: string]: number }; // count of misses per type
};

export type Unlockables = {
  characters: string[]; // IDs of unlocked pokemon
  currentCharacter: string; // ID of current pokemon
  points: number;
};
