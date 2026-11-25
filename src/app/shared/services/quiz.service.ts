import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpParams } from '@angular/common/http';
import { Observable, filter, map } from 'rxjs';
import { silent } from '../interceptors/http-context';
import { environment } from '../../../environments/environment';
import { Page } from '../models/api.model';
import { UploadEvent } from '../models/upload.model';
import { Question, Quiz, QuizDraft, QuizQuery, QuizSummary } from '../models/quiz.model';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/quizzes`;

  getPublic(query: QuizQuery = {}): Observable<Page<QuizSummary>> {
    return this.http.get<Page<QuizSummary>>(this.url, { params: toParams(query) });
  }

  getMine(query: QuizQuery = {}): Observable<Page<QuizSummary>> {
    return this.http.get<Page<QuizSummary>>(`${this.url}/mine`, { params: toParams(query) });
  }

  getById(id: string, options: { silent?: boolean } = {}): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.url}/${id}`, options.silent ? { context: silent() } : {});
  }

  save(draft: QuizDraft, id?: string): Observable<Quiz> {
    return id ? this.http.put<Quiz>(`${this.url}/${id}`, draft) : this.http.post<Quiz>(this.url, draft);
  }

  delete(id: string): Observable<void> {
    return this.http.delete(`${this.url}/${id}`).pipe(map(() => undefined));
  }


  /** POST /quizzes/:id/image (multipart, campo "image") — portada del quiz, con progreso */
  uploadCover(id: string, file: File): Observable<UploadEvent> {
    return this.uploadImage(`${this.url}/${id}/image`, file);
  }

  /**
   * POST /quizzes/:id/questions/:index/image — imagen de una pregunta, con progreso.
   * `index` es la posición de la pregunta en el quiz YA GUARDADO (por eso el formulario sube
   * estas imágenes justo después de guardar, cuando el orden del servidor es el del formulario).
   */
  uploadQuestionImage(id: string, index: number, file: File): Observable<UploadEvent> {
    return this.uploadImage(`${this.url}/${id}/questions/${index}/image`, file);
  }

  /** Sube una imagen y traduce los eventos de HttpClient a { progress, url } */
  private uploadImage(endpoint: string, file: File): Observable<UploadEvent> {
    const body = new FormData();
    body.append('image', file);

    return this.http
      .post<{ imageUrl: string }>(endpoint, body, {
        reportProgress: true,
        observe: 'events',
        context: silent(),
      })
      .pipe(
        map((event): UploadEvent | null => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
            return { progress };
          }
          if (event.type === HttpEventType.Response) {
            return { progress: 100, url: event.body?.imageUrl };
          }
          return null; 
        }),
        filter((event): event is UploadEvent => event !== null),
      );
  }


  removeCover(id: string): Observable<Quiz> {
    return this.http.put<Quiz>(`${this.url}/${id}`, { coverImageUrl: '' });
  }

  /**
   * PUT /quizzes/:id — quita la imagen de la pregunta `index` (solo el dueño; la API valida).
   * La API no tiene un DELETE para la imagen de una pregunta: se reenvían las preguntas igual,
   * pero esa sin `imageUrl`.
   */
  removeQuestionImage(quiz: Quiz, index: number): Observable<Quiz> {
    const questions = quiz.questions.map((q, i) => ({
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      timeLimitSeconds: q.timeLimitSeconds,
      ...(i !== index && q.imageUrl ? { imageUrl: q.imageUrl } : {}),
    }));
    return this.http.put<Quiz>(`${this.url}/${quiz._id}`, { questions });
  }

  generateQuestions(topic: string, numQuestions: number): Observable<Question[]> {
    return this.http
      .post<{ questions: Question[] }>(`${this.url}/generate-questions`, { topic, numQuestions })
      .pipe(map(res => res.questions));
  }

  generate(topic: string, numQuestions: number): Observable<Quiz> {
    return this.http.post<Quiz>(`${this.url}/generate`, { topic, numQuestions });
  }
}

function toParams(query: QuizQuery): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
  }
  return params;
}