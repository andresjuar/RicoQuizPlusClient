import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HistoryService } from '../../shared/services/history.service';
import { MatchRow } from '../../shared/components/match-row/match-row';
import { ViewState } from '../../shared/components/view-state/view-state';

type Filter = 'all' | 'wins' | 'podium';
type Sort = 'recent' | 'score';

@Component({
  imports: [RouterLink, DecimalPipe, MatchRow, ViewState],
  selector: 'app-history',
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History {
  private readonly historyService = inject(HistoryService);

  // rxResource da isLoading(), error(), value() y reload() para <app-view-state>
  protected readonly history = rxResource({ stream: () => this.historyService.getMine() });

  // value() lanza si el resource está en error: por eso se pregunta hasValue() primero
  private readonly matches = computed(() => (this.history.hasValue() ? this.history.value() : []));

  protected readonly filter = signal<Filter>('all');
  protected readonly sort = signal<Sort>('recent');

  protected readonly filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'wins', label: '🏆 Victorias' },
    { id: 'podium', label: '🥉 Podio' },
  ];

  protected readonly summary = computed(() => {
    const list = this.matches();
    const played = list.length;
    return {
      played,
      wins: list.filter(m => m.rank === 1).length,
      podiums: list.filter(m => m.rank <= 3).length,
      avgRank: played ? list.reduce((sum, m) => sum + m.rank, 0) / played : 0,
    };
  });

  // Los filtros y el orden siguen siendo en memoria sobre las partidas ya cargadas
  protected readonly visible = computed(() => {
    const f = this.filter();
    const list = this.matches().filter(m => f === 'all' || (f === 'wins' ? m.rank === 1 : m.rank <= 3));
    return [...list].sort((a, b) =>
      this.sort() === 'score' ? b.score - a.score : b.playedAt.localeCompare(a.playedAt),
    );
  });
}