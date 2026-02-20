import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { OfferRequestsApi } from '../../../core/offers/offer-requests-api';
import { VehiclesApi } from '../../../core/vehicles/vehicles-api';

import { OfferRequest, OfferRequestStatus } from '../../../core/models/offer-request.model';
import { VehicleListItem } from '../../../core/models/vehicle.model';

@Component({
  selector: 'app-offer-requests',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './offer-requests.html',
  styleUrl: './offer-requests.scss',
})
export class OfferRequests {
  private readonly api = inject(OfferRequestsApi);
  private readonly vehiclesApi = inject(VehiclesApi);

  loading = signal(false);
  error = signal<string | null>(null);

  status = signal<OfferRequestStatus | 'ALL'>('Open');
  items = signal<OfferRequest[]>([]);

  // vehicleId(normalized) -> label
  vehicleLabelMap = signal<Record<string, string>>({});

  constructor() {
    // kolejność bez znaczenia, ale oba ładujemy na start
    this.loadAllVehiclesForLabels(); // ✅ ważne: pobieramy wszystkie strony
    this.load();
  }

  /** Normalizacja klucza: ucina spacje i robi lowercase, żeby trafić w mapkę */
  private normalizeId(id: string | null | undefined): string {
    return (id ?? '').trim().toLowerCase();
  }

  private formatVehicleLabel(v: VehicleListItem) {
    const reg = v.registrationNumber ? ` (${v.registrationNumber})` : '';
    return `${v.brand} ${v.model}${reg}`;
  }

  /** ✅ pobiera pojazdy stronami aż do końca */
  private loadAllVehiclesForLabels() {
    const pageSize = 100;
    let page = 1;

    const map: Record<string, string> = {};

    const loadPage = () => {
      this.vehiclesApi.getVehicles(page, pageSize).subscribe({
        next: (res) => {
          for (const v of res.items) {
            map[this.normalizeId(v.id)] = this.formatVehicleLabel(v);
          }

          // jeśli mamy kolejną stronę -> ładuj dalej
          const loaded = page * pageSize;
          if (loaded < res.totalCount) {
            page++;
            loadPage();
            return;
          }

          // koniec – ustaw mapę
          this.vehicleLabelMap.set(map);
        },
        error: () => {
          // fallback – zostaje pusta mapa
          this.vehicleLabelMap.set({});
        },
      });
    };

    loadPage();
  }

  vehicleLabel(vehicleId: string) {
    const key = this.normalizeId(vehicleId);
    return this.vehicleLabelMap()[key] ?? this.shortGuid(vehicleId);
  }

  private shortGuid(id: string) {
    if (!id) return '—';
    return `${id.slice(0, 8)}…${id.slice(-5)}`;
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    const s = this.status();
    const statusParam = s === 'ALL' ? undefined : (s as OfferRequestStatus);

    this.api.getMyRequests(statusParam).subscribe({
      next: (res) => {
        this.items.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się pobrać próśb o ofertę.');
        this.loading.set(false);
      },
    });
  }

  setStatus(value: OfferRequestStatus | 'ALL') {
    this.status.set(value);
    this.load();
  }

  onCancel(r: OfferRequest) {
    if (r.status !== 'Open') return;

    const ok = confirm('Anulować prośbę o ofertę?');
    if (!ok) return;

    this.loading.set(true);

    this.api.cancel(r.id).subscribe({
      next: () => this.load(),
      error: () => {
        this.error.set('Nie udało się anulować prośby.');
        this.loading.set(false);
      },
    });
  }
}
