import { Component, input, output } from '@angular/core';
import { LeaderboardEntry, PlayerRole } from '../../../../shared/models/game.model';
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
  readonly role = input<PlayerRole>('player');
  /** Viene como `isFinalRound` en game:leaderboard: cambia el texto del botón */
  readonly isLast = input(false);

  /** Solo el host avanza (game:next_question) */
  readonly next = output<void>();
}