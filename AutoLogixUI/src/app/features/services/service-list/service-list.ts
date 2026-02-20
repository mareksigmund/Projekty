import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { ServicesApi } from '../../../core/vehicles/services-api';
import { AuthStore } from '../../../core/auth/auth.store';
import { ServiceEntryListItem } from '../../../core/models/service.model';
import {
  ServiceVehiclesApi,
  ServiceVehicleDetails,
} from '../../../core/vehicles/service-vehicles-api';

type AppRole = 'User' | 'Insurer' | 'Service' | 'Admin';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule],
  templateUrl: './service-list.html',
  styleUrl: './service-list.scss',
})
export class ServiceList {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ServicesApi);
  private readonly auth = inject(AuthStore);

  private readonly serviceVehiclesApi = inject(ServiceVehiclesApi);

  loading = signal(true);
  error = signal<string | null>(null);

  items = signal<ServiceEntryListItem[]>([]);
  page = signal(1);
  pageSize = 10;
  total = signal(0);

  vehicleId = computed(() => this.route.snapshot.paramMap.get('vehicleId'));

  vehicleHeaderLoading = signal(false);
  vehicleHeader = signal<ServiceVehicleDetails | null>(null);

  role = computed<AppRole | null>(() => this.getRoleFromToken());

  constructor() {
    const vid = this.vehicleId();
    if (!vid) {
      this.error.set('Brak vehicleId w adresie.');
      this.loading.set(false);
      return;
    }

    this.loadVehicleHeader(vid);
    this.load(1);
  }

  private getRoleFromToken(): AppRole | null {
    const token = this.auth.token;
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const claim =
        payload?.role ??
        payload?.roles ??
        payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
        null;

      const roles: string[] = Array.isArray(claim) ? claim : claim ? [String(claim)] : [];

      if (roles.includes('Admin')) return 'Admin';
      if (roles.includes('Service')) return 'Service';
      if (roles.includes('Insurer')) return 'Insurer';
      if (roles.includes('User')) return 'User';
      return null;
    } catch {
      return null;
    }
  }

  isServiceOrAdmin() {
    return this.role() === 'Service' || this.role() === 'Admin';
  }

  private formatVehicleLabel(v: ServiceVehicleDetails) {
    const reg = v.registrationNumber ? ` (${v.registrationNumber})` : '';
    const year = v.year != null ? ` • ${v.year}` : '';
    const main = [v.brand, v.model].filter(Boolean).join(' ');
    return main ? `${main}${reg}${year}` : v.id;
  }

  vehicleLabel() {
    const v = this.vehicleHeader();
    return v ? this.formatVehicleLabel(v) : this.vehicleId() ?? '—';
  }

  private loadVehicleHeader(vehicleId: string) {
    this.vehicleHeaderLoading.set(true);
    this.serviceVehiclesApi.getById(vehicleId).subscribe({
      next: (v) => {
        this.vehicleHeader.set(v);
        this.vehicleHeaderLoading.set(false);
      },
      error: () => {
        // fallback: zostaje ID
        this.vehicleHeader.set(null);
        this.vehicleHeaderLoading.set(false);
      },
    });
  }

  load(page = 1) {
    const vid = this.vehicleId();
    if (!vid) return;

    this.loading.set(true);
    this.error.set(null);

    this.api.getServices(vid, page, this.pageSize).subscribe({
      next: (res) => {
        const sorted = [...(res.items ?? [])].sort((a, b) =>
          (b.serviceDate ?? '').localeCompare(a.serviceDate ?? '')
        );
        this.items.set(sorted);
        this.total.set(res.totalCount ?? 0);
        this.page.set(res.page ?? page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się pobrać wpisów serwisowych.');
        this.loading.set(false);
      },
    });
  }

  totalPages() {
    const t = this.total();
    return t <= 0 ? 1 : Math.max(1, Math.ceil(t / this.pageSize));
  }

  prev() {
    if (this.page() <= 1) return;
    this.load(this.page() - 1);
  }

  next() {
    if (this.page() >= this.totalPages()) return;
    this.load(this.page() + 1);
  }

  formatDate(value?: string | null) {
    if (!value) return '—';
    return value.length >= 10 ? value.slice(0, 10) : value;
  }

  goNew() {
    const vid = this.vehicleId();
    if (!vid) return;
    this.router.navigate(['/app/vehicles', vid, 'services', 'new']);
  }

  goEdit(id: string) {
    const vid = this.vehicleId();
    if (!vid) return;
    this.router.navigate(['/app/vehicles', vid, 'services', id, 'edit']);
  }

  onDelete(id: string) {
    const vid = this.vehicleId();
    if (!vid) return;

    const ok = confirm('Usunąć wpis serwisowy?');
    if (!ok) return;

    this.loading.set(true);
    this.api.deleteService(vid, id).subscribe({
      next: () => this.load(this.page()),
      error: () => {
        this.error.set('Nie udało się usunąć wpisu.');
        this.loading.set(false);
      },
    });
  }
}
