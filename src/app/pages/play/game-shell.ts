import { Component, inject, input } from '@angular/core';
import { MOCK_PLAYERS } from '../../shared/mocks/mock-data';
import { ToastService } from '../../shared/services/toast.service';
import { Lobby } from './components/lobby/lobby';

// TEMPORAL (Issue 15): solo monta el lobby para verlo. El Issue 37 lo reemplaza por el @switch de fases.
@Component({
  imports: [Lobby],
  selector: 'app-game-shell',
  styleUrl: './game-shell.scss',
  templateUrl: './game-shell.html',
})
export class GameShell {
  private readonly toast = inject(ToastService);

  readonly code = input.required<string>();
  protected readonly players = MOCK_PLAYERS;
  protected readonly hostSocketId = 's0';

  protected onStart(): void {
    this.toast.info('Aquí avanzará a "loading" (Issue 37)');
  }
}