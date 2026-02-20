import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OffersApi } from '../../../core/offers/offers-api';
import { VehiclesApi } from '../../../core/vehicles/vehicles-api';
import { Offer, OfferStatus } from '../../../core/models/offer.model';
import { VehicleListItem } from '../../../core/models/vehicle.model';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './offers.html',
  styleUrl: './offers.scss',
})
export class Offers {
  private readonly api = inject(OffersApi);
  private readonly vehiclesApi = inject(VehiclesApi);
  private readonly router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  status = signal<OfferStatus | 'ALL'>('Proposed');
  items = signal<Offer[]>([]);

  // vehicleId(normalized) -> label
  vehicleLabelMap = signal<Record<string, string>>({});

  constructor() {
    this.loadAllVehiclesForLabels();
    this.load();
  }

  private normalizeId(id: string | null | undefined): string {
    return (id ?? '').trim().toLowerCase();
  }

  private formatVehicleLabel(v: VehicleListItem) {
    const reg = v.registrationNumber ? ` (${v.registrationNumber})` : '';
    return `${v.brand} ${v.model}${reg}`;
  }

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

          const loaded = page * pageSize;
          if (loaded < res.totalCount) {
            page++;
            loadPage();
            return;
          }

          this.vehicleLabelMap.set(map);
        },
        error: () => this.vehicleLabelMap.set({}),
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
    const statusParam = s === 'ALL' ? undefined : (s as OfferStatus);

    this.api.getMyOffers(statusParam).subscribe({
      next: (res) => {
        // proposed na górze, potem po validTo (opcjonalnie)
        const sorted = [...res].sort((a, b) =>
          (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
        );
        this.items.set(sorted);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się pobrać ofert.');
        this.loading.set(false);
      },
    });
  }

  setStatus(value: OfferStatus | 'ALL') {
    this.status.set(value);
    this.load();
  }

  canDecide(o: Offer) {
    return o.status === 'Proposed';
  }

  onAccept(o: Offer) {
    if (!this.canDecide(o)) return;

    const ok = confirm('Akceptować ofertę?');
    if (!ok) return;

    this.loading.set(true);
    this.api.accept(o.id).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/app/dashboard');
      },
      error: () => {
        this.error.set('Nie udało się zaakceptować oferty.');
        this.loading.set(false);
      },
    });
  }

  onReject(o: Offer) {
    if (!this.canDecide(o)) return;

    const ok = confirm('Odrzucić ofertę?');
    if (!ok) return;

    this.loading.set(true);
    this.api.reject(o.id).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/app/dashboard');
      },
      error: () => {
        this.error.set('Nie udało się odrzucić oferty.');
        this.loading.set(false);
      },
    });
  }
}
