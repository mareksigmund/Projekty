import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { InsurerApi } from '../../../core/insurer/insurer-api';
import {
  InsuranceOffer,
  InsurerVehicleDetails,
  OfferStatus,
} from '../../../core/models/insurance.model';

@Component({
  selector: 'app-insurer-offers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './insurer-offers.html',
  styleUrl: './insurer-offers.scss',
})
export class InsurerOffers {
  private readonly api = inject(InsurerApi);
  private readonly insurerVehiclesApi = inject(InsurerApi);
  private readonly route = inject(ActivatedRoute);

  loading = signal(true);
  error = signal<string | null>(null);

  status = signal<OfferStatus | 'ALL'>('Proposed');
  items = signal<InsuranceOffer[]>([]);

  // filtr z URL: /app/insurer/offers?offerRequestId=...
  offerRequestIdFilter = signal<string | null>(
    this.route.snapshot.queryParamMap.get('offerRequestId')
  );

  // mapka: vehicleId -> "Brand Model (REG)"
  vehicleLabelMap = signal<Record<string, string>>({});

  constructor() {
    this.load();
  }

  // --- helpers

  private normalizeId(id: string | null | undefined) {
    return (id ?? '').trim().toLowerCase();
  }

  private shortGuid(id: string) {
    if (!id) return '—';
    return `${id.slice(0, 8)}…${id.slice(-5)}`;
  }

  private buildVehicleLabel(v: InsurerVehicleDetails) {
    const reg = v.registrationNumber ? ` (${v.registrationNumber})` : '';
    return `${v.brand} ${v.model}${reg}`;
  }

  vehicleLabelById(vehicleId: string) {
    const key = this.normalizeId(vehicleId);
    return this.vehicleLabelMap()[key] ?? this.shortGuid(vehicleId);
  }

  // proste formatowanie daty ISO -> YYYY-MM-DD
  asDate(value?: string | null) {
    return value ? value.slice(0, 10) : '—';
  }

  statusBadgeText(s: string) {
    return s;
  }

  clearRequestFilter() {
    this.offerRequestIdFilter.set(null);
    this.load();
  }

  setStatus(value: OfferStatus | 'ALL') {
    this.status.set(value);
    this.load();
  }

  // --- core logic

  private sortNewest(list: InsuranceOffer[]) {
    return [...list].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }

  private applyOfferRequestFilter(list: InsuranceOffer[]) {
    const filterId = (this.offerRequestIdFilter() ?? '').trim().toLowerCase();
    if (!filterId) return list;

    return list.filter((o) => (o.offerRequestId ?? '').trim().toLowerCase() === filterId);
  }

  private buildVehicleLabelsForOffers(offers: InsuranceOffer[]) {
    // unikalne vehicleId
    const uniqueIds = Array.from(new Set((offers ?? []).map((o) => o.vehicleId).filter(Boolean)));

    if (uniqueIds.length === 0) {
      this.vehicleLabelMap.set({});
      return;
    }

    const requests = uniqueIds.map((id) =>
      this.insurerVehiclesApi.getVehicleById(id).pipe(
        catchError(() => of(null)) // jeśli nie uda się pobrać jednego – nie wywalaj całej listy
      )
    );

    forkJoin(requests).subscribe({
      next: (vehicles) => {
        const map: Record<string, string> = {};
        for (const v of vehicles) {
          if (!v) continue;
          map[this.normalizeId(v.id)] = this.buildVehicleLabel(v);
        }
        this.vehicleLabelMap.set(map);
      },
      error: () => {
        // w razie czego zostaw fallback GUID
        this.vehicleLabelMap.set({});
      },
    });
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    const s = this.status();

    // ✅ ALL = 4 requesty + scalanie (backend nie obsługuje ALL)
    if (s === 'ALL') {
      forkJoin([
        this.api.getMyOffers('Proposed'),
        this.api.getMyOffers('Accepted'),
        this.api.getMyOffers('Rejected'),
        this.api.getMyOffers('Expired'),
      ]).subscribe({
        next: (lists) => {
          // scala + uniq po id
          const map = new Map<string, InsuranceOffer>();
          for (const list of lists) {
            for (const o of list ?? []) map.set(o.id, o);
          }

          let merged = Array.from(map.values());
          merged = this.applyOfferRequestFilter(merged);
          merged = this.sortNewest(merged);

          this.items.set(merged);
          this.buildVehicleLabelsForOffers(merged);

          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
          this.error.set(this.formatError(err));
        },
      });

      return;
    }

    // zwykły status
    this.api.getMyOffers(s).subscribe({
      next: (res) => {
        let list = [...(res ?? [])];
        list = this.applyOfferRequestFilter(list);
        list = this.sortNewest(list);

        this.items.set(list);
        this.buildVehicleLabelsForOffers(list);

        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.error.set(this.formatError(err));
      },
    });
  }

  private formatError(err: any) {
    if (err?.status === 403) return '403: Brak uprawnień. Ten widok wymaga roli Insurer.';
    if (err?.status === 401) return '401: Brak autoryzacji. Zaloguj się ponownie.';
    return 'Nie udało się pobrać ofert (Insurer).';
  }
}
