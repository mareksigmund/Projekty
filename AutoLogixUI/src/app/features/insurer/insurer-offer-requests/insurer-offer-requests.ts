import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { InsurerApi } from '../../../core/insurer/insurer-api';
import { OfferRequestStatus } from '../../../core/models/offer-request.model';
import { InsurerOfferRequest } from '../../../core/models/insurer-offer-request.model';

@Component({
  selector: 'app-insurer-offer-requests',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './insurer-offer-requests.html',
  styleUrl: './insurer-offer-requests.scss',
})
export class InsurerOfferRequests {
  private readonly api = inject(InsurerApi);

  loading = signal(true);
  error = signal<string | null>(null);

  status = signal<OfferRequestStatus | 'ALL'>('Open');
  items = signal<InsurerOfferRequest[]>([]);

  constructor() {
    this.load();
  }

  private sortNewest(list: InsurerOfferRequest[]) {
    return [...list].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }

  private mergeUniqueById(lists: InsurerOfferRequest[][]) {
    const map = new Map<string, InsurerOfferRequest>();
    for (const list of lists) {
      for (const r of list ?? []) map.set(r.id, r);
    }
    return this.sortNewest(Array.from(map.values()));
  }

  private shortGuid(id: string) {
    if (!id) return '—';
    return `${id.slice(0, 8)}…${id.slice(-5)}`;
  }

  vehicleLabel(r: InsurerOfferRequest) {
    const brand = (r.vehicleBrand ?? '').trim();
    const model = (r.vehicleModel ?? '').trim();
    const reg = (r.vehicleRegistrationNumber ?? '').trim();

    if (brand && model) return `${brand} ${model}${reg ? ` (${reg})` : ''}`;
    return this.shortGuid(r.vehicleId);
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    const s = this.status();

    // ✅ ALL = 3 równoległe zapytania + scalanie
    if (s === 'ALL') {
      forkJoin([
        this.api.getOfferRequests('Open'),
        this.api.getOfferRequests('Fulfilled'),
        this.api.getOfferRequests('Cancelled'),
      ]).subscribe({
        next: (lists) => {
          this.items.set(this.mergeUniqueById(lists));
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
          this.error.set(this.formatError(err, 'Nie udało się pobrać próśb (insurer).'));
        },
      });

      return;
    }

    this.api.getOfferRequests(s).subscribe({
      next: (res) => {
        this.items.set(this.sortNewest(res ?? []));
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.error.set(this.formatError(err, 'Nie udało się pobrać próśb (insurer).'));
      },
    });
  }

  setStatus(value: OfferRequestStatus | 'ALL') {
    this.status.set(value);
    this.load();
  }

  private formatError(err: any, fallback: string) {
    if (err?.status === 403) return '403: Brak uprawnień. Ten widok wymaga roli Insurer.';
    if (err?.status === 401) return '401: Brak autoryzacji. Zaloguj się ponownie.';
    return fallback;
  }
}
