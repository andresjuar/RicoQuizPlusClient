import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { MatchHistoryItem } from '../models/match.model';
import { MOCK_HISTORY } from '../mocks/mock-data';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  getMine(): Observable<MatchHistoryItem[]> {
    return of(MOCK_HISTORY).pipe(delay(400));
  }
}