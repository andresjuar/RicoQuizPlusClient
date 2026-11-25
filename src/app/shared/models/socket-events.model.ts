import {
  AnswerCount,
  AnswerRevealed,
  GameOver,
  HostQuestion,
  LeaderboardEntry,
  PlayerRole,
  PublicPlayer,
  PublicQuestion,
} from './game.model';

/**
 * Contrato de eventos de Socket.IO del namespace `/matches`.
 * Es el espejo de `src/types/match.types.ts` del backend: si cambia allá, se cambia aquí.
 */

/** Estado de la sala que manda el servidor al unirse o reconectarse (late join / reconexión) */
export type RoomSyncData =
  | { state: 'lobby' }
  | { state: 'loading' }
  | { state: 'question'; question: PublicQuestion | HostQuestion; secondsLeft: number; alreadyAnswered: boolean }
  | { state: 'reveal'; revealed: AnswerRevealed }
  | { state: 'leaderboard'; leaderboard: LeaderboardEntry[] }
  | { state: 'finished'; result: GameOver };

// Cliente -> Servidor

export interface RoomJoinPayload {
  roomCode: string;
  /** Obligatorio si no hay JWT (invitado) */
  guestName?: string;
}

export interface SubmitAnswerPayload {
  questionIndex: number;
  answerIndex: number;
}

// Servidor -> Cliente

export interface RoomJoinedOkPayload {
  roomCode: string;
  role: PlayerRole;
  displayName: string;
  score: number;
  isReconnect: boolean;
  isLateJoin: boolean;
  players: PublicPlayer[];
  sync: RoomSyncData;
}

export interface RoomPlayerJoinedPayload {
  players: PublicPlayer[];
  joined: PublicPlayer;
  reconnected: boolean;
}

export interface RoomPlayerDisconnectedPayload {
  players: PublicPlayer[];
  disconnected: { socketId: string; displayName: string };
  graceSeconds: number;
}

export interface RoomPlayerLeftPayload {
  players: PublicPlayer[];
  left: { socketId: string; displayName: string };
}

export interface GameLeaderboardPayload {
  leaderboard: LeaderboardEntry[];
  isFinalRound: boolean;
}

export interface GamePlayAgainOkPayload {
  matchId: string;
  players: PublicPlayer[];
}

export type SocketErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_IN_PROGRESS'
  | 'ROOM_FULL'
  | 'ROOM_FINISHED'
  | 'ROOM_CANCELLED'
  | 'NOT_HOST'
  | 'INVALID_STATE'
  | 'ALREADY_ANSWERED'
  | 'UNKNOWN';

export interface SocketErrorPayload {
  code: SocketErrorCode;
  message: string;
}

export interface ClientToServerEvents {
  'room:join': (payload: RoomJoinPayload) => void;
  'room:leave': () => void;
  'game:start': () => void;
  'game:next_question': () => void;
  'game:submit_answer': (payload: SubmitAnswerPayload) => void;
  'game:reveal_answer': () => void;
  'game:play_again': () => void;
}

export interface ServerToClientEvents {
  'room:joined_ok': (payload: RoomJoinedOkPayload) => void;
  'room:player_joined': (payload: RoomPlayerJoinedPayload) => void;
  'room:player_disconnected': (payload: RoomPlayerDisconnectedPayload) => void;
  'room:player_left': (payload: RoomPlayerLeftPayload) => void;
  'game:loading': (payload: { message: string }) => void;
  'game:ready': (payload: { totalQuestions: number }) => void;
  'game:question': (payload: PublicQuestion | HostQuestion) => void;
  'game:timer_tick': (payload: { questionIndex: number; secondsLeft: number }) => void;
  'game:answer_received': (payload: { received: true }) => void;
  'game:answer_count': (payload: AnswerCount) => void;
  'game:answer_revealed': (payload: AnswerRevealed) => void;
  'game:leaderboard': (payload: GameLeaderboardPayload) => void;
  'game:over': (payload: GameOver) => void;
  'game:play_again_ok': (payload: GamePlayAgainOkPayload) => void;
  error: (payload: SocketErrorPayload) => void;
}

export type ServerEvent = keyof ServerToClientEvents;
export type ServerPayload<E extends ServerEvent> = Parameters<ServerToClientEvents[E]>[0];
export type ClientEvent = keyof ClientToServerEvents;
export type ClientPayload<E extends ClientEvent> = Parameters<ClientToServerEvents[E]>;

/** Estado de la conexión que muestra el indicador */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
