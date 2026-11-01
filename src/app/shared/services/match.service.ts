import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RoomStatus } from '../models/match.model';

@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly http = inject(HttpClient);

  /** GET /matches/rooms/:code/exists — true si la sala está esperando o en juego */
  roomExists(code: string): Observable<boolean> {
    return this.http
      .get<RoomStatus>(`${environment.apiUrl}/matches/rooms/${code}/exists`)
      .pipe(map(status => status.exists));
  }
}