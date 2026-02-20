import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ServiceEntryListItem } from '../../../core/models/service.model';
import { InsurerApi } from '../../../core/insurer/insurer-api';
import { InsurerVehicleDetails } from '../../../core/models/insurance.model';

@Component({
  selector: 'app-insurer-vehicle-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './insurer-vehicle-details.html',
  styleUrl: './insurer-vehicle-details.scss',
})
export class InsurerVehicleDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(InsurerApi);

  loading = signal(true);
  error = signal<string | null>(null);

  vehicle = signal<InsurerVehicleDetails | null>(null);

  servicesLoading = signal(false);
  servicesError = signal<string | null>(null);
  services = signal<ServiceEntryListItem[]>([]);

  page = signal(1);
  pageSize = 10;
  total = signal(0);

  vehicleId = computed(() => this.route.snapshot.paramMap.get('id'));

  constructor() {
    const id = this.vehicleId();
    if (!id) {
      this.error.set('Brak ID pojazdu w adresie.');
      this.loading.set(false);
      return;
    }

    this.api.getVehicleDetails(id).subscribe({
      next: (v) => {
        this.vehicle.set(v);
        this.loadServices(1);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się pobrać danych pojazdu (Insurer).');
        this.loading.set(false);
      },
    });
  }

  loadServices(page = 1) {
    const id = this.vehicleId();
    if (!id) return;

    this.servicesLoading.set(true);
    this.servicesError.set(null);

    this.api.getVehicleServices(id, page, this.pageSize).subscribe({
      next: (res) => {
        const sorted = [...(res.items ?? [])].sort((a, b) =>
          (b.serviceDate ?? '').localeCompare(a.serviceDate ?? '')
        );

        this.services.set(sorted);
        this.total.set(res.totalCount ?? 0);
        this.page.set(res.page ?? page);

        this.servicesLoading.set(false);
      },
      error: () => {
        this.servicesError.set('Nie udało się pobrać historii serwisowej (Insurer).');
        this.servicesLoading.set(false);
      },
    });
  }

  // proste formatowanie dat ISO -> YYYY-MM-DD
  asDate(value?: string | null) {
    return value ? value.slice(0, 10) : '—';
  }
}
