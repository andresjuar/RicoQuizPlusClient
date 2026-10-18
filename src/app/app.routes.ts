import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { authGuard } from './shared/guards/auth.guard';
import { guestGuard } from './shared/guards/guest.guard';
import { leaveGameGuard } from './shared/guards/leave-game.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', loadComponent: () => import('./pages/landing/landing').then(m => m.Landing), title: 'RicoQuiz+' },
      { path: 'explore', loadComponent: () => import('./pages/explore/explore').then(m => m.Explore), title: 'Explorar' },

      { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./pages/login/login').then(m => m.Login), title: 'Iniciar sesión' },
      { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./pages/register/register').then(m => m.Register), title: 'Registro' },
      { path: 'activate/:token', loadComponent: () => import('./pages/activate/activate').then(m => m.Activate), title: 'Activar cuenta' },

      {
        path: '',
        canActivate: [authGuard],
        children: [
          { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard), title: 'Inicio' },
          { path: 'quizzes/mine', loadComponent: () => import('./pages/my-quizzes/my-quizzes').then(m => m.MyQuizzes), title: 'Mis quizzes' },
          { path: 'quizzes/new', loadComponent: () => import('./pages/quiz-form/quiz-form').then(m => m.QuizForm), title: 'Nuevo quiz' },
          { path: 'quizzes/:id/edit', loadComponent: () => import('./pages/quiz-form/quiz-form').then(m => m.QuizForm), title: 'Editar quiz' },
          { path: 'history', loadComponent: () => import('./pages/history/history').then(m => m.History), title: 'Historial' },
          { path: 'room/new', loadComponent: () => import('./pages/new-room/new-room').then(m => m.NewRoom), title: 'Nueva partida' },
        ],
      },
    ],
  },
  {
    path: 'play/:code',
    canDeactivate: [leaveGameGuard],
    loadComponent: () => import('./pages/play/game-shell').then(m => m.GameShell),
    title: 'Partida',
  },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFound), title: 'No encontrado' },
];