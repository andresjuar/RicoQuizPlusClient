import { Injectable } from '@angular/core';
import { Observable, map, timer } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MatchService {
  // TODO integración: GET /matches/rooms/:code/exists
  // Mock: 'ZZZZ' simula una sala inexistente
  roomExists(code: string): Observable<boolean> {
    return timer(500).pipe(map(() => code !== 'ZZZZ'));
  }
}