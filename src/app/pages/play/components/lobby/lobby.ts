import { Component, computed, inject, input, output } from '@angular/core';
import { PublicPlayer } from '../../../../shared/models/game.model';
import { normalizeRoomCode } from '../../../../shared/models/match.model';
import { QuizSummary } from '../../../../shared/models/quiz.model';
import { CopyToClipboard } from '../../../../shared/directives/copy-to-clipboard';
import { IsHost } from '../../../../shared/directives/is-host';
import { IsPlayer } from '../../../../shared/directives/is-player';
import { ToastService } from '../../../../shared/services/toast.service';
import { PlayerChip } from '../player-chip/player-chip';
import { RoomQr } from '../room-qr/room-qr';

/** Lo que ve cada quien lo deciden *appIsHost / *appIsPlayer (rol que asigna el servidor en RoomSession) */
@Component({
  imports: [CopyToClipboard, IsHost, IsPlayer, PlayerChip, RoomQr],
  selector: 'app-lobby',
  styleUrl: './lobby.scss',
  templateUrl: './lobby.html',
})
export class Lobby {
  private readonly toast = inject(ToastService);

  readonly code = input.required<string>();
  /** Solo jugadores: el host no aparece en la lista que manda el servidor */
  readonly players = input.required<PublicPlayer[]>();
  /** Quiz de la sala; solo se muestra al host */
  readonly quiz = input<QuizSummary | null>(null);
  /** Se está cargando, cambiando o generando el quiz */
  readonly quizBusy = input(false);
  /** Sin conexión en tiempo real: las acciones se desactivan (GameShell muestra el aviso) */
  readonly offline = input(false);

  readonly start = output<void>();
  /** El host quiere elegir otro quiz (lo abre el shell) */
  readonly changeQuiz = output<void>();

  protected readonly connectedCount = computed(() => this.players().filter(p => p.isConnected).length);

  protected readonly quizMeta = computed(() => {
    const n = this.quiz()?.questionCount ?? 0;
    return `${n} ${n === 1 ? 'pregunta' : 'preguntas'}`;
  });

  // 4 letras del backend, siempre en mayúsculas aunque la URL venga en minúsculas: "qwer" -> "QWER"
  protected readonly formattedCode = computed(() => normalizeRoomCode(this.code()));

  /** Link que codifica el QR: misma app (local o Netlify) + /play/<CÓDIGO> */
  protected readonly joinUrl = computed(() => `${location.origin}/play/${this.formattedCode()}`);

  protected onCopied(ok: boolean): void {
    if (ok) this.toast.success('Código de sala copiado');
    else this.toast.error('No se pudo copiar el código');
  }
}
