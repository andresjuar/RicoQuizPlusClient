import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { QuizService } from '../../shared/services/quiz.service';
import { MatchService } from '../../shared/services/match.service';
import { ToastService } from '../../shared/services/toast.service';
import { QuizCard } from '../../shared/components/quiz-card/quiz-card';
import { CATEGORIES } from '../../shared/models/categories';
import { Quiz } from '../../shared/models/quiz.model';

@Component({
  imports: [ReactiveFormsModule, RouterLink, QuizCard],
  selector: 'app-landing',
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  protected readonly auth = inject(AuthService);
  private readonly quizService = inject(QuizService);
  private readonly matchService = inject(MatchService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly categories = CATEGORIES;

  protected readonly popular = toSignal(
    this.quizService.getPublic().pipe(
      map(list => [...list].sort((a, b) => b.timesPlayed - a.timesPlayed).slice(0, 3)),
    ),
  );

  protected readonly steps = [
    { title: 'Elige o crea un quiz', text: 'Escoge uno de la comunidad o genera uno nuevo con IA a partir de cualquier tema.' },
    { title: 'Comparte el código', text: 'Tus amigos entran desde su celular con el código de 4 letras, sin crear cuenta.' },
    { title: 'Responde y gana', text: 'Entre más rápido aciertes, más puntos. El ranking se actualiza en cada pregunta.' },
  ];

  protected readonly joining = signal(false);
  protected readonly joinError = signal<string | null>(null);

  protected readonly joinForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]{4}$/)]],
  });

  protected join(): void {
    if (this.joinForm.invalid) {
      this.joinForm.markAllAsTouched();
      return;
    }

    const code = this.joinForm.controls.code.value.toUpperCase();
    this.joining.set(true);
    this.joinError.set(null);

    this.matchService.roomExists(code).subscribe(exists => {
      this.joining.set(false);
      if (!exists) {
        this.joinError.set(`No encontramos una sala activa con el código ${code}.`);
        return;
      }
      this.router.navigate(['/play', code]);
    });
  }

  protected playQuiz(quiz: Quiz): void {
    this.router.navigate(['/room/new'], { queryParams: { quiz: quiz._id } });
  }

  protected loginWithGoogle(): void {
    this.toast.info('El inicio de sesión con Google estará disponible pronto.');
  }
}
