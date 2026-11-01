import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../models/api.model';
import { Match, MatchHistoryItem } from '../models/match.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  /** GET /matches/user/:userId → filas del historial (score y lugar del usuario en cada partida) */
  getMine(limit = 50): Observable<MatchHistoryItem[]> {
    const userId = this.auth.user()?._id;
    if (!userId) return of([]);

    return this.http
      .get<Page<Match>>(`${environment.apiUrl}/matches/user/${userId}`, { params: { limit } })
      .pipe(map(page => page.data.map(m => toHistoryItem(m, userId)).filter(item => item !== null)));
  }
}

/** La API regresa la partida completa; la vista necesita solo mi resultado. null = el usuario fue host y no jugó */
function toHistoryItem(match: Match, userId: string): MatchHistoryItem | null {
  const ranking = [...match.players].sort((a, b) => b.score - a.score);
  const index = ranking.findIndex(p => p.user === userId);
  if (index === -1) return null;

  return {
    matchId: match._id,
    quizTitle: typeof match.quiz === 'object' ? match.quiz.title : 'Quiz eliminado',
    playedAt: match.finishedAt ?? match.startedAt ?? match.createdAt,
    score: ranking[index].score,
    rank: index + 1,
    totalPlayers: ranking.length,
  };
}