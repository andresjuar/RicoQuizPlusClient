export interface Question {
  question: string;
  imageUrl?: string;
  options: string[];
  correctIndex: number;
  timeLimitSeconds: number; // 5–120
}

/** owner llega poblado por la API ({ _id, displayName }) */
export interface QuizOwner {
  _id: string;
  displayName: string;
  avatarUrl?: string;
}

/** Lo que regresan los listados: sin preguntas, con conteo y duración */
export interface QuizSummary {
  _id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  owner: QuizOwner;
  topic?: string;
  generatedByAI?: boolean;
  isPublic: boolean;
  tags: string[];
  timesPlayed: number;
  questionCount: number;
  totalSeconds: number;
  createdAt: string;
  updatedAt: string;
}

/** Quiz completo: GET /quizzes/:id (detalle y edición) */
export interface Quiz extends Omit<QuizSummary, 'questionCount' | 'totalSeconds'> {
  generatedByAI: boolean;
  questions: Question[];
}

/** Lo que mandan POST /quizzes y PUT /quizzes/:id */
export type QuizDraft = Pick<Quiz, 'title' | 'description' | 'topic' | 'isPublic' | 'tags'> & {
  questions: Question[];
};

/** Filtros de los listados (se mandan como query params) */
export interface QuizQuery {
  q?: string;
  topic?: string;
  page?: number;
  limit?: number;
  visibility?: 'all' | 'public' | 'private'; // solo /quizzes/mine
}

/** Para tratar un Quiz completo (p. ej. uno recién generado con IA) como tarjeta de lista */
export function toSummary(quiz: Quiz): QuizSummary {
  return {
    ...quiz,
    questionCount: quiz.questions.length,
    totalSeconds: quiz.questions.reduce((sum, q) => sum + q.timeLimitSeconds, 0),
  };
}