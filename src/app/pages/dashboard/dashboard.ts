import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { QuizService } from '../../shared/services/quiz.service';
import { HistoryService } from '../../shared/services/history.service';
import { QuizCard } from '../../shared/components/quiz-card/quiz-card';
import { MatchRow } from '../../shared/components/match-row/match-row';
import { Quiz } from '../../shared/models/quiz.model';

@Component({
  imports: [RouterLink, DecimalPipe, QuizCard, MatchRow],
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  protected readonly auth = inject(AuthService);
  private readonly quizService = inject(QuizService);
  private readonly historyService = inject(HistoryService);
  private readonly router = inject(Router);

  protected readonly myQuizzes = toSignal(this.quizService.getMine());
  protected readonly history = toSignal(this.historyService.getMine());

  protected readonly greeting = (() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  })();

  protected readonly stats = computed(() => {
    const matches = this.history() ?? [];
    return [
      { icon: '📝', label: 'Quizzes creados', value: this.myQuizzes()?.length ?? 0 },
      { icon: '🎮', label: 'Partidas jugadas', value: matches.length },
      { icon: '🏆', label: 'Victorias', value: matches.filter(m => m.rank === 1).length },
      { icon: '⚡', label: 'Mejor puntuación', value: matches.length ? Math.max(...matches.map(m => m.score)) : 0 },
    ];
  });

  protected playQuiz(quiz: Quiz): void {
    this.router.navigate(['/room/new'], { queryParams: { quiz: quiz._id } });
  }
}