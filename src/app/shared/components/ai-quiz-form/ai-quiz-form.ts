import { Component, input, output, signal } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { AI_QUESTION_COUNTS, AI_TOPIC_SUGGESTIONS, DEFAULT_AI_QUESTION_COUNT } from '../../models/quiz.model';

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

      <fieldset class="aiq__count">
        <legend>Número de preguntas</legend>
        <div class="aiq__chips" role="radiogroup">
          @for (n of counts; track n) {
            <button type="button" class="chip" role="radio" [class.is-active]="count() === n"
                    [attr.aria-checked]="count() === n" (click)="count.set(n)">{{ n }}</button>
          }
        </div>
      </fieldset>

      <button type="submit" class="btn btn--primary" [class.btn--block]="block()">{{ submitLabel() }}</button>
    </form>
  `,
  styles: `
    .aiq { display: flex; flex-direction: column; gap: var(--sp-4); }
    .aiq__chips { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
    .aiq__count { border: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--sp-2); }
    .aiq__count legend { padding: 0; margin-bottom: var(--sp-2); font-size: var(--fs-sm); font-weight: 600; }
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
  protected readonly counts = AI_QUESTION_COUNTS;
  protected readonly count = signal<number>(DEFAULT_AI_QUESTION_COUNT);
  protected readonly topic = new FormControl('', { nonNullable: true, validators: [topicLength] });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.topic.invalid) {
      this.topic.markAsTouched();
      return;
    }
    this.generate.emit({ topic: this.topic.value.trim(), numQuestions: this.count() });
  }
}
