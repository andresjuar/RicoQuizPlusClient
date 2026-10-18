import { Component, computed, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatchHistoryItem } from '../../models/match.model';

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

@Component({
  imports: [DatePipe, DecimalPipe],
  selector: 'app-match-row',
  templateUrl: './match-row.html',
  styleUrl: './match-row.scss',
})
export class MatchRow {
  readonly match = input.required<MatchHistoryItem>();
  protected readonly medal = computed(() => MEDALS[this.match().rank] ?? `#${this.match().rank}`);
}