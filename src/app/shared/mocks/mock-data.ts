import { User } from '../models/user.model';
import { Quiz } from '../models/quiz.model';
import { MatchHistoryItem } from '../models/match.model';
import { LeaderboardEntry, PublicPlayer, HostQuestion } from '../models/game.model';

export const MOCK_USER: User = {
  _id: 'u1', email: 'andres@iteso.mx', displayName: 'Andrés',
  isActive: true, createdAt: '2026-08-01T00:00:00Z',
};

const q = (question: string, options: string[], correctIndex: number) =>
  ({ question, options, correctIndex, timeLimitSeconds: 20 });

export const MOCK_QUIZZES: Quiz[] = [
  {
    _id: 'q1', title: 'Misterios del cosmos', description: 'Planetas, estrellas y agujeros negros.',
    owner: 'u1', topic: 'Ciencia', generatedByAI: true, isPublic: true, tags: ['ciencia', 'espacio'],
    timesPlayed: 128, createdAt: '2026-09-10T00:00:00Z', updatedAt: '2026-09-10T00:00:00Z',
    questions: [
      q('¿Cuál es el planeta más grande del sistema solar?', ['Saturno', 'Júpiter', 'Neptuno', 'Tierra'], 1),
      q('¿Qué es una supernova?', ['Un cometa', 'La explosión de una estrella', 'Una galaxia', 'Un satélite'], 1),
    ],
  },
  {
    _id: 'q2', title: 'Leyendas del fútbol', description: 'Goles y finales que marcaron una época.',
    owner: 'u2', topic: 'Deportes', generatedByAI: false, isPublic: true, tags: ['deportes', 'fútbol'],
    timesPlayed: 87, createdAt: '2026-09-15T00:00:00Z', updatedAt: '2026-09-15T00:00:00Z',
    questions: [q('¿Qué país ganó el Mundial 2010?', ['Holanda', 'Alemania', 'España', 'Brasil'], 2)],
  },
  {
    _id: 'q3', title: 'Sabores del mundo', description: 'Platillos, ingredientes y tradiciones.',
    owner: 'u1', topic: 'Gastronomía', generatedByAI: true, isPublic: false, tags: ['gastronomía'],
    timesPlayed: 12, createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z',
    questions: [q('¿De qué país es el ramen?', ['China', 'Corea', 'Japón', 'Tailandia'], 2)],
  },
];

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

export const MOCK_HISTORY: MatchHistoryItem[] = [
  { matchId: 'm1', quizTitle: 'Misterios del cosmos', playedAt: '2026-10-15T20:00:00Z', score: 9420, rank: 1, totalPlayers: 8 },
  { matchId: 'm2', quizTitle: 'Leyendas del fútbol', playedAt: '2026-10-12T18:30:00Z', score: 5200, rank: 4, totalPlayers: 6 },
  { matchId: 'm3', quizTitle: 'Sabores del mundo', playedAt: '2026-10-08T21:10:00Z', score: 7800, rank: 2, totalPlayers: 5 },
];