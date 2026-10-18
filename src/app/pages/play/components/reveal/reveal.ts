import { Component, computed, input } from '@angular/core';
import { AnswerRevealed, PublicQuestion } from '../../../../shared/models/game.model';
import { AnswerOption, AnswerState } from '../answer-option/answer-option';

type RevealResult = 'correct' | 'wrong' | 'none';

@Component({
  imports: [AnswerOption],
  selector: 'app-reveal',
  styleUrl: './reveal.scss',
  templateUrl: './reveal.html',
})
export class Reveal {
  readonly question = input.required<PublicQuestion>();
  readonly revealed = input.required<AnswerRevealed>();
  /** Índice que eligió el jugador, o null si no alcanzó a responder */
  readonly myAnswer = input.required<number | null>();

  protected readonly result = computed<RevealResult>(() => {
    const mine = this.myAnswer();
    if (mine === null) return 'none';
    return mine === this.revealed().correctIndex ? 'correct' : 'wrong';
  });

  protected readonly title = computed(
    () => ({ correct: '¡Correcto!', wrong: 'Respuesta incorrecta', none: 'Se acabó el tiempo' })[this.result()],
  );

  protected stateOf(i: number): AnswerState {
    if (i === this.revealed().correctIndex) return 'correct';
    if (i === this.myAnswer()) return 'wrong';
    return 'dimmed';
  }
}