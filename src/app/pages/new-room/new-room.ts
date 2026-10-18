import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MOCK_QUIZZES } from '../../shared/mocks/mock-data';
import { Quiz } from '../../shared/models/quiz.model';
import { ToastService } from '../../shared/services/toast.service';

type Mode = 'existing' | 'ai';

/** Lo mínimo que necesita la vista para resumir el quiz elegido */
interface QuizChoice {
  id: string;
  title: string;
  questionCount: number;
}

const MOCK_ROOM_CODE = '482190';

const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function topicLength(control: AbstractControl<string>): ValidationErrors | null {
  const len = control.value.trim().length;
  return len >= 3 && len <= 60 ? null : { topic: true };
}

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-new-room',
  styleUrl: './new-room.scss',
  templateUrl: './new-room.html',
})
export class NewRoom {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private generationTimeout?: ReturnType<typeof setTimeout>;

  // TODO integración: QuizService (GET /quizzes) y generación real con IA
  protected readonly quizzes = MOCK_QUIZZES;
  protected readonly suggestions = ['Espacio', 'Historia de México', 'Cine', 'Gastronomía', 'Fútbol'];

  protected readonly mode = signal<Mode>('existing');
  protected readonly selected = signal<QuizChoice | null>(null);

  // Buscador
  protected readonly search = new FormControl('', { nonNullable: true });
  private readonly query = toSignal(this.search.valueChanges, { initialValue: '' });
  protected readonly filtered = computed(() => {
    const q = normalize(this.query().trim());
    if (!q) return this.quizzes;
    return this.quizzes.filter(z =>
      normalize([z.title, z.topic ?? '', z.description ?? '', ...z.tags].join(' ')).includes(q),
    );
  });

  // Generación con IA (simulada)
  protected readonly topic = new FormControl('', { nonNullable: true, validators: [topicLength] });
  protected readonly generating = signal(false);
  protected readonly generated = signal<QuizChoice | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.generationTimeout));
  }

  protected plural(n: number): string {
    return `${n} ${n === 1 ? 'pregunta' : 'preguntas'}`;
  }

  protected minutes(q: Quiz): number {
    const seconds = q.questions.reduce((sum, item) => sum + item.timeLimitSeconds, 0);
    return Math.max(1, Math.round(seconds / 60));
  }

  protected choose(q: Quiz): void {
    this.selected.set({ id: q._id, title: q.title, questionCount: q.questions.length });
  }

  protected useSuggestion(topic: string): void {
    this.topic.setValue(topic);
  }

  protected onGenerate(event: Event): void {
    event.preventDefault();
    if (this.topic.invalid) {
      this.topic.markAsTouched();
      return;
    }
    const topic = this.topic.value.trim();
    this.generating.set(true);
    this.generated.set(null);

    this.generationTimeout = setTimeout(() => {
      const choice: QuizChoice = { id: `ai-${Date.now()}`, title: `Quiz de ${topic}`, questionCount: 10 };
      this.generated.set(choice);
      this.selected.set(choice);
      this.generating.set(false);
      this.toast.success(`Se generaron 10 preguntas sobre ${topic}`, 'Quiz listo');
    }, 2200);
  }

  protected discardGenerated(): void {
    const g = this.generated();
    if (g && this.selected()?.id === g.id) this.selected.set(null);
    this.generated.set(null);
  }

  protected createRoom(): void {
    if (!this.selected()) return;
    this.toast.success('Comparte el código con tus jugadores', 'Sala creada');
    this.router.navigate(['/play', MOCK_ROOM_CODE]);
  }
}