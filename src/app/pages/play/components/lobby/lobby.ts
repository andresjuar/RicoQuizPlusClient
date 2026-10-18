import { Component, computed, inject, input, output } from '@angular/core';
import { PlayerRole, PublicPlayer } from '../../../../shared/models/game.model';
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

  readonly start = output<void>();

  protected readonly connectedCount = computed(() => this.players().filter(p => p.isConnected).length);

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