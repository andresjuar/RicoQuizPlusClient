import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { silent } from '../interceptors/http-context';
import { environment } from '../../../environments/environment';
import { Page } from '../models/api.model';
import { Question, Quiz, QuizDraft, QuizQuery, QuizSummary } from '../models/quiz.model';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/quizzes`;

  /** GET /quizzes — quizzes públicos (Explorar, landing) */
  getPublic(query: QuizQuery = {}): Observable<Page<QuizSummary>> {
    return this.http.get<Page<QuizSummary>>(this.url, { params: toParams(query) });
  }

  /** GET /quizzes/mine — quizzes del usuario, públicos y privados (requiere token) */
  getMine(query: QuizQuery = {}): Observable<Page<QuizSummary>> {
    return this.http.get<Page<QuizSummary>>(`${this.url}/mine`, { params: toParams(query) });
  }

  /** GET /quizzes/:id — quiz completo con preguntas; silent: el error no lanza toast (lo usa ownerGuard) */
  getById(id: string, options: { silent?: boolean } = {}): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.url}/${id}`, options.silent ? { context: silent() } : {});
  }

  /** POST /quizzes o PUT /quizzes/:id según haya id */
  save(draft: QuizDraft, id?: string): Observable<Quiz> {
    return id ? this.http.put<Quiz>(`${this.url}/${id}`, draft) : this.http.post<Quiz>(this.url, draft);
  }

  /** DELETE /quizzes/:id */
  delete(id: string): Observable<void> {
    return this.http.delete(`${this.url}/${id}`).pipe(map(() => undefined));
  }

  /** POST /quizzes/generate-questions — preguntas con IA sin guardar (formulario de quiz) */
  generateQuestions(topic: string, numQuestions: number): Observable<Question[]> {
    return this.http
      .post<{ questions: Question[] }>(`${this.url}/generate-questions`, { topic, numQuestions })
      .pipe(map(res => res.questions));
  }

  /** POST /quizzes/generate — genera Y guarda un quiz privado (Nueva partida) */
  generate(topic: string, numQuestions: number): Observable<Quiz> {
    return this.http.post<Quiz>(`${this.url}/generate`, { topic, numQuestions });
  }
}

/** Convierte el objeto de filtros en query params, sin mandar vacíos */
function toParams(query: QuizQuery): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
  }
  return params;
}