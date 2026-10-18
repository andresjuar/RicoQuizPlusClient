import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HistoryService } from '../../shared/services/history.service';
import { MatchRow } from '../../shared/components/match-row/match-row';

type Filter = 'all' | 'wins' | 'podium';
type Sort = 'recent' | 'score';

@Component({
  imports: [RouterLink, DecimalPipe, MatchRow],
  selector: 'app-history',
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History {
  private readonly historyService = inject(HistoryService);

  private readonly matches = toSignal(this.historyService.getMine());
  protected readonly loading = computed(() => this.matches() === undefined);

  protected readonly filter = signal<Filter>('all');
  protected readonly sort = signal<Sort>('recent');

  protected readonly filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'wins', label: '🏆 Victorias' },
    { id: 'podium', label: '🥉 Podio' },
  ];

  protected readonly summary = computed(() => {
    const list = this.matches() ?? [];
    const played = list.length;
    return {
      played,
      wins: list.filter(m => m.rank === 1).length,
      podiums: list.filter(m => m.rank <= 3).length,
      avgRank: played ? list.reduce((sum, m) => sum + m.rank, 0) / played : 0,
    };
  });

  protected readonly visible = computed(() => {
    const f = this.filter();
    const list = (this.matches() ?? []).filter(
      m => f === 'all' || (f === 'wins' ? m.rank === 1 : m.rank <= 3),
    );
    return [...list].sort((a, b) =>
      this.sort() === 'score' ? b.score - a.score : b.playedAt.localeCompare(a.playedAt),
    );
  });
}
