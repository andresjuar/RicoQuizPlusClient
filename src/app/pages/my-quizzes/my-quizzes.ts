import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { QuizService } from '../../shared/services/quiz.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { ToastService } from '../../shared/services/toast.service';
import { QuizCard } from '../../shared/components/quiz-card/quiz-card';
import { ViewState } from '../../shared/components/view-state/view-state';
import { Paginator } from '../../shared/components/paginator/paginator';
import { QuizSummary } from '../../shared/models/quiz.model';

type Visibility = 'all' | 'public' | 'private';

const PAGE_SIZE = 12;

@Component({
  imports: [RouterLink, QuizCard, ViewState, Paginator],
  selector: 'app-my-quizzes',
  templateUrl: './my-quizzes.html',
  styleUrl: './my-quizzes.scss',
})
export class MyQuizzes {
  private readonly quizService = inject(QuizService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly filter = signal<Visibility>('all');
  protected readonly page = signal(1);
  protected readonly filters: { id: Visibility; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'public', label: 'Públicos' },
    { id: 'private', label: 'Privados' },
  ];

  // El filtro y la página van a la API (visibility, page); al cambiar cualquiera se vuelve a pedir
  protected readonly quizzes = rxResource({
    params: () => ({ visibility: this.filter(), page: this.page(), limit: PAGE_SIZE }),
    stream: ({ params }) => this.quizService.getMine(params),
  });

  protected setFilter(id: Visibility): void {
    this.filter.set(id);
    this.page.set(1);
  }

  protected play(quiz: QuizSummary): void {
    this.router.navigate(['/room/new'], { queryParams: { quiz: quiz._id } });
  }

  protected edit(quiz: QuizSummary): void {
    this.router.navigate(['/quizzes', quiz._id, 'edit']);
  }

  protected remove(quiz: QuizSummary): void {
    this.confirm
      .confirm({
        title: '¿Eliminar este quiz?',
        message: `Se eliminará «${quiz.title}» con sus ${quiz.questionCount} preguntas. Esta acción no se puede deshacer.`,
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
          // Si era el único de la página, retrocede una (eso ya vuelve a pedir); si no, recarga la actual
          const wasLastOnPage = this.quizzes.hasValue() && this.quizzes.value().data.length === 1;
          if (wasLastOnPage && this.page() > 1) this.page.update(p => p - 1);
          else this.quizzes.reload();
        },
        // El interceptor ya mostró el aviso (p. ej. 403); se vuelve a pedir la lista para reflejar su estado real
        error: () => this.quizzes.reload(),
      });
  }
}