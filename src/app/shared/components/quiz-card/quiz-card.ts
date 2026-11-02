import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuizSummary } from '../../models/quiz.model';
import { categoryOf } from '../../models/categories';

@Component({
  imports: [RouterLink],
  selector: 'app-quiz-card',
  templateUrl: './quiz-card.html',
  styleUrl: './quiz-card.scss',
})
export class QuizCard {
  readonly quiz = input.required<QuizSummary>();
  readonly actionLabel = input('Juega este quiz');
  readonly action = output<QuizSummary>();

  protected readonly favorite = signal(false);
  protected readonly category = computed(() => categoryOf(this.quiz().topic));

  /** Tiempo de cada pregunta + ~10 s de reveal/leaderboard */
  protected readonly minutes = computed(() => {
    const { totalSeconds, questionCount } = this.quiz();
    const seconds = totalSeconds + questionCount * 10;
    return Math.max(1, Math.round(seconds / 60));
  });
}