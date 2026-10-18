export type GamePhase =
  | 'connecting' | 'guest-gate' | 'lobby' | 'loading'
  | 'question' | 'reveal' | 'leaderboard' | 'finished' | 'error';

export type PlayerRole = 'host' | 'player';

export interface PublicPlayer {
  socketId: string;
  userId?: string;
  displayName: string;
  score: number;
  isConnected: boolean;
}

export interface LeaderboardEntry extends PublicPlayer {
  rank: number;
  lastPoints: number;
  lastAnswerCorrect: boolean;
}

export interface PublicQuestion {
  questionIndex: number;
  totalQuestions: number;
  question: string;
  imageUrl?: string;
  options: string[];
  timeLimitSeconds: number;
}

export interface HostQuestion extends PublicQuestion {
  correctIndex: number;
}

export interface AnswerRevealed {
  questionIndex: number;
  correctIndex: number;
  correctText: string;
}

export interface AnswerCount {
  answeredCount: number;
  totalPlayers: number;
}

export interface GameOver {
  winner: { socketId: string; displayName: string; score: number };
  leaderboard: LeaderboardEntry[];
}