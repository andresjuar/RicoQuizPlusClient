export interface Question {
  question: string;
  imageUrl?: string;
  options: string[];
  correctIndex: number;
  timeLimitSeconds: number; // 5–120
}

export interface Quiz {
  _id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  owner: string;
  topic?: string;
  generatedByAI: boolean;
  isPublic: boolean;
  tags: string[];
  timesPlayed: number;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export type QuizDraft = Pick<Quiz, 'title' | 'description' | 'topic' | 'isPublic' | 'tags'> & {
  questions: Question[];
};