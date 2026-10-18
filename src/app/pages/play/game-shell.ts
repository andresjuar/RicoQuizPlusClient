import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { MOCK_PLAYERS, MOCK_QUESTION } from '../../shared/mocks/mock-data';
import { PlayerRole } from '../../shared/models/game.model';
import { ToastService } from '../../shared/services/toast.service';
import { GuestGate } from './components/guest-gate/guest-gate';
import { Lobby } from './components/lobby/lobby';
import { Loading } from './components/loading/loading';
import { Question } from './components/question/question';

// TEMPORAL (Issues 15-18): monta las vistas para verlas. El Issue 37 lo reemplaza por el @switch completo.
@Component({
  imports: [GuestGate, Lobby, Loading, Question],
  selector: 'app-game-shell',
  styleUrl: './game-shell.scss',
  templateUrl: './game-shell.html',
})
export class GameShell {
  private readonly toast = inject(ToastService);

  readonly code = input.required<string>();

  protected readonly phase = signal<'guest-gate' | 'lobby' | 'loading' | 'question'>('guest-gate');
  protected readonly role: PlayerRole = 'host';
  protected readonly players = MOCK_PLAYERS;
  protected readonly hostSocketId = 's0';

  protected readonly question = MOCK_QUESTION;
  protected readonly secondsLeft = signal(MOCK_QUESTION.timeLimitSeconds);
  protected readonly myAnswer = signal<number | null>(null);

  private loadingTimeout?: ReturnType<typeof setTimeout>;
  private countdown?: ReturnType<typeof setInterval>;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.loadingTimeout);
      clearInterval(this.countdown);
    });
  }

  protected onJoined(name: string): void {
    this.toast.success(`Entraste como ${name}`);
    this.phase.set('lobby');
  }

  protected onStart(): void {
    this.phase.set('loading');
    this.loadingTimeout = setTimeout(() => this.startQuestion(), 1500);
  }

  protected onAnswer(index: number): void {
    this.myAnswer.set(index);
  }

  private startQuestion(): void {
    this.myAnswer.set(null);
    this.secondsLeft.set(this.question.timeLimitSeconds);
    this.phase.set('question');
    this.countdown = setInterval(() => {
      this.secondsLeft.update(s => Math.max(0, s - 1));
      if (this.secondsLeft() === 0) clearInterval(this.countdown);
    }, 1000);
  }
}