import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { MOCK_LEADERBOARD, MOCK_PLAYERS, MOCK_QUESTION } from '../../shared/mocks/mock-data';import { AnswerRevealed, PlayerRole } from '../../shared/models/game.model';
import { ToastService } from '../../shared/services/toast.service';
import { GuestGate } from './components/guest-gate/guest-gate';
import { Lobby } from './components/lobby/lobby';
import { Loading } from './components/loading/loading';
import { Question } from './components/question/question';
import { Reveal } from './components/reveal/reveal';
import { Leaderboard } from './components/leaderboard/leaderboard';


@Component({
  imports: [GuestGate, Lobby, Loading, Question, Reveal, Leaderboard],
  selector: 'app-game-shell',
  styleUrl: './game-shell.scss',
  templateUrl: './game-shell.html',
})
export class GameShell {
  private readonly toast = inject(ToastService);

  readonly code = input.required<string>();

  protected readonly phase = signal<'guest-gate' | 'lobby' | 'loading' | 'question' | 'reveal' | 'leaderboard'>('guest-gate');  protected readonly role: PlayerRole = 'host';
  protected readonly players = MOCK_PLAYERS;
  protected readonly hostSocketId = 's0';

  protected readonly question = MOCK_QUESTION;
  protected readonly revealed: AnswerRevealed = {
    questionIndex: MOCK_QUESTION.questionIndex,
    correctIndex: MOCK_QUESTION.correctIndex,
    correctText: MOCK_QUESTION.options[MOCK_QUESTION.correctIndex],
  };
  protected readonly leaderboard = MOCK_LEADERBOARD;
  protected readonly mySocketId = 's2';
  protected readonly secondsLeft = signal(MOCK_QUESTION.timeLimitSeconds);
  protected readonly myAnswer = signal<number | null>(null);

  private loadingTimeout?: ReturnType<typeof setTimeout>;
  private revealTimeout?: ReturnType<typeof setTimeout>;
  private countdown?: ReturnType<typeof setInterval>;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.loadingTimeout);
      clearTimeout(this.revealTimeout);
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
    this.revealTimeout = setTimeout(() => this.toReveal(), 1200);
  }

  protected onNext(): void {
    this.phase.set('leaderboard');
  }

  private startQuestion(): void {
    this.myAnswer.set(null);
    this.secondsLeft.set(this.question.timeLimitSeconds);
    this.phase.set('question');
    this.countdown = setInterval(() => {
      this.secondsLeft.update(s => Math.max(0, s - 1));
      if (this.secondsLeft() === 0) this.toReveal();
    }, 1000);
  }

  private toReveal(): void {
    clearInterval(this.countdown);
    clearTimeout(this.revealTimeout);
    this.phase.set('reveal');
  }
}