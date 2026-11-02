import { Component, input, output } from '@angular/core';

/** Paginador "Anterior / Página X de Y / Siguiente". No pide datos: solo avisa a qué página ir. */
@Component({
  selector: 'app-paginator',
  templateUrl: './paginator.html',
  styleUrl: './paginator.scss',
})
export class Paginator {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();
}