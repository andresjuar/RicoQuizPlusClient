import { Injectable } from '@angular/core';
import { Observable, delay, map, of, timer } from 'rxjs';
import { Question, Quiz, QuizDraft } from '../models/quiz.model';
import { MOCK_QUIZZES, MOCK_USER } from '../mocks/mock-data';

@Injectable({ providedIn: 'root' })
export class QuizService {
  // TODO integración: GET /quizzes?search=
  getPublic(search = ''): Observable<Quiz[]> {
    const term = search.toLowerCase();
    return of(
      MOCK_QUIZZES.filter(q =>
        q.isPublic &&
        (q.title.toLowerCase().includes(term) || q.tags.some(t => t.includes(term))),
      ),
    ).pipe(delay(300));
  }

  // TODO integración: GET /quizzes?owner=me
  getMine(): Observable<Quiz[]> {
    return of(MOCK_QUIZZES.filter(q => q.owner === MOCK_USER._id)).pipe(delay(300));
  }

  // TODO integración: GET /quizzes/:id
  getById(id: string): Observable<Quiz | undefined> {
    return of(MOCK_QUIZZES.find(q => q._id === id)).pipe(delay(200));
  }

    // TODO integración: POST /quizzes/generate { topic, numQuestions }
  generate(topic: string, count: number): Observable<Question[]> {
    return timer(1500).pipe(
      map(() =>
        Array.from({ length: count }, (_, i) => ({
          question: `Pregunta ${i + 1} generada sobre «${topic}»`,
          options: ['Respuesta A', 'Respuesta B', 'Respuesta C', 'Respuesta D'],
          correctIndex: i % 4,
          timeLimitSeconds: 20,
        })),
      ),
    );
  }

  // TODO integración: POST /quizzes  |  PUT /quizzes/:id
  save(draft: QuizDraft, id?: string): Observable<void> {
    return timer(800).pipe(map(() => undefined));
  }
}