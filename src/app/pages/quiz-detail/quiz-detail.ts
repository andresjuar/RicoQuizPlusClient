import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { QuizService } from '../../shared/services/quiz.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { ToastService } from '../../shared/services/toast.service';
import { ViewState } from '../../shared/components/view-state/view-state';
import { categoryOf } from '../../shared/models/categories';
import { Quiz } from '../../shared/models/quiz.model';

@Component({
  imports: [RouterLink, ViewState],
  selector: 'app-quiz-detail',
  templateUrl: './quiz-detail.html',
  styleUrl: './quiz-detail.scss',
})
export class QuizDetail {
  private readonly quizService = inject(QuizService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** :id de la ruta (withComponentInputBinding lo entrega como input) */
  readonly id = input.required<string>();

  protected readonly quiz = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.quizService.getById(params),
  });

  /** Solo el dueño ve la respuesta correcta y los botones Editar / Eliminar */
  protected readonly isOwner = computed(
    () => this.quiz.hasValue() && this.quiz.value().owner._id === this.auth.user()?._id,
  );

  protected readonly category = computed(() => categoryOf(this.quiz.hasValue() ? this.quiz.value().topic : undefined));

  /** Tiempo de cada pregunta + ~10 s de reveal/leaderboard (misma cuenta que la tarjeta) */
  protected readonly minutes = computed(() => {
    if (!this.quiz.hasValue()) return 0;
    const { questions } = this.quiz.value();
    const seconds = questions.reduce((sum, q) => sum + q.timeLimitSeconds, 0) + questions.length * 10;
    return Math.max(1, Math.round(seconds / 60));
  });

  protected play(quiz: Quiz): void {
    this.router.navigate(['/room/new'], { queryParams: { quiz: quiz._id } });
  }

  protected edit(quiz: Quiz): void {
    this.router.navigate(['/quizzes', quiz._id, 'edit']);
  }

  protected remove(quiz: Quiz): void {
    this.confirm
      .confirm({
        title: '¿Eliminar este quiz?',
        message: `Se eliminará «${quiz.title}» con sus ${quiz.questions.length} preguntas. Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        variant: 'danger',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.quizService.delete(quiz._id)),
      )
      .subscribe({
        next: () => {
          this.toast.success(`«${quiz.title}» se eliminó correctamente.`);
          this.router.navigate(['/quizzes/mine']);
        },
        // El mensaje de error ya lo mostró el interceptor
        error: () => undefined,
      });
  }
}