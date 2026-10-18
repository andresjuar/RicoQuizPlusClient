export type MatchStatus = 'waiting' | 'in_progress' | 'finished' | 'cancelled';

export interface MatchPlayer {
  user?: string;
  guestName?: string;
  score: number;
  correctAnswers: number;
}

export interface Match {
  _id: string;
  quiz?: string;
  host: string;
  roomCode: string;
  status: MatchStatus;
  startedAt?: string;
  finishedAt?: string;
  players: MatchPlayer[];
  createdAt: string;
}

/** Fila que muestra la vista de historial */
export interface MatchHistoryItem {
  matchId: string;
  quizTitle: string;
  playedAt: string;
  score: number;
  rank: number;
  totalPlayers: number;
}