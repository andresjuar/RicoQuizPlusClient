import { Component, computed, inject, input } from '@angular/core';
import { IsHost } from '../../../../shared/directives/is-host';
import { IsPlayer } from '../../../../shared/directives/is-player';
import { AnswerRevealed, PublicQuestion } from '../../../../shared/models/game.model';
import { RoomSession } from '../../../../shared/services/room-session.service';
import { AnswerOption, AnswerState } from '../answer-option/answer-option';

type RevealResult = 'correct' | 'wrong' | 'none' | 'host' | 'unknown';

/** GameRoom usa -1 cuando el servidor dice que ya respondiste pero no se sabe qué opción (reconexión sin sessionStorage) */
const UNKNOWN_ANSWER = -1;

@Component({
  imports: [AnswerOption, IsHost, IsPlayer],
  selector: 'app-reveal',
  styleUrl: './reveal.scss',
  templateUrl: './reveal.html',
})
export class Reveal {
  private readonly session = inject(RoomSession);

  readonly question = input.required<PublicQuestion>();
  readonly revealed = input.required<AnswerRevealed>();
  /** Índice que eligió el jugador, o null si no alcanzó a responder */
  readonly myAnswer = input.required<number | null>();

  // El host no responde, así que solo ve cuál era la correcta
  protected readonly result = computed<RevealResult>(() => {
    if (this.session.isHost()) return 'host';
    const mine = this.myAnswer();
    if (mine === null) return 'none';
    // No se califica lo que no se sabe: mejor "Respondiste" que un "Incorrecto" falso
    if (mine === UNKNOWN_ANSWER) return 'unknown';
    return mine === this.revealed().correctIndex ? 'correct' : 'wrong';
  });

  protected readonly title = computed(
    () =>
      ({
        correct: '¡Correcto!',
        wrong: 'Respuesta incorrecta',
        none: 'Se acabó el tiempo',
        host: 'Respuesta correcta',
        unknown: 'Respondiste esta pregunta',
      })[this.result()],
  );

  protected stateOf(i: number): AnswerState {
    if (i === this.revealed().correctIndex) return 'correct';
    if (!this.session.isHost() && i === this.myAnswer()) return 'wrong';
    return 'dimmed';
  }
}
