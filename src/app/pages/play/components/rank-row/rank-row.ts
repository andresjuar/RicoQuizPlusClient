import { Component, computed, input } from '@angular/core';
import { LeaderboardEntry } from '../../../../shared/models/game.model';
import { Avatar } from '../../../../shared/components/avatar/avatar';

@Component({
  imports: [Avatar],
  selector: 'app-rank-row',
  styleUrl: './rank-row.scss',
  templateUrl: './rank-row.html',
})
export class RankRow {
  readonly entry = input.required<LeaderboardEntry>();
  /** Resalta la fila del jugador actual */
  readonly highlight = input(false);
  /** Muestra los puntos ganados en la última pregunta (+900) */
  readonly showDelta = input(false);

  protected readonly score = computed(() => this.entry().score.toLocaleString('es-MX'));
  protected readonly delta = computed(() => (this.entry().lastAnswerCorrect ? this.entry().lastPoints : 0));
}