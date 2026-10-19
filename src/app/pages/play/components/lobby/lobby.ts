import { Component, computed, inject, input, output } from '@angular/core';
import { PlayerRole, PublicPlayer } from '../../../../shared/models/game.model';
import { Quiz } from '../../../../shared/models/quiz.model';
import { CopyToClipboard } from '../../../../shared/directives/copy-to-clipboard';
import { ToastService } from '../../../../shared/services/toast.service';
import { PlayerChip } from '../player-chip/player-chip';

@Component({
  imports: [CopyToClipboard, PlayerChip],
  selector: 'app-lobby',
  styleUrl: './lobby.scss',
  templateUrl: './lobby.html',
})
export class Lobby {
  private readonly toast = inject(ToastService);

  readonly role = input.required<PlayerRole>();
  readonly code = input.required<string>();
  readonly players = input.required<PublicPlayer[]>();
  readonly hostSocketId = input.required<string>();
  /** Quiz de la sala; solo se muestra al host */
  readonly quiz = input<Quiz | null>(null);

  readonly start = output<void>();
  /** El host quiere elegir otro quiz (lo abre el shell) */
  readonly changeQuiz = output<void>();

  protected readonly connectedCount = computed(() => this.players().filter(p => p.isConnected).length);

  protected readonly quizMeta = computed(() => {
    const n = this.quiz()?.questions.length ?? 0;
    return `${n} ${n === 1 ? 'pregunta' : 'preguntas'}`;
  });

  // "482190" -> "482 190"
  protected readonly formattedCode = computed(() => {
    const c = this.code();
    return c.length === 6 ? `${c.slice(0, 3)} ${c.slice(3)}` : c;
  });

  protected onCopied(ok: boolean): void {
    if (ok) this.toast.success('Código de sala copiado');
    else this.toast.error('No se pudo copiar el código');
  }
}