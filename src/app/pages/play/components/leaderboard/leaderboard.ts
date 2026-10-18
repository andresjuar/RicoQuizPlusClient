import { Component, input } from '@angular/core';
import { LeaderboardEntry } from '../../../../shared/models/game.model';
import { RankRow } from '../rank-row/rank-row';

@Component({
  imports: [RankRow],
  selector: 'app-leaderboard',
  styleUrl: './leaderboard.scss',
  templateUrl: './leaderboard.html',
})
export class Leaderboard {
  /** Ya vienen ordenadas por rank desde el backend */
  readonly entries = input.required<LeaderboardEntry[]>();
  /** socketId del jugador actual, para resaltar su fila */
  readonly mySocketId = input<string | null>(null);
}