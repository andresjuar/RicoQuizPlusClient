import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Match, RoomStatus } from '../models/match.model';

@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly http = inject(HttpClient);
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
}
