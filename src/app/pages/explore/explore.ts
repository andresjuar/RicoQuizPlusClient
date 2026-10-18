import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { QuizService } from '../../shared/services/quiz.service';
import { QuizCard } from '../../shared/components/quiz-card/quiz-card';
import { CATEGORIES } from '../../shared/models/categories';
import { Quiz } from '../../shared/models/quiz.model';

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

@Component({
  imports: [QuizCard],
  selector: 'app-explore',
  templateUrl: './explore.html',
  styleUrl: './explore.scss',
})
export class Explore {
  private readonly quizService = inject(QuizService);
  private readonly router = inject(Router);

  /** ?category=Ciencia (desde los chips de la landing) */
  readonly category = input<string>();

  protected readonly categories = CATEGORIES;
  protected readonly trending = ['espacio', 'fútbol', 'cine', 'rock'];

  protected readonly search = signal('');
  protected readonly selected = linkedSignal(() => this.category() ?? 'all');

  private readonly quizzes = toSignal(this.quizService.getPublic());
  protected readonly loading = computed(() => this.quizzes() === undefined);

  protected readonly filtered = computed(() => {
    const term = normalize(this.search());
    const cat = this.selected();

    return (this.quizzes() ?? []).filter(quiz => {
      const matchesCategory = cat === 'all' || quiz.topic === cat;
      const haystack = normalize([quiz.title, quiz.topic ?? '', quiz.description ?? '', ...quiz.tags].join(' '));
      return matchesCategory && (!term || haystack.includes(term));
    });
  });

  protected clearFilters(): void {
    this.search.set('');
    this.selected.set('all');
  }

  protected playQuiz(quiz: Quiz): void {
    this.router.navigate(['/room/new'], { queryParams: { quiz: quiz._id } });
  }
}
