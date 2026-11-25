import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { silent } from '../interceptors/http-context';
import { Page } from '../models/api.model';
import { Match, RoomStatus } from '../models/match.model';
import { AuthService } from './auth.service';

/** Cuántas partidas recientes del host se revisan para encontrar la sala activa */
const RECENT_MATCHES = 20;

@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly url = `${environment.apiUrl}/matches`;

  /** GET /matches/rooms/:code/exists — true si la sala está esperando o en juego */
  roomExists(code: string): Observable<boolean> {
    return this.http.get<RoomStatus>(`${this.url}/rooms/${code}/exists`).pipe(map(status => status.exists));
  }

  /** POST /matches — crea la sala (el usuario logueado queda como host) y regresa su roomCode */
  create(quizId?: string): Observable<Match> {
    return this.http.post<Match>(this.url, quizId ? { quiz: quizId } : {});
  }

  /** PATCH /matches/:id/quiz — cambia el quiz mientras la partida está en 'waiting' (solo el host) */
  selectQuiz(matchId: string, quizId: string): Observable<Match> {
    return this.http.patch<Match>(`${this.url}/${matchId}/quiz`, { quizId });
  }

  /** POST /matches/:id/generate-quiz — genera un quiz con IA sobre `topic` y lo asigna a la partida (solo el host) */
  generateQuiz(matchId: string, topic: string, numQuestions: number): Observable<Match> {
    return this.http.post<Match>(`${this.url}/${matchId}/generate-quiz`, { topic, numQuestions });
  }

  /**
   * Partida activa ('waiting' o 'in_progress') con ese código entre las partidas recientes del usuario.
   * La API no tiene "partida por código"; GET /matches/user/:id ya trae matchId y quiz, y vienen
   * ordenadas de la más nueva a la más vieja. Silenciosa: si falla, quien llama decide qué mostrar.
   */
  findActiveByCode(roomCode: string): Observable<Match | null> {
    const userId = this.auth.user()?._id;
    if (!userId) return of(null);

    return this.http
      .get<Page<Match>>(`${this.url}/user/${userId}`, { params: { limit: RECENT_MATCHES }, context: silent() })
      .pipe(
        map(
          page =>
            page.data.find(
              m => m.roomCode === roomCode && m.host === userId && (m.status === 'waiting' || m.status === 'in_progress'),
            ) ?? null,
        ),
      );
  }
}
