import { Component, DestroyRef, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import { QuizCard } from '../../shared/components/quiz-card/quiz-card';
import { QuizSummary, toSummary } from '../../shared/models/quiz.model';
import { QuizService } from '../../shared/services/quiz.service';
import { ToastService } from '../../shared/services/toast.service';

type Mode = 'existing' | 'ai';

const AI_QUESTION_COUNT = 10;
const MOCK_ROOM_CODE = '482190';

const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function topicLength(control: AbstractControl<string>): ValidationErrors | null {
  const len = control.value.trim().length;
  return len >= 3 && len <= 60 ? null : { topic: true };
}

@Component({
  imports: [ReactiveFormsModule, RouterLink, QuizCard],
  selector: 'app-new-room',
  styleUrl: './new-room.scss',
  templateUrl: './new-room.html',
})
export class NewRoom {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly quizService = inject(QuizService);
  private readonly destroyRef = inject(DestroyRef);

  /** ?quiz=<id>: lo mandan explorar, mis quizzes, dashboard y landing al pulsar "Jugar" */
  readonly quiz = input<string>();

  protected readonly suggestions = ['Espacio', 'Historia de México', 'Cine', 'Gastronomía', 'Fútbol'];
  protected readonly mode = signal<Mode>('existing');

  // Mis quizzes + públicos, sin repetir (undefined mientras carga)
  private readonly loaded = toSignal(
    forkJoin([this.quizService.getMine({ limit: 50 }), this.quizService.getPublic({ limit: 50 })]).pipe(
      map(([{ data: mine }, { data: pub }]) => [...mine, ...pub.filter(p => !mine.some(m => m._id === p._id))]),
    ),
  );
  protected readonly loading = computed(() => this.loaded() === undefined);
  private readonly quizzes = computed(() => this.loaded() ?? []);

  // Arranca con el quiz de ?quiz= (cuando termina de cargar la lista); el usuario puede cambiarlo
  protected readonly selected = linkedSignal<QuizSummary | null>(() => {
    const id = this.quiz();
    return id ? (this.quizzes().find(q => q._id === id) ?? null) : null;
  });

  // Buscador
  protected readonly search = new FormControl('', { nonNullable: true });
  private readonly query = toSignal(this.search.valueChanges, { initialValue: '' });
  protected readonly filtered = computed(() => {
    const q = normalize(this.query().trim());
    if (!q) return this.quizzes();
    return this.quizzes().filter(z =>
      normalize([z.title, z.topic ?? '', z.description ?? '', ...z.tags].join(' ')).includes(q),
    );
  });

  // Generación con IA
  protected readonly topic = new FormControl('', { nonNullable: true, validators: [topicLength] });
  protected readonly generating = signal(false);
  protected readonly generated = signal<QuizSummary | null>(null);

  protected plural(n: number): string {
    return `${n} ${n === 1 ? 'pregunta' : 'preguntas'}`;
  }

  protected labelFor(q: QuizSummary): string {
    return this.selected()?._id === q._id ? 'Seleccionado' : 'Elegir quiz';
  }

  protected choose(q: QuizSummary): void {
    this.selected.set(q);
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

    // POST /quizzes/generate: la API genera las preguntas y guarda el quiz (privado) en Mis quizzes
    this.quizService
      .generate(topic, AI_QUESTION_COUNT)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: created => {
          const quiz = toSummary(created);
          this.generated.set(quiz);
          this.selected.set(quiz);
          this.generating.set(false);
          this.toast.success(`Se generaron ${quiz.questionCount} preguntas sobre ${topic}`, 'Quiz listo');
        },
        error: () => this.generating.set(false), // el mensaje lo muestra el interceptor (#33)
      });
  }

  protected discardGenerated(): void {
    const g = this.generated();
    if (g && this.selected()?._id === g._id) this.selected.set(null);
    this.generated.set(null);
  }

  protected createRoom(): void {
    if (!this.selected()) return;
    this.toast.success('Comparte el código con tus jugadores', 'Sala creada');
    // El quiz viaja en el state de la navegación para que el lobby lo muestre (y el host pueda cambiarlo)
    this.router.navigate(['/play', MOCK_ROOM_CODE], { state: { quiz: this.selected() } });
  }
}