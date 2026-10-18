import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { GameLeaveState } from '../../shared/guards/leave-game.guard';
import { MOCK_LEADERBOARD, MOCK_PLAYERS, MOCK_QUESTION } from '../../shared/mocks/mock-data';
import { AnswerCount, AnswerRevealed, GamePhase, PlayerRole } from '../../shared/models/game.model';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { DevPanel } from './components/dev-panel/dev-panel';
import { FinalResults } from './components/final-results/final-results';
import { GuestGate } from './components/guest-gate/guest-gate';
import { Leaderboard } from './components/leaderboard/leaderboard';
import { Loading } from './components/loading/loading';
import { Lobby } from './components/lobby/lobby';
import { Question } from './components/question/question';
import { Reveal } from './components/reveal/reveal';
import { RoomStatus } from './components/room-status/room-status';

type StatusTone = 'ok' | 'warn' | 'error' | 'final';

// Fases sin partida en curso: ahí se puede salir sin confirmar
const PHASES_WITHOUT_CONFIRM: GamePhase[] = ['connecting', 'error', 'guest-gate', 'finished'];

/**
 * Layout de pantalla completa de la partida (sin navbar).
 * Una sola ruta (/play/:code); la fase decide qué vista se muestra.
 * TODO integración: `phase` y los datos mock pasan a derivarse de los eventos de Socket.io.
 */
@Component({
  imports: [
    DevPanel, FinalResults, GuestGate, Leaderboard, Loading, Lobby, Question, Reveal, RoomStatus,
  ],
  selector: 'app-game-shell',
  styleUrl: './game-shell.scss',
  templateUrl: './game-shell.html',
})
export class GameShell implements GameLeaveState {
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Llega de la ruta /play/:code (withComponentInputBinding) */
  readonly code = input.required<string>();

  protected readonly isDev = !environment.production;

  protected readonly phase = signal<GamePhase>('connecting');
  // Mock: con sesión se asume que quien entra es el host; el selector dev permite cambiarlo
  protected readonly role = signal<PlayerRole>(this.auth.isAuthenticated() ? 'host' : 'player');

  // Datos mock
  protected readonly players = MOCK_PLAYERS;
  protected readonly hostSocketId = 's0';
  protected readonly question = MOCK_QUESTION;
  protected readonly revealed: AnswerRevealed = {
    questionIndex: MOCK_QUESTION.questionIndex,
    correctIndex: MOCK_QUESTION.correctIndex,
    correctText: MOCK_QUESTION.options[MOCK_QUESTION.correctIndex],
  };
  // Solo lo recibe el host (game:answer_count); mock fijo como en el wireframe
  protected readonly answerCount: AnswerCount = { answeredCount: 7, totalPlayers: 8 };
  protected readonly leaderboard = MOCK_LEADERBOARD;
  protected readonly mySocketId = 's2';
  protected readonly secondsLeft = signal(MOCK_QUESTION.timeLimitSeconds);
  protected readonly myAnswer = signal<number | null>(null);
  // Equivale a `isFinalRound` de game:leaderboard; se cambia desde el panel dev
  protected readonly isLast = signal(false);

  protected readonly status = computed<{ label: string; tone: StatusTone }>(() => {
    switch (this.phase()) {
      case 'connecting': return { label: 'Conectando', tone: 'warn' };
      case 'error': return { label: 'Sin conexión', tone: 'error' };
      case 'guest-gate': return { label: 'Unirse', tone: 'warn' };
      case 'lobby': return { label: this.role() === 'host' ? 'Sala abierta · Host' : 'Sala abierta', tone: 'ok' };
      case 'finished': return { label: 'Final', tone: 'final' };
      default: return { label: 'En juego', tone: 'ok' };
    }
  });

  private connectTimeout?: ReturnType<typeof setTimeout>;
  private loadingTimeout?: ReturnType<typeof setTimeout>;
  private revealTimeout?: ReturnType<typeof setTimeout>;
  private leaderboardTimeout?: ReturnType<typeof setTimeout>;
  private countdown?: ReturnType<typeof setInterval>;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearTimers());
    this.connect();
  }

  /** Lo consulta leaveGameGuard (Issue 39): confirma la salida solo si hay partida en curso */
  shouldConfirmLeave(): boolean {
    return !PHASES_WITHOUT_CONFIRM.includes(this.phase());
  }

  /** Cambia de fase cancelando cualquier avance automático pendiente (lo usa también el panel dev) */
  protected goTo(phase: GamePhase): void {
    this.clearTimers();
    if (phase === 'question') this.beginQuestion();
    this.phase.set(phase);
  }

  protected retry(): void {
    this.connect();
  }

  protected onJoined(name: string): void {
    this.toast.success(`Entraste como ${name}`);
    this.goTo('lobby');
  }

  protected onStart(): void {
    this.goTo('loading');
    this.loadingTimeout = setTimeout(() => this.goTo('question'), 1500);
  }

  // Al responder pasa a reveal tras un momento; si no respondes, pasa cuando se acaba el tiempo
  protected onAnswer(index: number): void {
    this.myAnswer.set(index);
    this.revealTimeout = setTimeout(() => this.toReveal(), 1200);
  }

  // Host: fuerza el reveal sin esperar al timer (game:reveal_answer)
  protected onRevealNow(): void {
    this.toReveal();
  }

  // Host: del leaderboard a la siguiente pregunta o a los resultados (game:next_question)
  protected onNextQuestion(): void {
    this.goTo(this.isLast() ? 'finished' : 'question');
  }

  protected onPlayAgain(): void {
    this.goTo('lobby');
  }

  // Con sesión va al historial; como invitado, al inicio
  protected onLeave(): void {
    this.router.navigateByUrl(this.auth.isAuthenticated() ? '/history' : '/');
  }

  // Simula la conexión al socket: con sesión entra directo al lobby; sin sesión pide un nombre
  private connect(): void {
    this.goTo('connecting');
    this.connectTimeout = setTimeout(
      () => this.goTo(this.auth.isAuthenticated() ? 'lobby' : 'guest-gate'),
      1200,
    );
  }

  private beginQuestion(): void {
    this.myAnswer.set(null);
    this.secondsLeft.set(this.question.timeLimitSeconds);
    this.countdown = setInterval(() => {
      this.secondsLeft.update(s => Math.max(0, s - 1));
      if (this.secondsLeft() === 0) this.toReveal();
    }, 1000);
  }

  // Como el backend: el reveal pasa solo al leaderboard a los 2 s
  private toReveal(): void {
    this.goTo('reveal');
    this.leaderboardTimeout = setTimeout(() => this.goTo('leaderboard'), 2000);
  }

  private clearTimers(): void {
    clearTimeout(this.connectTimeout);
    clearTimeout(this.loadingTimeout);
    clearTimeout(this.revealTimeout);
    clearTimeout(this.leaderboardTimeout);
    clearInterval(this.countdown);
  }
}