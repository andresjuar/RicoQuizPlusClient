export type MatchStatus = 'waiting' | 'in_progress' | 'finished' | 'cancelled';

export interface MatchPlayer {
  user?: string;
  guestName?: string;
  score: number;
  correctAnswers: number;
}

export interface Match {
  _id: string;
  quiz?: string | { _id: string; title: string };
  host: string;
  roomCode: string;
  status: MatchStatus;
  startedAt?: string;
  finishedAt?: string;
  players: MatchPlayer[];
  createdAt: string;
}

/** GET /matches/rooms/:code/exists */
export interface RoomStatus {
  exists: boolean;
  inProgress: boolean;
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
/** El backend genera códigos de 4 letras (A-Z), p. ej. "QWER" */
export const ROOM_CODE_LENGTH = 4;
export const ROOM_CODE_PATTERN = /^[A-Z]{4}$/;

/** Normaliza lo que escribe el usuario o llega en la URL: sin espacios y en mayúsculas */
export const normalizeRoomCode = (code: string): string => code.replace(/\s+/g, '').toUpperCase();
