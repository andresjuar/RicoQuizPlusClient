import { Component, computed, input } from '@angular/core';
import { LeaderboardEntry } from '../../../../shared/models/game.model';
import { Avatar } from '../../../../shared/components/avatar/avatar';

@Component({
  imports: [Avatar],
  selector: 'app-podium',
  styleUrl: './podium.scss',
  templateUrl: './podium.html',
})
export class Podium {
  /** Los 3 primeros lugares, ya ordenados por rank */
  readonly entries = input.required<LeaderboardEntry[]>();

  // Orden visual: 2.º, 1.º, 3.º (el primero al centro). Tolera menos de 3 jugadores.
  protected readonly slots = computed(() => {
    const [first, second, third] = this.entries();
    return [second, first, third].filter((e): e is LeaderboardEntry => !!e);
  });

  protected fmt(score: number): string {
    return score.toLocaleString('es-MX');
  }
}