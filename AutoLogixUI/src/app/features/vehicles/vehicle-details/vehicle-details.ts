import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { VehiclesApi } from '../../../core/vehicles/vehicles-api';
import { ServicesApi } from '../../../core/vehicles/services-api';

import { VehicleDetails } from '../../../core/models/vehicle.model';
import { ServiceEntryListItem } from '../../../core/models/service.model';

import { OfferRequestsApi } from '../../../core/offers/offer-requests-api';
import { OffersApi } from '../../../core/offers/offers-api';
import { OfferRequest } from '../../../core/models/offer-request.model';
import { Offer } from '../../../core/models/offer.model';

import { AuthStore } from '../../../core/auth/auth.store';

type AppRole = 'User' | 'Insurer' | 'Service' | 'Admin';

@Component({
  selector: 'app-vehicle-details',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule],
  templateUrl: './vehicle-details.html',
  styleUrl: './vehicle-details.scss',
})
export class VehicleDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly auth = inject(AuthStore);

  private readonly api = inject(VehiclesApi);
  private readonly servicesApi = inject(ServicesApi);

  private readonly offerRequestsApi = inject(OfferRequestsApi);
  private readonly offersApi = inject(OffersApi);

  // ===== ROLE =====
  role = computed<AppRole | null>(() => this.getRoleFromToken());

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

  isUserOrAdmin() {
    // Ubezpieczenia/oferty: user (domyślnie) + admin
    return this.role() === 'User' || this.role() === 'Admin' || this.role() == null;
  }

  // ===== SERVICES =====
  servicesLoading = signal(false);
  servicesError = signal<string | null>(null);
  services = signal<ServiceEntryListItem[]>([]);
  servicesPage = signal(1);
  servicesPageSize = 10;
  servicesTotal = signal(0);

  // ===== VEHICLE =====
  loading = signal(true);
  error = signal<string | null>(null);
  vehicle = signal<VehicleDetails | null>(null);

  vehicleId = computed(() => this.route.snapshot.paramMap.get('id'));

  // ===== OFFERS (tylko info do UI) =====
  hasOpenRequestForVehicle = signal(false);
  openRequestIdForVehicle = signal<string | null>(null);

  hasProposedOffersForVehicle = signal(false);
  proposedOffersCountForVehicle = signal(0);

  // ===== reguły 14 dni (dla user/admin) =====
  canRequestOcNow = computed(() => {
    if (!this.isUserOrAdmin()) return false;

    const v = this.vehicle();
    if (!v || !v.allowInsuranceOffers) return false;
    return this.isRenewWindow(v.insuranceOcDueDate);
  });

  canRequestAcNow = computed(() => {
    if (!this.isUserOrAdmin()) return false;

    const v = this.vehicle();
    if (!v || !v.allowInsuranceOffers) return false;
    return this.isRenewWindow(v.insuranceAcDueDate);
  });

  canRequestOcAcNow = computed(() => this.canRequestOcNow() && this.canRequestAcNow());

  canRequestAnythingNow = computed(() => this.canRequestOcNow() || this.canRequestAcNow());

  constructor() {
    const id = this.vehicleId();
    if (!id) {
      this.error.set('Brak ID pojazdu w adresie.');
      this.loading.set(false);
      return;
    }

    this.api.getVehicleById(id).subscribe({
      next: (v) => {
        this.vehicle.set(v);

        // serwisy zawsze ładujemy (user ma read-only)
        this.loadServices(1);

        // stan ofert ma sens tylko dla user/admin
        if (this.isUserOrAdmin()) {
          this.loadOfferStateForVehicle(v.id);
        }

        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się pobrać danych pojazdu.');
        this.loading.set(false);
      },
    });
  }

  private normalizeId(id: string | null | undefined): string {
    return (id ?? '').trim().toLowerCase();
  }

  private loadOfferStateForVehicle(vehicleId: string) {
    const vid = this.normalizeId(vehicleId);

    // 1) Open requests
    this.offerRequestsApi.getMyRequests('Open').subscribe({
      next: (reqs) => {
        const found = (reqs ?? []).find((r: OfferRequest) => this.normalizeId(r.vehicleId) === vid);
        this.hasOpenRequestForVehicle.set(!!found);
        this.openRequestIdForVehicle.set(found?.id ?? null);
      },
      error: () => {
        this.hasOpenRequestForVehicle.set(false);
        this.openRequestIdForVehicle.set(null);
      },
    });

    // 2) Proposed offers
    this.offersApi.getMyOffers('Proposed').subscribe({
      next: (offers) => {
        const list = (offers ?? []).filter(
          (o: Offer) => this.normalizeId((o as any).vehicleId) === vid
        );

        this.proposedOffersCountForVehicle.set(list.length);
        this.hasProposedOffersForVehicle.set(list.length > 0);
      },
      error: () => {
        this.proposedOffersCountForVehicle.set(0);
        this.hasProposedOffersForVehicle.set(false);
      },
    });
  }

  loadServices(page = 1) {
    const id = this.vehicleId();
    if (!id) return;

    this.servicesLoading.set(true);
    this.servicesError.set(null);

    this.servicesApi.getServices(id, page, this.servicesPageSize).subscribe({
      next: (res) => {
        const sorted = [...res.items].sort((a, b) =>
          (b.serviceDate ?? '').localeCompare(a.serviceDate ?? '')
        );

        this.services.set(sorted);
        this.servicesTotal.set(res.totalCount);
        this.servicesPage.set(res.page);

        this.servicesLoading.set(false);
      },
      error: () => {
        this.servicesError.set('Nie udało się pobrać historii serwisowej.');
        this.servicesLoading.set(false);
      },
    });
  }

  onDelete() {
    const id = this.vehicleId();
    if (!id) return;

    const ok = confirm('Na pewno usunąć pojazd? Tej operacji nie da się cofnąć.');
    if (!ok) return;

    this.loading.set(true);
    this.error.set(null);

    this.api.deleteVehicle(id).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/app/vehicles');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Nie udało się usunąć pojazdu.');
      },
    });
  }

  // user/admin: request offer
  goRequestOffer() {
    if (!this.isUserOrAdmin()) return;

    const v = this.vehicle();
    if (!v) return;

    if (!v.allowInsuranceOffers) return;
    if (!this.canRequestAnythingNow()) return;

    this.router.navigate(['/app/offer-requests/new'], {
      queryParams: { vehicleId: v.id },
    });
  }

  // ===== Date helpers =====
  formatDate(value?: string | null) {
    if (!value) return '—';
    return value.length >= 10 ? value.slice(0, 10) : value;
  }

  daysLeft(value: string) {
    const d = new Date(value);
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }

  /** true: brak polisy albo <=14 dni do końca */
  private isRenewWindow(dateIso?: string | null) {
    if (!dateIso) return true;
    const left = this.daysLeft(dateIso);
    return left <= 14;
  }

  availableTypesText() {
    if (!this.isUserOrAdmin()) return '—';

    const parts: string[] = [];
    if (this.canRequestOcNow()) parts.push('OC');
    if (this.canRequestAcNow()) parts.push('AC');
    if (this.canRequestOcAcNow()) parts.push('OC + AC');
    return parts.length ? parts.join(', ') : '—';
  }

  whyCantRequestText() {
    if (!this.isUserOrAdmin()) return '';

    const v = this.vehicle();
    if (!v) return '';

    if (!v.allowInsuranceOffers) {
      return 'Zgoda na oferty jest wyłączona — włącz ją w edycji pojazdu.';
    }

    const ocLeft = v.insuranceOcDueDate ? this.daysLeft(v.insuranceOcDueDate) : null;
    const acLeft = v.insuranceAcDueDate ? this.daysLeft(v.insuranceAcDueDate) : null;

    const ocOk = this.canRequestOcNow();
    const acOk = this.canRequestAcNow();

    if (!ocOk && !acOk) {
      const ocMsg = ocLeft != null ? `OC ważne jeszcze ${ocLeft} dni` : 'brak danych OC';
      const acMsg = acLeft != null ? `AC ważne jeszcze ${acLeft} dni` : 'brak danych AC';

      return `Nie możesz teraz wysłać prośby: ${ocMsg}, ${acMsg}. Odnowienie dopiero w oknie ≤ 14 dni przed końcem.`;
    }

    return '';
  }
}
