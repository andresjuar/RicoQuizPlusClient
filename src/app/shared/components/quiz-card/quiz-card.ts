import { Component, computed, input, output, signal } from '@angular/core';
import { Quiz } from '../../models/quiz.model';
import { categoryOf } from '../../models/categories';

@Component({
  imports: [],
  selector: 'app-quiz-card',
  templateUrl: './quiz-card.html',
  styleUrl: './quiz-card.scss',
})
export class QuizCard {
  readonly quiz = input.required<Quiz>();
  readonly actionLabel = input('Juega este quiz');
  readonly action = output<Quiz>();

  protected readonly favorite = signal(false);
  protected readonly category = computed(() => categoryOf(this.quiz().topic));

  /** Tiempo de cada pregunta + ~10 s de reveal/leaderboard */
  protected readonly minutes = computed(() => {
    const seconds = this.quiz().questions.reduce((sum, q) => sum + q.timeLimitSeconds + 10, 0);
    return Math.max(1, Math.round(seconds / 60));
  });
}