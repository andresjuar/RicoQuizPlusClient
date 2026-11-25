import { Component, input, output } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import {
  AI_TOPIC_SUGGESTIONS,
  DEFAULT_AI_QUESTION_COUNT,
  MAX_AI_QUESTIONS,
  MIN_AI_QUESTIONS,
} from '../../models/quiz.model';

export interface AiQuizRequest {
  topic: string;
  numQuestions: number;
}

function topicLength(control: AbstractControl<string>): ValidationErrors | null {
  const len = control.value.trim().length;
  return len >= 3 && len <= 60 ? null : { topic: true };
}

/**
 * Formulario para generar un quiz con IA: tema (con sugerencias) y número de preguntas.
 * Solo valida y emite `generate`; quien lo usa decide a qué endpoint llamar
 * (POST /quizzes/generate en Nueva partida, POST /matches/:id/generate-quiz en el lobby).
 */
@Component({
  selector: 'app-ai-quiz-form',
  imports: [ReactiveFormsModule],
  template: `
    <form class="aiq" (submit)="onSubmit($event)" novalidate>
      <div class="field">
        <label [for]="id + '-topic'">Tema</label>
        <input [id]="id + '-topic'" class="input" type="text" placeholder="Ej. Historia del arte" maxlength="60"
               autocomplete="off" [formControl]="topic" />
        @if (topic.touched && topic.invalid) {
          <span class="field__error">Escribe un tema de 3 a 60 caracteres.</span>
        }
      </div>

      <div class="aiq__chips" aria-label="Sugerencias de tema">
        @for (s of suggestions; track s) {
          <button type="button" class="chip" (click)="topic.setValue(s)">{{ s }}</button>
        }
      </div>

      <!-- Mismo slider que "Generar con IA" en el formulario de quiz -->
      <div class="field">
        <label [for]="id + '-num'">Número de preguntas: {{ numQuestions.value }}</label>
        <input [id]="id + '-num'" type="range" [min]="minQuestions" [max]="maxQuestions" [formControl]="numQuestions" />
      </div>

      <button type="submit" class="btn btn--primary" [class.btn--block]="block()">{{ submitLabel() }}</button>
    </form>
  `,
  styles: `
    .aiq { display: flex; flex-direction: column; gap: var(--sp-4); }
    .aiq__chips { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
    input[type='range'] { width: 100%; accent-color: var(--primary); }
  `,
})
export class AiQuizForm {
  private static nextId = 0;
  protected readonly id = `ai-quiz-${AiQuizForm.nextId++}`;

  readonly submitLabel = input('Generar quiz');
  /** Botón a todo el ancho */
  readonly block = input(false);

  readonly generate = output<AiQuizRequest>();

  protected readonly suggestions = AI_TOPIC_SUGGESTIONS;
  protected readonly minQuestions = MIN_AI_QUESTIONS;
  protected readonly maxQuestions = MAX_AI_QUESTIONS;
  protected readonly numQuestions = new FormControl(DEFAULT_AI_QUESTION_COUNT, {
    nonNullable: true,
    validators: [Validators.min(MIN_AI_QUESTIONS), Validators.max(MAX_AI_QUESTIONS)],
  });
  protected readonly topic = new FormControl('', { nonNullable: true, validators: [topicLength] });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.topic.invalid) {
      this.topic.markAsTouched();
      return;
    }
    // El slider entrega el valor como número; Number() por si algún navegador lo deja como texto
    this.generate.emit({ topic: this.topic.value.trim(), numQuestions: Number(this.numQuestions.value) });
  }
}
