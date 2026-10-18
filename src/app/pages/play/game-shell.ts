import { Component, inject, input, signal } from '@angular/core';
import { MOCK_PLAYERS } from '../../shared/mocks/mock-data';
import { PlayerRole } from '../../shared/models/game.model';
import { ToastService } from '../../shared/services/toast.service';
import { GuestGate } from './components/guest-gate/guest-gate';
import { Lobby } from './components/lobby/lobby';
import { Loading } from './components/loading/loading';


@Component({
  imports: [GuestGate, Lobby, Loading],
  selector: 'app-game-shell',
  styleUrl: './game-shell.scss',
  templateUrl: './game-shell.html',
})
export class GameShell {
  private readonly toast = inject(ToastService);

  readonly code = input.required<string>();

  protected readonly phase = signal<'guest-gate' | 'lobby' | 'loading'>('guest-gate');  protected readonly role: PlayerRole = 'host'; 
  protected readonly players = MOCK_PLAYERS;
  protected readonly hostSocketId = 's0';

  protected onJoined(name: string): void {
    this.toast.success(`Entraste como ${name}`);
    this.phase.set('lobby');
  }

  protected onStart(): void {
    this.phase.set('loading');
  }
}