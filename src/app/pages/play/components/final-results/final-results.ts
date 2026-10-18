import { Component, computed, input, output } from '@angular/core';
import { LeaderboardEntry, PlayerRole } from '../../../../shared/models/game.model';import { Podium } from '../podium/podium';
import { RankRow } from '../rank-row/rank-row';

@Component({
  imports: [Podium, RankRow],
  selector: 'app-final-results',
  styleUrl: './final-results.scss',
  templateUrl: './final-results.html',
})
export class FinalResults {
  /** Clasificación final ya ordenada por rank */
  readonly entries = input.required<LeaderboardEntry[]>();
  /** socketId del jugador actual, para resaltar su fila */
  readonly mySocketId = input<string | null>(null);
  readonly role = input<PlayerRole>('player');

  readonly playAgain = output<void>();
  /** El shell decide a dónde ir: `/history` con sesión, `/` sin ella */
  readonly leave = output<void>();

  protected readonly top = computed(() => this.entries().slice(0, 3));
  protected readonly rest = computed(() => this.entries().slice(3));
}