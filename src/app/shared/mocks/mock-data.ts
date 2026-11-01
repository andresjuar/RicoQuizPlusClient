import { QuizSummary } from '../models/quiz.model';
import { LeaderboardEntry, PublicPlayer, HostQuestion } from '../models/game.model';

/** Mocks del juego en tiempo real: se van con la entrega de sockets. Los servicios REST ya usan la API. */
export const MOCK_GAME_QUIZ: QuizSummary = {
  _id: 'q1', title: 'Misterios del cosmos', description: 'Planetas, estrellas y agujeros negros.',
  owner: { _id: 'u1', displayName: 'Andrés' }, topic: 'Ciencia', generatedByAI: true, isPublic: true,
  tags: ['ciencia', 'espacio'], timesPlayed: 128, questionCount: 10, totalSeconds: 200,
  createdAt: '2026-09-10T00:00:00Z', updatedAt: '2026-09-10T00:00:00Z',
};

export const MOCK_PLAYERS: PublicPlayer[] = ['Sofi', 'Mateo', 'Lucía', 'Nico', 'Valen', 'Emma']
  .map((displayName, i) => ({ socketId: `s${i}`, displayName, score: 0, isConnected: true }));

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  ['Sofi', 9420], ['Mateo', 8760], ['Lucía', 7980], ['Nico', 7420], ['Valen', 6890], ['Emma', 6310],
].map(([displayName, score], i) => ({
  socketId: `s${i}`, displayName: displayName as string, score: score as number,
  isConnected: true, rank: i + 1, lastPoints: 900 - i * 100, lastAnswerCorrect: i < 4,
}));

export const MOCK_QUESTION: HostQuestion = {
  questionIndex: 2, totalQuestions: 10, timeLimitSeconds: 20,
  question: '¿Cuál es el océano más grande del planeta?',
  options: ['Atlántico', 'Pacífico', 'Índico', 'Ártico'], correctIndex: 1,
};
