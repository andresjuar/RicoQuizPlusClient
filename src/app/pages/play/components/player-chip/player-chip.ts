import { Component, input } from '@angular/core';
import { PublicPlayer } from '../../../../shared/models/game.model';
import { Avatar } from '../../../../shared/components/avatar/avatar';

@Component({
  imports: [Avatar],
  selector: 'app-player-chip',
  styleUrl: './player-chip.scss',
  templateUrl: './player-chip.html',
})
export class PlayerChip {
  readonly player = input.required<PublicPlayer>();
  /** Marca al anfitrión con borde amarillo y corona */
  readonly isHost = input(false);
}