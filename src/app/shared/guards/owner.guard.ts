import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { QuizService } from '../services/quiz.service';

/**
 * Solo el dueño del quiz entra a editarlo; los demás van a /403.
 * Sin sesión lo decide authGuard (ruta padre). Si el quiz no carga (404, red), deja pasar:
 * el formulario ya maneja ese error con su toast, así no salen dos.
 */
export const ownerGuard: CanActivateFn = async route => {
  const auth = inject(AuthService);
  const quizService = inject(QuizService);
  const router = inject(Router);

  await auth.whenReady();

  const id = route.paramMap.get('id');
  const userId = auth.user()?._id;
  if (!id || !userId) return true;

  try {
    const quiz = await firstValueFrom(quizService.getById(id, { silent: true }));
    return quiz.owner._id === userId ? true : router.createUrlTree(['/403']);
  } catch {
    return true;
  }
};
