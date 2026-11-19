import { Component, computed, inject, input, OnInit } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Router } from '@angular/router';
import { GameLeaveState } from '../../shared/guards/leave-game.guard';
import { GamePhase } from '../../shared/models/game.model';
import { QuizSummary } from '../../shared/models/quiz.model';
import { AuthService } from '../../shared/services/auth.service';
import { GameRoom } from '../../shared/services/game-room.service';
import { RoomSession } from '../../shared/services/room-session.service';
import { FinalResults } from './components/final-results/final-results';
import { GuestGate } from './components/guest-gate/guest-gate';
import { Leaderboard } from './components/leaderboard/leaderboard';
import { Loading } from './components/loading/loading';
import { Lobby } from './components/lobby/lobby';
import { Question } from './components/question/question';
import { QuizPickerData, QuizPickerDialog } from './components/quiz-picker-dialog/quiz-picker-dialog';
import { Reveal } from './components/reveal/reveal';
import { RoomStatus } from './components/room-status/room-status';

type StatusTone = 'ok' | 'warn' | 'error' | 'final';

// Fases sin partida en curso: ahí se puede salir sin confirmar
const PHASES_WITHOUT_CONFIRM: GamePhase[] = ['connecting', 'error', 'guest-gate', 'finished'];

/**
 * Layout de pantalla completa de la partida (sin navbar). Una sola ruta (/play/:code);
 * la fase que decide la vista viene de GameRoom, que a su vez reacciona a los eventos de Socket.IO.
 *
 * Provee GameRoom y RoomSession: viven solo mientras estás en la sala, y RoomSession es
 * lo que leen las directivas *appIsHost / *appIsPlayer de todos los hijos.
 */
@Component({
  imports: [FinalResults, GuestGate, Leaderboard, Loading, Lobby, Question, Reveal, RoomStatus],
  providers: [GameRoom, RoomSession],
  selector: 'app-game-shell',
  styleUrl: './game-shell.scss',
  templateUrl: './game-shell.html',
})
export class GameShell implements GameLeaveState, OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);
  protected readonly room = inject(GameRoom);

  /** Llega de la ruta /play/:code (withComponentInputBinding) */
  readonly code = input.required<string>();

  protected readonly status = computed<{ label: string; tone: StatusTone }>(() => {
    // El estado de la conexión manda sobre la fase
    switch (this.room.connectionStatus()) {
      case 'reconnecting': return { label: 'Reconectando…', tone: 'warn' };
      case 'disconnected':
        if (this.room.phase() !== 'guest-gate') return { label: 'Sin conexión', tone: 'error' };
    }
    switch (this.room.phase()) {
      case 'connecting': return { label: 'Conectando', tone: 'warn' };
      case 'error': return { label: 'Sin sala', tone: 'error' };
      case 'guest-gate': return { label: 'Unirse', tone: 'warn' };
      case 'lobby': return { label: this.room.isHost() ? 'Sala abierta · Host' : 'Sala abierta', tone: 'ok' };
      case 'finished': return { label: 'Final', tone: 'final' };
      default: return { label: 'En juego', tone: 'ok' };
    }
  });

  ngOnInit(): void {
    // quiz y matchId solo llegan cuando el host viene de /room/new
    const state = history.state as { quiz?: QuizSummary; matchId?: string } | undefined;
    void this.room.enter(this.code(), { quiz: state?.quiz, matchId: state?.matchId });
  }

  /** Lo consulta leaveGameGuard: confirma la salida solo si hay partida en curso */
  shouldConfirmLeave(): boolean {
    return !PHASES_WITHOUT_CONFIRM.includes(this.room.phase());
  }

  // Host: elegir otro quiz en el lobby (PATCH /matches/:id/quiz)
  protected openQuizPicker(): void {
    const data: QuizPickerData = { currentId: this.room.quiz()?._id ?? '' };
    this.dialog
      .open<QuizSummary, QuizPickerData>(QuizPickerDialog, {
        data,
        width: '560px',
        maxWidth: 'calc(100vw - 32px)',
        backdropClass: 'rq-backdrop',
        autoFocus: 'dialog',
      })
      .closed.subscribe(picked => {
        if (picked) this.room.changeQuiz(picked);
      });
  }

  // Con sesión va al historial; como invitado, al inicio
  protected onLeave(): void {
    this.router.navigateByUrl(this.auth.isAuthenticated() ? '/history' : '/');
  }
}
