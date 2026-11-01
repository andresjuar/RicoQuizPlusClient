import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { QuizService } from '../../shared/services/quiz.service';
import { HistoryService } from '../../shared/services/history.service';
import { QuizCard } from '../../shared/components/quiz-card/quiz-card';
import { MatchRow } from '../../shared/components/match-row/match-row';
import { ViewState } from '../../shared/components/view-state/view-state';
import { QuizSummary } from '../../shared/models/quiz.model';

@Component({
  imports: [RouterLink, DecimalPipe, QuizCard, MatchRow, ViewState],
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  protected readonly auth = inject(AuthService);
  private readonly quizService = inject(QuizService);
  private readonly historyService = inject(HistoryService);
  private readonly router = inject(Router);

  // rxResource da isLoading(), error(), value() y reload() para <app-view-state>
  // Página de 3 para las tarjetas; page.total da el número real de quizzes
  protected readonly myQuizzes = rxResource({ stream: () => this.quizService.getMine({ limit: 3 }) });
  protected readonly history = rxResource({ stream: () => this.historyService.getMine() });

  protected readonly greeting = (() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  })();

  protected readonly stats = computed(() => {
    // value() lanza si el resource está en error: por eso se pregunta hasValue() primero
    const matches = this.history.hasValue() ? this.history.value() : [];
    const quizzes = this.myQuizzes.hasValue() ? this.myQuizzes.value().total : 0;
    return [
      { icon: '📝', label: 'Quizzes creados', value: quizzes },
      { icon: '🎮', label: 'Partidas jugadas', value: matches.length },
      { icon: '🏆', label: 'Victorias', value: matches.filter(m => m.rank === 1).length },
      { icon: '⚡', label: 'Mejor puntuación', value: matches.length ? Math.max(...matches.map(m => m.score)) : 0 },
    ];
  });

  protected playQuiz(quiz: QuizSummary): void {
    this.router.navigate(['/room/new'], { queryParams: { quiz: quiz._id } });
  }
}