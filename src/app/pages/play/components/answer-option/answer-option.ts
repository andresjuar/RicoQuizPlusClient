import { Component, input, output } from '@angular/core';

export type AnswerState = 'idle' | 'selected' | 'dimmed';

@Component({
  selector: 'app-answer-option',
  styleUrl: './answer-option.scss',
  templateUrl: './answer-option.html',
})
export class AnswerOption {
  /** 0–3: define color (--answer-N) e ícono (triángulo, rombo, círculo, cuadrado) */
  readonly index = input.required<number>();
  readonly label = input.required<string>();
  readonly state = input<AnswerState>('idle');
  readonly disabled = input(false);

  readonly picked = output<void>();
}