import { Component, computed, input, output } from '@angular/core';
import { AnswerCount, PlayerRole, PublicQuestion } from '../../../../shared/models/game.model';
import { AnswerOption, AnswerState } from '../answer-option/answer-option';
import { CountdownTimer } from '../countdown-timer/countdown-timer';

@Component({
  imports: [AnswerOption, CountdownTimer],
  selector: 'app-question',
  styleUrl: './question.scss',
  templateUrl: './question.html',
})
export class Question {
  readonly question = input.required<PublicQuestion>();
  readonly secondsLeft = input.required<number>();
  /** Índice elegido por el jugador, o null si aún no responde */
  readonly myAnswer = input.required<number | null>();
  readonly role = input<PlayerRole>('player');
  /** Solo lo recibe el host (evento game:answer_count) */
  readonly answerCount = input<AnswerCount | null>(null);

  readonly answer = output<number>();
  /** El host fuerza el reveal antes de que se acabe el tiempo (game:reveal_answer) */
  readonly reveal = output<void>();

  protected readonly isHost = computed(() => this.role() === 'host');
  // El host no juega: nunca tiene respuesta propia
  protected readonly answered = computed(() => !this.isHost() && this.myAnswer() !== null);
  protected readonly locked = computed(() => this.isHost() || this.answered() || this.secondsLeft() <= 0);

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