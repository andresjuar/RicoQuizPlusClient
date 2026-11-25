import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { QuizService } from '../../shared/services/quiz.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { ImageViewerService } from '../../shared/services/image-viewer.service';
import { ToastService } from '../../shared/services/toast.service';
import { ImageFrame } from '../../shared/components/image-frame/image-frame';
import { ViewState } from '../../shared/components/view-state/view-state';
import { categoryOf } from '../../shared/models/categories';
import { Quiz } from '../../shared/models/quiz.model';

@Component({
  imports: [ImageFrame, RouterLink, ViewState],
  selector: 'app-quiz-detail',
  templateUrl: './quiz-detail.html',
  styleUrl: './quiz-detail.scss',
})
export class QuizDetail {
  private readonly quizService = inject(QuizService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly viewer = inject(ImageViewerService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly quiz = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.quizService.getById(params),
  });

  protected readonly isOwner = computed(
    () => this.quiz.hasValue() && this.quiz.value().owner._id === this.auth.user()?._id,
  );

  protected readonly category = computed(() => categoryOf(this.quiz.hasValue() ? this.quiz.value().topic : undefined));

  protected readonly minutes = computed(() => {
    if (!this.quiz.hasValue()) return 0;
    const { questions } = this.quiz.value();
    const seconds = questions.reduce((sum, q) => sum + q.timeLimitSeconds, 0) + questions.length * 10;
    return Math.max(1, Math.round(seconds / 60));
  });

  protected play(quiz: Quiz): void {
    this.router.navigate(['/room/new'], { queryParams: { quiz: quiz._id } });
  }

  protected viewCover(quiz: Quiz): void {
    if (!quiz.coverImageUrl) return;
    this.viewer
      .open({ url: quiz.coverImageUrl, title: quiz.title, canDelete: this.isOwner() })
      .pipe(filter(result => result === 'delete'))
      .subscribe(() => this.removeCover(quiz));
  }

  protected removeCover(quiz: Quiz): void {
    this.confirm
      .confirm({
        title: '¿Eliminar la portada?',
        message: 'El quiz se quedará sin portada. Podrás subir otra desde Editar.',
        confirmText: 'Eliminar',
        variant: 'danger',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.quizService.removeCover(quiz._id)),
      )
      .subscribe({
        next: () => {
          this.toast.success('La portada se eliminó correctamente.');
          this.quiz.reload();
        },
        error: () => this.quiz.reload(),
      });
  }

  /** Imagen de una pregunta: cualquiera puede verla y descargarla; solo el dueño puede eliminarla */
  protected viewQuestionImage(quiz: Quiz, index: number): void {
    const url = quiz.questions[index]?.imageUrl;
    if (!url) return;
    this.viewer
      .open({ url, title: `Pregunta ${index + 1}: ${quiz.questions[index].question}`, canDelete: this.isOwner() })
      .pipe(filter(result => result === 'delete'))
      .subscribe(() => this.removeQuestionImage(quiz, index));
  }

  protected removeQuestionImage(quiz: Quiz, index: number): void {
    this.confirm
      .confirm({
        title: '¿Eliminar la imagen de la pregunta?',
        message: `La pregunta ${index + 1} se quedará sin imagen. Podrás subir otra desde Editar.`,
        confirmText: 'Eliminar',
        variant: 'danger',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.quizService.removeQuestionImage(quiz, index)),
      )
      .subscribe({
        next: () => {
          this.toast.success('La imagen de la pregunta se eliminó correctamente.');
          this.quiz.reload();
        },
        // El interceptor ya avisó (p. ej. 403 si no eres el dueño); se recarga para no quedar desincronizado
        error: () => this.quiz.reload(),
      });
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
        error: () => this.quiz.reload(),
      });
  }
}