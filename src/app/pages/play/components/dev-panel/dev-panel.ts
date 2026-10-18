import { Component, input, output, signal } from '@angular/core';
import { GamePhase, PlayerRole } from '../../../../shared/models/game.model';

/** Orden normal de una partida; 'error' se elige a mano */
const FLOW: GamePhase[] = [
  'connecting', 'guest-gate', 'lobby', 'loading', 'question', 'reveal', 'leaderboard', 'finished',
];

/**
 * Panel flotante SOLO para desarrollo: cambia fase, rol y respuesta a mano.
 * Se quita al integrar Socket.io (borrar el componente y su uso en game-shell.html).
 */
@Component({
  selector: 'app-dev-panel',
  styleUrl: './dev-panel.scss',
  templateUrl: './dev-panel.html',
})
export class DevPanel {
  readonly phase = input.required<GamePhase>();
  readonly role = input.required<PlayerRole>();
  readonly myAnswer = input.required<number | null>();

  readonly phaseChange = output<GamePhase>();
  readonly roleChange = output<PlayerRole>();
  readonly answerChange = output<number | null>();

  protected readonly open = signal(true);
  protected readonly phases: GamePhase[] = [...FLOW, 'error'];
  protected readonly options = [0, 1, 2, 3];

  protected onPhase(event: Event): void {
    this.phaseChange.emit((event.target as HTMLSelectElement).value as GamePhase);
  }

  protected onRole(event: Event): void {
    this.roleChange.emit((event.target as HTMLSelectElement).value as PlayerRole);
  }

  protected onAnswer(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.answerChange.emit(value === '' ? null : Number(value));
  }

  protected next(): void {
    const i = FLOW.indexOf(this.phase());
    this.phaseChange.emit(i === -1 ? FLOW[0] : FLOW[Math.min(i + 1, FLOW.length - 1)]);
  }
}