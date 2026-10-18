import { Component, inject, input, signal } from '@angular/core';
import { MOCK_PLAYERS } from '../../shared/mocks/mock-data';
import { PlayerRole } from '../../shared/models/game.model';
import { ToastService } from '../../shared/services/toast.service';
import { GuestGate } from './components/guest-gate/guest-gate';
import { Lobby } from './components/lobby/lobby';

// TEMPORAL (Issues 15-16): monta guest-gate y lobby para verlos. El Issue 37 lo reemplaza por el @switch completo.
@Component({
  imports: [GuestGate, Lobby],
  selector: 'app-game-shell',
  styleUrl: './game-shell.scss',
  templateUrl: './game-shell.html',
})
export class GameShell {
  private readonly toast = inject(ToastService);

  readonly code = input.required<string>();

  protected readonly phase = signal<'guest-gate' | 'lobby'>('guest-gate');
  protected readonly role: PlayerRole = 'host'; 
  protected readonly players = MOCK_PLAYERS;
  protected readonly hostSocketId = 's0';

  protected onJoined(name: string): void {
    this.toast.success(`Entraste como ${name}`);
    this.phase.set('lobby');
  }

  protected onStart(): void {
    this.toast.info('Aquí avanzará a "loading" (Issue 37)');
  }
}