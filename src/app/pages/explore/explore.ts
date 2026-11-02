import { Component, computed, effect, inject, input } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { QuizService } from '../../shared/services/quiz.service';
import { QuizCard } from '../../shared/components/quiz-card/quiz-card';
import { ViewState } from '../../shared/components/view-state/view-state';
import { Paginator } from '../../shared/components/paginator/paginator';
import { CATEGORIES } from '../../shared/models/categories';
import { QuizSummary } from '../../shared/models/quiz.model';

const PAGE_SIZE = 12;

@Component({
  imports: [ReactiveFormsModule, QuizCard, ViewState, Paginator],
  selector: 'app-explore',
  templateUrl: './explore.html',
  styleUrl: './explore.scss',
})
export class Explore {
  private readonly quizService = inject(QuizService);
  private readonly router = inject(Router);

  // El estado de la búsqueda vive en la URL: /explore?q=espacio&topic=Ciencia&page=2
  // (withComponentInputBinding los entrega como input(); los query params llegan como string)
  readonly q = input<string>();
  readonly topic = input<string>();
  readonly page = input<string>();

  protected readonly categories = CATEGORIES;
  protected readonly trending = ['espacio', 'fútbol', 'cine', 'rock'];

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly selected = computed(() => this.topic() ?? 'all');
  protected readonly currentPage = computed(() => Math.max(1, Number(this.page()) || 1));

  // Cada vez que cambia q, topic o page, rxResource vuelve a pedir solo
  protected readonly quizzes = rxResource({
    params: () => ({ q: this.q(), topic: this.topic(), page: this.currentPage(), limit: PAGE_SIZE }),
    stream: ({ params }) => this.quizService.getPublic(params),
  });

  protected readonly totalPages = computed(() => {
    if (!this.quizzes.hasValue()) return 1;
    const { totalPages, total, limit } = this.quizzes.value();
    return totalPages ?? Math.max(1, Math.ceil(total / limit));
  });

  /** Último q que mandamos a la URL: sirve para distinguir "lo escribí yo" de "cambió por fuera" */
  private lastSent = '';

  constructor() {
    // Escribir en el buscador → esperar 300 ms sin teclear → actualizar la URL
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(value => this.applyQuery(value, true));

    // Si q cambia por fuera (botón Atrás, link de la landing), se refleja en el buscador
    effect(() => {
      const fromUrl = this.q() ?? '';
      if (fromUrl !== this.lastSent) {
        this.lastSent = fromUrl;
        this.searchControl.setValue(fromUrl, { emitEvent: false });
      }
    });
  }

  protected search(): void {
    this.applyQuery(this.searchControl.value);
  }

  protected useTrending(term: string): void {
    this.searchControl.setValue(term);
  }

  protected selectTopic(id: string): void {
    this.navigate({ topic: id === 'all' ? null : id, page: null });
  }

  protected goToPage(page: number): void {
    this.navigate({ page: page === 1 ? null : page });
  }

  protected clearFilters(): void {
    this.lastSent = '';
    this.searchControl.setValue('', { emitEvent: false });
    this.navigate({ q: null, topic: null, page: null });
  }

  protected playQuiz(quiz: QuizSummary): void {
    this.router.navigate(['/room/new'], { queryParams: { quiz: quiz._id } });
  }

  /** Buscar siempre regresa a la página 1 */
  private applyQuery(value: string, replace = false): void {
    const q = value.trim();
    this.lastSent = q;
    this.navigate({ q: q || null, page: null }, replace);
  }

  /** null quita el parámetro de la URL; 'merge' conserva los demás */
  private navigate(queryParams: Record<string, string | number | null>, replace = false): void {
    this.router.navigate([], { queryParams, queryParamsHandling: 'merge', replaceUrl: replace });
  }
}