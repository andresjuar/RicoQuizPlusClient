import { Component, computed, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, map } from 'rxjs';
import { Quiz } from '../../../../shared/models/quiz.model';
import { QuizService } from '../../../../shared/services/quiz.service';

export interface QuizPickerData {
  /** Quiz que tiene la sala ahora (aparece marcado como "Actual") */
  currentId: string;
}

const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Diálogo para que el host elija otro quiz mientras está en el lobby. Cierra con el Quiz elegido. */
@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-quiz-picker-dialog',
  styleUrl: './quiz-picker-dialog.scss',
  templateUrl: './quiz-picker-dialog.html',
})
export class QuizPickerDialog {
  private readonly quizService = inject(QuizService);
  private readonly data = inject<QuizPickerData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<Quiz>>(DialogRef);

  protected readonly currentId = this.data.currentId;

  // Mis quizzes + públicos, sin repetir (undefined mientras carga)
  private readonly loaded = toSignal(
    forkJoin([this.quizService.getMine(), this.quizService.getPublic()]).pipe(
      map(([mine, pub]) => [...mine, ...pub.filter(p => !mine.some(m => m._id === p._id))]),
    ),
  );
  protected readonly loading = computed(() => this.loaded() === undefined);

  protected readonly search = new FormControl('', { nonNullable: true });
  private readonly query = toSignal(this.search.valueChanges, { initialValue: '' });
  protected readonly filtered = computed(() => {
    const q = normalize(this.query().trim());
    const all = this.loaded() ?? [];
    if (!q) return all;
    return all.filter(z => normalize([z.title, z.topic ?? '', z.description ?? '', ...z.tags].join(' ')).includes(q));
  });

  protected readonly picked = signal<Quiz | null>(null);
  protected readonly canConfirm = computed(() => {
    const p = this.picked();
    return !!p && p._id !== this.currentId;
  });

  protected plural(n: number): string {
    return `${n} ${n === 1 ? 'pregunta' : 'preguntas'}`;
  }

  protected pick(q: Quiz): void {
    this.picked.set(q);
  }

  protected confirm(): void {
    const p = this.picked();
    if (p && this.canConfirm()) this.ref.close(p);
  }
}