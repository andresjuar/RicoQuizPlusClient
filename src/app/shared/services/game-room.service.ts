import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AnswerCount,
  AnswerRevealed,
  GameOver,
  GamePhase,
  HostQuestion,
  LeaderboardEntry,
  PublicPlayer,
  PublicQuestion,
} from '../models/game.model';
import { ROOM_CODE_LENGTH, ROOM_CODE_PATTERN, normalizeRoomCode } from '../models/match.model';
import { QuizSummary } from '../models/quiz.model';
import {
  ClientEvent,
  ClientPayload,
  RoomJoinPayload,
  RoomJoinedOkPayload,
  RoomSyncData,
  SocketErrorPayload,
} from '../models/socket-events.model';
import { AuthService } from './auth.service';
import { MatchService } from './match.service';
import { RoomSession } from './room-session.service';
import { SocketService } from './socket.service';
import { ToastService } from './toast.service';

/** Errores que significan "esta sala ya no sirve": se muestra la pantalla de error y no se reintenta */
const FATAL_CODES: SocketErrorPayload['code'][] = ['ROOM_NOT_FOUND', 'ROOM_FINISHED', 'ROOM_CANCELLED'];

/** Valor de myAnswer cuando el servidor dice que ya respondiste pero no sabemos qué (reconexión) */
const UNKNOWN_ANSWER = -1;

/**
 * Estado en vivo de UNA partida (store/fachada sobre SocketService).
 *
 * Se provee en GameShell (`providers: [GameRoom, RoomSession]`), así que existe solo mientras
 * estás en /play/:code: al salir, DestroyRef quita todos los listeners (takeUntilDestroyed) y
 * no se duplican eventos al volver a entrar. La conexión NO es suya: es la de SocketService.
 *
 * Los componentes solo leen signals y llaman métodos; nunca tocan el socket.
 */
@Injectable()
export class GameRoom {
  private readonly socket = inject(SocketService);
  private readonly session = inject(RoomSession);
  private readonly auth = inject(AuthService);
  private readonly matches = inject(MatchService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _phase = signal<GamePhase>('connecting');
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _players = signal<PublicPlayer[]>([]);
  private readonly _question = signal<PublicQuestion | HostQuestion | null>(null);
  private readonly _secondsLeft = signal(0);
  private readonly _myAnswer = signal<number | null>(null);
  private readonly _answerCount = signal<AnswerCount | null>(null);
  private readonly _revealed = signal<AnswerRevealed | null>(null);
  private readonly _leaderboard = signal<LeaderboardEntry[]>([]);
  private readonly _isFinalRound = signal(false);
  private readonly _gameOver = signal<GameOver | null>(null);
  private readonly _mySocketId = signal<string | null>(null);
  private readonly _matchId = signal<string | null>(null);
  private readonly _quiz = signal<QuizSummary | null>(null);

  readonly phase = this._phase.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly players = this._players.asReadonly();
  readonly question = this._question.asReadonly();
  readonly secondsLeft = this._secondsLeft.asReadonly();
  readonly myAnswer = this._myAnswer.asReadonly();
  readonly answerCount = this._answerCount.asReadonly();
  readonly revealed = this._revealed.asReadonly();
  readonly leaderboard = this._leaderboard.asReadonly();
  readonly isFinalRound = this._isFinalRound.asReadonly();
  readonly gameOver = this._gameOver.asReadonly();
  readonly mySocketId = this._mySocketId.asReadonly();
  readonly quiz = this._quiz.asReadonly();
  readonly connectionStatus = this.socket.status;
  readonly isConnected = this.socket.isConnected;

  /** Último room:join enviado; se reenvía en cada reconexión para resincronizar la vista */
  private joinPayload: RoomJoinPayload | null = null;
  private roomCode = '';
  private joined = false;

  readonly isHost = computed(() => this.session.role() === 'host');

  constructor() {
    this.listen();
    this.destroyRef.onDestroy(() => this.teardown());
  }

  /**
   * Entra a la sala `code`. Con sesión se une directo; como invitado primero pide un nombre.
   * `matchId` y `quiz` llegan por el state de la navegación desde /room/new (solo el host los tiene).
   */
  async enter(code: string, opts: { matchId?: string; quiz?: QuizSummary } = {}): Promise<void> {
    this.roomCode = normalizeRoomCode(code);
    this._matchId.set(opts.matchId ?? null);
    this._quiz.set(opts.quiz ?? null);
    this._errorMessage.set(null);

    if (!ROOM_CODE_PATTERN.test(this.roomCode)) {
      this.fail(`«${code}» no es un código de sala válido: son ${ROOM_CODE_LENGTH} letras.`);
      return;
    }

    this._phase.set('connecting');

    // Al recargar, /auth/me puede seguir en curso (Render dormido): sin esperar, el host
    // se trataría como invitado y el servidor no lo reconocería como dueño de la sala
    await this.auth.whenReady();
    this.socket.ensureConnected();

    if (this.auth.isAuthenticated()) {
      this.join();
    } else {
      this._phase.set('guest-gate');
    }
  }

  /** room:join. Si todavía no hay conexión, se envía en cuanto conecte (ver connected$) */
  join(guestName?: string): void {
    this.joinPayload = { roomCode: this.roomCode, ...(guestName ? { guestName } : {}) };
    this._phase.set('connecting');
    this.socket.ensureConnected();
    if (this.socket.isConnected()) this.socket.emit('room:join', this.joinPayload);
  }

  /** Reintentar desde la pantalla de error */
  retry(): void {
    void this.enter(this.roomCode, { matchId: this._matchId() ?? undefined, quiz: this._quiz() ?? undefined });
  }

  // Acciones del host

  /** Si la sala no tiene quiz o no hay jugadores, el servidor responde con `error` y se muestra en un toast */
  start(): void {
    this.send('game:start');
  }

  nextQuestion(): void {
    this.send('game:next_question');
  }

  revealNow(): void {
    this.send('game:reveal_answer');
  }

  playAgain(): void {
    this.send('game:play_again');
  }

  /** PATCH /matches/:id/quiz — solo el host y mientras la partida esté en espera */
  changeQuiz(quiz: QuizSummary, opts: { silent?: boolean } = {}): void {
    const matchId = this._matchId();
    if (!matchId) {
      this.toast.error('No se encontró la partida para cambiar el quiz.');
      return;
    }
    this.matches
      .selectQuiz(matchId, quiz._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this._quiz.set(quiz);
        if (!opts.silent) this.toast.success(`Ahora la sala usa «${quiz.title}»`, 'Quiz cambiado');
      });
  }

  // Acciones del jugador

  answer(index: number): void {
    const q = this._question();
    if (!q || this._myAnswer() !== null) return;
    if (this.send('game:submit_answer', { questionIndex: q.questionIndex, answerIndex: index })) {
      this._myAnswer.set(index);
    }
  }

  /** Salida explícita (también se llama al destruir la vista) */
  leave(): void {
    if (this.joined) this.socket.emit('room:leave');
    this.joined = false;
    this.joinPayload = null;
  }

  /** Emite y, si no hay conexión, avisa en vez de fallar en silencio */
  private send<E extends ClientEvent>(event: E, ...args: ClientPayload<E>): boolean {
    const sent = this.socket.emit(event, ...args);
    if (!sent) this.toast.warning('Sin conexión con el servidor. Espera a que se reconecte e inténtalo de nuevo.');
    return sent;
  }

  private listen(): void {
    const on = <E extends Parameters<SocketService['on']>[0]>(event: E) =>
      this.socket.on(event).pipe(takeUntilDestroyed(this.destroyRef));

    // Conexión / reconexión: se vuelve a unir y el servidor manda `sync` con el estado actual
    this.socket.connected$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.joinPayload) this.socket.emit('room:join', this.joinPayload);
    });

    this.socket.connectError$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(message => {
      if (this._phase() === 'connecting') this.fail(`No se pudo conectar con el servidor: ${message}`);
    });

    on('room:joined_ok').subscribe(p => this.onJoined(p));

    // Lista en vivo del lobby: el servidor manda la lista completa, así que solo se reemplaza
    on('room:player_joined').subscribe(p => {
      this._players.set(p.players);
      if (this.isHost() && this._phase() === 'lobby') {
        this.toast.info(`${p.joined.displayName} ${p.reconnected ? 'volvió a' : 'entró a'} la sala`);
      }
    });
    on('room:player_disconnected').subscribe(p => this._players.set(p.players));
    on('room:player_left').subscribe(p => {
      this._players.set(p.players);
      this.toast.info(`${p.left.displayName} salió de la sala`);
    });

    on('game:loading').subscribe(() => this._phase.set('loading'));

    // El engine espera a que el host pida la primera pregunta
    on('game:ready').subscribe(() => {
      if (this.isHost()) this.socket.emit('game:next_question');
    });

    on('game:question').subscribe(q => {
      this._question.set(q);
      this._secondsLeft.set(q.timeLimitSeconds);
      this._myAnswer.set(null);
      this._answerCount.set(null);
      this._revealed.set(null);
      this._phase.set('question');
    });

    on('game:timer_tick').subscribe(t => {
      if (t.questionIndex === this._question()?.questionIndex) this._secondsLeft.set(t.secondsLeft);
    });

    on('game:answer_count').subscribe(c => this._answerCount.set(c));

    on('game:answer_revealed').subscribe(r => {
      this._revealed.set(r);
      this._phase.set('reveal');
    });

    on('game:leaderboard').subscribe(l => {
      this._leaderboard.set(l.leaderboard);
      this._isFinalRound.set(l.isFinalRound);
      this._phase.set('leaderboard');
    });

    on('game:over').subscribe(result => {
      this._gameOver.set(result);
      this._leaderboard.set(result.leaderboard);
      this._phase.set('finished');
    });

    on('game:play_again_ok').subscribe(p => {
      this._matchId.set(p.matchId);
      this._players.set(p.players);
      this.resetRound();
      this._phase.set('lobby');
      // El Match nuevo nace sin quiz: el host le vuelve a asignar el que ya tenía
      const quiz = this._quiz();
      if (this.isHost() && quiz) this.changeQuiz(quiz, { silent: true });
    });

    on('error').subscribe(err => this.onServerError(err));
  }

  private onJoined(p: RoomJoinedOkPayload): void {
    this.joined = true;
    this.session.setRole(p.role);
    this._mySocketId.set(this.socket.id);
    this._players.set(p.players);
    this.applySync(p.sync);

    if (p.isReconnect) this.toast.info('Te reconectaste a la partida');
    else if (p.isLateJoin) this.toast.info('La partida ya había empezado: entras desde la siguiente pregunta');
  }

  /** Reconstruye la vista con el estado que manda el servidor (join, late join o reconexión) */
  private applySync(sync: RoomSyncData): void {
    switch (sync.state) {
      case 'lobby':
      case 'loading':
        this._phase.set(sync.state);
        break;
      case 'question': {
        const sameQuestion = this._question()?.questionIndex === sync.question.questionIndex;
        this._question.set(sync.question);
        this._secondsLeft.set(sync.secondsLeft);
        if (!sync.alreadyAnswered) this._myAnswer.set(null);
        else if (!sameQuestion || this._myAnswer() === null) this._myAnswer.set(UNKNOWN_ANSWER);
        this._phase.set('question');
        break;
      }
      case 'reveal':
        this._revealed.set(sync.revealed);
        // Sin la pregunta (late join justo en el reveal) no hay qué mostrar: se espera al leaderboard
        this._phase.set(this._question() ? 'reveal' : 'loading');
        break;
      case 'leaderboard':
        this._leaderboard.set(sync.leaderboard);
        this._phase.set('leaderboard');
        break;
      case 'finished':
        this._gameOver.set(sync.result);
        this._leaderboard.set(sync.result.leaderboard);
        this._phase.set('finished');
        break;
    }
  }

  private onServerError(err: SocketErrorPayload): void {
    if (FATAL_CODES.includes(err.code)) {
      this.joined = false;
      this.joinPayload = null;
      this.fail(err.message);
      return;
    }
    if (err.code === 'ALREADY_ANSWERED') return;

    // Falló el room:join (p. ej. nombre de invitado inválido): vuelve a pedir el nombre
    if (this._phase() === 'connecting' && !this.auth.isAuthenticated()) {
      this._phase.set('guest-gate');
    }
    this.toast.error(err.message);
  }

  private fail(message: string): void {
    this._errorMessage.set(message);
    this._phase.set('error');
  }

  private resetRound(): void {
    this._question.set(null);
    this._myAnswer.set(null);
    this._answerCount.set(null);
    this._revealed.set(null);
    this._leaderboard.set([]);
    this._isFinalRound.set(false);
    this._gameOver.set(null);
  }

  private teardown(): void {
    this.leave();
    this.session.clear();
    // Los invitados no tienen sesión que mantenga la conexión abierta
    if (!this.auth.isAuthenticated()) this.socket.disconnect();
  }
}
