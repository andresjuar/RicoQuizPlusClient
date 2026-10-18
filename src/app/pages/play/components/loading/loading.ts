import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  styleUrl: './loading.scss',
  templateUrl: './loading.html',
})
export class Loading {
  readonly message = input('Preparando la partida…');
}