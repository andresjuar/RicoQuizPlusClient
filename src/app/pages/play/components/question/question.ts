import { Component, computed, inject, input, output } from '@angular/core';
import { IsHost } from '../../../../shared/directives/is-host';
import { IsPlayer } from '../../../../shared/directives/is-player';
import { AnswerCount, PublicQuestion } from '../../../../shared/models/game.model';
import { RoomSession } from '../../../../shared/services/room-session.service';
import { AnswerOption, AnswerState } from '../answer-option/answer-option';
import { CountdownTimer } from '../countdown-timer/countdown-timer';

@Component({
  imports: [AnswerOption, CountdownTimer, IsHost, IsPlayer],
  selector: 'app-question',
  styleUrl: './question.scss',
  templateUrl: './question.html',
})
export class Question {
  /** Rol en la sala (lo asigna el servidor); el template usa *appIsHost / *appIsPlayer */
  private readonly session = inject(RoomSession);

  readonly question = input.required<PublicQuestion>();
  readonly secondsLeft = input.required<number>();
  /** Índice elegido por el jugador, o null si aún no responde */
  readonly myAnswer = input.required<number | null>();
  /** Solo lo recibe el host (evento game:answer_count) */
  readonly answerCount = input<AnswerCount | null>(null);
  /** Sin conexión en tiempo real: las acciones se desactivan (GameShell muestra el aviso) */
  readonly offline = input(false);

  readonly answer = output<number>();
  /** El host fuerza el reveal antes de que se acabe el tiempo (game:reveal_answer) */
  readonly reveal = output<void>();

  private readonly isHost = this.session.isHost;
  // El host no juega: nunca tiene respuesta propia
  protected readonly answered = computed(() => !this.isHost() && this.myAnswer() !== null);
  protected readonly locked = computed(() => this.isHost() || this.answered() || this.secondsLeft() <= 0 || this.offline());

  // questionIndex viene en base 0: la pregunta 3 es el índice 2
  protected readonly progress = computed(
    () => ((this.question().questionIndex + 1) / this.question().totalQuestions) * 100,
  );

  protected readonly answeredPct = computed(() => {
    const c = this.answerCount();
    return c && c.totalPlayers > 0 ? Math.round((c.answeredCount / c.totalPlayers) * 100) : 0;
  });

  protected stateOf(i: number): AnswerState {
    if (!this.answered()) return 'idle';
    return i === this.myAnswer() ? 'selected' : 'dimmed';
  }

  protected pick(i: number): void {
    if (this.locked()) return;
    this.answer.emit(i);
  }
}
