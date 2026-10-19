import { Component, input, output } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 4;

export type QuestionForm = FormGroup<{
  question: FormControl<string>;
  imageUrl: FormControl<string | null>;
  options: FormArray<FormControl<string>>;
  correctIndex: FormControl<number | null>;
  timeLimitSeconds: FormControl<number>;
}>;

export interface QuestionValue {
  question: string;
  imageUrl?: string | null;
  options: string[];
  correctIndex: number | null;
  timeLimitSeconds: number;
}

const optionControl = (value = '') =>
  new FormControl(value, { nonNullable: true, validators: [Validators.required] });

export function createQuestionForm(q?: Partial<QuestionValue>): QuestionForm {
  const options = q?.options?.length ? q.options : ['', '', '', ''];
  return new FormGroup({
    question: new FormControl(q?.question ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(300)],
    }),
    imageUrl: new FormControl<string | null>(q?.imageUrl ?? null),
    options: new FormArray(options.map(o => optionControl(o)), {
      validators: [Validators.minLength(MIN_OPTIONS)],
    }),
    correctIndex: new FormControl<number | null>(q?.correctIndex ?? null, Validators.required),
    timeLimitSeconds: new FormControl(q?.timeLimitSeconds ?? 20, {
      nonNullable: true,
      validators: [Validators.min(5), Validators.max(120)],
    }),
  });
}

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-question-editor',
  templateUrl: './question-editor.html',
  styleUrl: './question-editor.scss',
})
export class QuestionEditor {
  readonly form = input.required<QuestionForm>();
  readonly index = input.required<number>();
  readonly total = input.required<number>();

  readonly remove = output<void>();
  readonly duplicate = output<void>();
  readonly moveUp = output<void>();
  readonly moveDown = output<void>();

  protected readonly icons = ['▲', '◆', '●', '■'];
  protected readonly timeOptions = [5, 10, 20, 30, 60, 90, 120];
  protected readonly minOptions = MIN_OPTIONS;
  protected readonly maxOptions = MAX_OPTIONS;

  protected get options() {
    return this.form().controls.options;
  }

  protected get optionsInvalid(): boolean {
    return this.options.controls.some(c => c.touched && c.invalid);
  }

  protected addOption(): void {
    if (this.options.length >= MAX_OPTIONS) return;
    this.options.push(optionControl());
    this.options.markAsDirty();
  }

  protected removeOption(i: number): void {
    if (this.options.length <= MIN_OPTIONS) return;
    this.options.removeAt(i);
    this.options.markAsDirty();

    // Mantener la respuesta correcta apuntando a la misma opción
    const correct = this.form().controls.correctIndex;
    if (correct.value === i) correct.setValue(null);
    else if (correct.value !== null && correct.value > i) correct.setValue(correct.value - 1);
  }

  protected setCorrect(i: number): void {
    const correct = this.form().controls.correctIndex;
    correct.setValue(i);
    correct.markAsDirty();
    correct.markAsTouched();
  }

  protected onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file?.type.startsWith('image/')) return;
    const image = this.form().controls.imageUrl;
    image.setValue(URL.createObjectURL(file));
    image.markAsDirty();
  }

  protected removeImage(): void {
    const image = this.form().controls.imageUrl;
    image.setValue(null);
    image.markAsDirty();
  }
}