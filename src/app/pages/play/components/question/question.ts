import { Component, computed, input, output } from '@angular/core';
import { PublicQuestion } from '../../../../shared/models/game.model';
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

  readonly answer = output<number>();

  protected readonly answered = computed(() => this.myAnswer() !== null);
  protected readonly locked = computed(() => this.answered() || this.secondsLeft() <= 0);

  // questionIndex viene en base 0: la pregunta 3 es el índice 2
  protected readonly progress = computed(
    () => ((this.question().questionIndex + 1) / this.question().totalQuestions) * 100,
  );

  protected stateOf(i: number): AnswerState {
    if (!this.answered()) return 'idle';
    return i === this.myAnswer() ? 'selected' : 'dimmed';
  }

  protected pick(i: number): void {
    if (this.locked()) return;
    this.answer.emit(i);
  }
}