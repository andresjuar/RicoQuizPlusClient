import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { QuizService } from '../../shared/services/quiz.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { ToastService } from '../../shared/services/toast.service';
import { QuizCard } from '../../shared/components/quiz-card/quiz-card';
import { Quiz } from '../../shared/models/quiz.model';

type Filter = 'all' | 'public' | 'private';

@Component({
  imports: [RouterLink, QuizCard],
  selector: 'app-my-quizzes',
  templateUrl: './my-quizzes.html',
  styleUrl: './my-quizzes.scss',
})
export class MyQuizzes {
  private readonly quizService = inject(QuizService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  private readonly quizzes = toSignal(this.quizService.getMine());
  protected readonly loading = computed(() => this.quizzes() === undefined);

  protected readonly filter = signal<Filter>('all');
  protected readonly filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'public', label: 'Públicos' },
    { id: 'private', label: 'Privados' },
  ];

  protected readonly counts = computed(() => {
    const list = this.quizzes() ?? [];
    const pub = list.filter(q => q.isPublic).length;
    return { all: list.length, public: pub, private: list.length - pub } satisfies Record<Filter, number>;
  });

  protected readonly visible = computed(() => {
    const f = this.filter();
    return (this.quizzes() ?? []).filter(q => f === 'all' || (f === 'public') === q.isPublic);
  });

  protected play(quiz: Quiz): void {
    this.router.navigate(['/room/new'], { queryParams: { quiz: quiz._id } });
  }

  protected edit(quiz: Quiz): void {
    this.router.navigate(['/quizzes', quiz._id, 'edit']);
  }

  /** Solo muestra la confirmación y la notificación; el registro no se elimina */
  protected remove(quiz: Quiz): void {
    this.confirm
      .confirm({
        title: '¿Eliminar este quiz?',
        message: `Se eliminará «${quiz.title}» con sus ${quiz.questions.length} preguntas. Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        variant: 'danger',
      })
      .subscribe(ok => {
        if (ok) this.toast.success(`«${quiz.title}» se eliminó correctamente.`);
      });
  }
}
