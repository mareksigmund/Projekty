import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthStore } from '../../../core/auth/auth.store';

// USER api
import { VehiclesApi } from '../../../core/vehicles/vehicles-api';
import { InsuranceApi } from '../../../core/insurance/insurance-api';
import { OfferRequestsApi } from '../../../core/offers/offer-requests-api';
import { OffersApi } from '../../../core/offers/offers-api';

// INSURER api
import { InsurerApi } from '../../../core/insurer/insurer-api';
import { InsurerVehiclesApi } from '../../../core/insurance/insurer-vehicles-api';

// SERVICE api
import { ServiceVehiclesApi } from '../../../core/vehicles/service-vehicles-api';

import { VehicleListItem } from '../../../core/models/vehicle.model';
import {
  InsuranceExpiringVehicle,
  InsuranceTypeFilter,
} from '../../../core/models/insurance.model';
import { OfferRequest, OfferRequestStatus } from '../../../core/models/offer-request.model';
import { Offer } from '../../../core/models/offer.model';
import { InsurerOfferRequest } from '../../../core/models/insurer-offer-request.model';
import { InsuranceOffer } from '../../../core/models/insurance.model';
import { ServiceVehicleListItem } from '../../../core/models/service-vehicle.model';

type AppRole = 'User' | 'Insurer' | 'Service' | 'Admin';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  // USER api
  private readonly vehiclesApi = inject(VehiclesApi);
  private readonly insuranceApi = inject(InsuranceApi);
  private readonly offerRequestsApi = inject(OfferRequestsApi);
  private readonly offersApi = inject(OffersApi);

  // INSURER api
  private readonly insurerApi = inject(InsurerApi);
  private readonly insurerVehiclesApi = inject(InsurerVehiclesApi);

  // SERVICE api
  private readonly serviceVehiclesApi = inject(ServiceVehiclesApi);

  loading = signal(true);
  error = signal<string | null>(null);

  // rola (czytamy z tokenu)
  role = signal<AppRole | null>(null);

  // ustawienia (wspólne)
  days = signal(30);
  type = signal<InsuranceTypeFilter>('ANY');

  // ===== USER dane =====
  vehicles = signal<VehicleListItem[]>([]);
  expiring = signal<InsuranceExpiringVehicle[]>([]);
  openRequests = signal<OfferRequest[]>([]);
  proposedOffers = signal<Offer[]>([]);
  vehicleLabelMap = signal<Record<string, string>>({});

  // ===== INSURER dane =====
  insurerExpiring = signal<InsuranceExpiringVehicle[]>([]);
  insurerOpenRequests = signal<InsurerOfferRequest[]>([]);
  insurerMyOffers = signal<InsuranceOffer[]>([]);

  // ===== SERVICE dane (wyszukiwarka) =====
  serviceQuery = signal<string>('');
  serviceLoading = signal(false);
  serviceError = signal<string | null>(null);
  serviceItems = signal<ServiceVehicleListItem[]>([]);
  servicePage = signal(1);
  servicePageSize = 10;
  serviceTotal = signal(0);

  // ===== SERVICE dane (domyślne "ostatnie") =====
  serviceRecentLoading = signal(false);
  serviceRecentError = signal<string | null>(null);
  serviceRecent = signal<ServiceVehicleListItem[]>([]);

  // ===== computed staty =====
  vehiclesCount = computed(() => this.vehicles().length);
  expiringCount = computed(() => this.expiring().length);
  openRequestsCount = computed(() => this.openRequests().length);
  proposedOffersCount = computed(() => this.proposedOffers().length);

  insurerExpiringCount = computed(() => this.insurerExpiring().length);
  insurerOpenRequestsCount = computed(() => this.insurerOpenRequests().length);
  insurerMyOffersCount = computed(() => this.insurerMyOffers().length);

  // ===== service computed =====
  serviceHasResults = computed(() => this.serviceItems().length > 0);
  serviceTotalPages = computed(() => {
    const total = this.serviceTotal();
    return total <= 0 ? 1 : Math.max(1, Math.ceil(total / this.servicePageSize));
  });

  // czy pokazujemy panel "ostatnie"?
  showServiceRecent = computed(() => this.serviceQuery().trim().length < 2);

  constructor() {
    this.authStore.token$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.role.set(this.getRoleFromToken());
      this.reload();
    });

    this.role.set(this.getRoleFromToken());
    this.reload();
  }

  private getRoleFromToken(): AppRole | null {
    const token = this.authStore.token;
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      const claim =
        payload?.role ??
        payload?.roles ??
        payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
        null;

      const roles: string[] = Array.isArray(claim) ? claim : claim ? [String(claim)] : [];

      if (roles.includes('User')) return 'User';
      if (roles.includes('Insurer')) return 'Insurer';
      if (roles.includes('Service')) return 'Service';
      if (roles.includes('Admin')) return 'Admin';

      return null;
    } catch {
      return null;
    }
  }

  // ========= label helpers =========
  private normalizeId(id: string | null | undefined) {
    return (id ?? '').trim().toLowerCase();
  }

  private shortGuid(id: string) {
    if (!id) return '—';
    return `${id.slice(0, 8)}…${id.slice(-5)}`;
  }

  private buildVehicleLabelMap(list: VehicleListItem[]) {
    const map: Record<string, string> = {};
    for (const v of list) {
      const key = this.normalizeId(v.id);
      const reg = v.registrationNumber ? ` (${v.registrationNumber})` : '';
      map[key] = `${v.brand} ${v.model}${reg}`;
    }
    this.vehicleLabelMap.set(map);
  }

  vehicleLabel(vehicleId: string) {
    const key = this.normalizeId(vehicleId);
    return this.vehicleLabelMap()[key] ?? this.shortGuid(vehicleId);
  }

  expiringLabel(v: InsuranceExpiringVehicle) {
    const reg = v.registrationNumber ? ` (${v.registrationNumber})` : '';
    return `${v.brand} ${v.model}${reg}`;
  }

  insurerVehicleLabel(r: InsurerOfferRequest) {
    const brand = (r.vehicleBrand ?? '').trim();
    const model = (r.vehicleModel ?? '').trim();
    const reg = (r.vehicleRegistrationNumber ?? '').trim();

    if (brand && model) return `${brand} ${model}${reg ? ` (${reg})` : ''}`;
    return this.shortGuid(r.vehicleId);
  }

  // ========= role helpers =========
  isUser() {
    return this.role() === 'User' || this.role() == null;
  }
  isInsurer() {
    return this.role() === 'Insurer';
  }
  isService() {
    return this.role() === 'Service';
  }
  isAdmin() {
    return this.role() === 'Admin';
  }

  // ========= reload =========
  reload() {
    this.loading.set(true);
    this.error.set(null);

    const role = this.role();

    if (role === 'Insurer') return this.reloadInsurer();
    if (role === 'Service') return this.reloadService();
    if (role === 'Admin') return this.reloadAdmin();

    return this.reloadUser();
  }

  private reloadUser() {
    this.vehiclesApi.getVehicles(1, 100).subscribe({
      next: (vRes) => {
        const items = vRes.items ?? [];
        this.vehicles.set(items);
        this.buildVehicleLabelMap(items);

        this.insuranceApi.getExpiring(this.days(), this.type()).subscribe({
          next: (exp) => {
            this.expiring.set(exp ?? []);

            this.offerRequestsApi.getMyRequests('Open').subscribe({
              next: (reqs) => {
                this.openRequests.set(reqs ?? []);

                this.offersApi.getMyOffers('Proposed').subscribe({
                  next: (offers) => {
                    const sorted = [...(offers ?? [])].sort((a, b) =>
                      (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
                    );
                    this.proposedOffers.set(sorted);
                    this.loading.set(false);
                  },
                  error: () => this.fail('Nie udało się pobrać ofert.'),
                });
              },
              error: () => this.fail('Nie udało się pobrać próśb o ofertę.'),
            });
          },
          error: () => this.fail('Nie udało się pobrać kończących się polis.'),
        });
      },
      error: () => this.fail('Nie udało się pobrać pojazdów.'),
    });
  }

  private reloadInsurer() {
    this.insurerVehiclesApi.getExpiring(this.days(), this.type()).subscribe({
      next: (exp) => {
        this.insurerExpiring.set(exp ?? []);

        this.insurerApi.getOfferRequests('Open' as OfferRequestStatus).subscribe({
          next: (reqs) => {
            const sortedReqs = [...(reqs ?? [])].sort((a, b) =>
              (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
            );
            this.insurerOpenRequests.set(sortedReqs);

            this.insurerApi.getMyOffers('Proposed' as any).subscribe({
              next: (offers) => {
                const sortedOffers = [...(offers ?? [])].sort((a, b) =>
                  (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
                );
                this.insurerMyOffers.set(sortedOffers);
                this.loading.set(false);
              },
              error: () => this.fail('Nie udało się pobrać ofert (Insurer).'),
            });
          },
          error: () => this.fail('Nie udało się pobrać requestów (Insurer).'),
        });
      },
      error: () => this.fail('Nie udało się pobrać kończących się polis (Insurer).'),
    });
  }

  /** Service dashboard: wyszukiwarka + domyślne 5 najnowszych */
  private reloadService() {
    // reset stanu wyszukiwarki
    this.serviceError.set(null);
    this.serviceItems.set([]);
    this.serviceTotal.set(0);
    this.servicePage.set(1);

    // wczytaj najnowsze (take=5)
    this.loadServiceRecent(5);

    this.loading.set(false);
  }

  private reloadAdmin() {
    this.loading.set(false);
  }

  private fail(msg: string) {
    this.error.set(msg);
    this.loading.set(false);
  }

  setDays(value: number) {
    this.days.set(value);
    this.reload();
  }

  setType(value: InsuranceTypeFilter) {
    this.type.set(value);
    this.reload();
  }

  offerVehicleId(o: Offer): string | null {
    return (o as any).vehicleId ?? null;
  }

  // ===== SERVICE helpers =====
  private formatServiceVehicleLabel(v: ServiceVehicleListItem) {
    const brand = (v.brand ?? '').trim();
    const model = (v.model ?? '').trim();
    const reg = (v.registrationNumber ?? '').trim();
    const year = v.year != null ? ` • ${v.year}` : '';
    const regPart = reg ? ` (${reg})` : '';
    const main = [brand, model].filter(Boolean).join(' ');
    return main ? `${main}${regPart}${year}` : this.shortGuid(v.id);
  }

  serviceVehicleLabel(v: ServiceVehicleListItem) {
    return this.formatServiceVehicleLabel(v);
  }

  loadServiceRecent(take = 5) {
    this.serviceRecentLoading.set(true);
    this.serviceRecentError.set(null);

    this.serviceVehiclesApi.getRecent(take).subscribe({
      next: (items) => {
        this.serviceRecent.set(items ?? []);
        this.serviceRecentLoading.set(false);
      },
      error: () => {
        this.serviceRecentError.set('Nie udało się pobrać najnowszych pojazdów.');
        this.serviceRecentLoading.set(false);
      },
    });
  }

  serviceSearch(page = 1) {
    const q = (this.serviceQuery() ?? '').trim();
    this.serviceError.set(null);

    if (q.length < 2) {
      this.serviceItems.set([]);
      this.serviceTotal.set(0);
      this.servicePage.set(1);
      this.serviceError.set('Wpisz min. 2 znaki (np. rejestracja, VIN, marka/model).');
      return;
    }

    this.serviceLoading.set(true);

    this.serviceVehiclesApi.searchVehicles(q, page, this.servicePageSize).subscribe({
      next: (res) => {
        this.serviceItems.set(res.items ?? []);
        this.serviceTotal.set(res.totalCount ?? 0);
        this.servicePage.set(res.page ?? page);
        this.serviceLoading.set(false);
      },
      error: () => {
        this.serviceLoading.set(false);
        this.serviceError.set('Nie udało się wyszukać pojazdów.');
      },
    });
  }

  servicePrev() {
    const p = this.servicePage();
    if (p <= 1) return;
    this.serviceSearch(p - 1);
  }

  serviceNext() {
    const p = this.servicePage();
    const max = this.serviceTotalPages();
    if (p >= max) return;
    this.serviceSearch(p + 1);
  }

  openServiceVehicle(vehicleId: string) {
    const id = (vehicleId ?? '').trim();
    if (!id) return;
    this.router.navigate(['/app/vehicles', id, 'services']);
  }

  onServiceEnterKey(ev: KeyboardEvent) {
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    this.serviceSearch(1);
  }

  onServiceQueryInput(value: string) {
    this.serviceQuery.set(value);

    // Jeśli user wrócił do < 2 znaków, czyścimy wyniki wyszukiwania
    if (value.trim().length < 2) {
      this.serviceError.set(null);
      this.serviceItems.set([]);
      this.serviceTotal.set(0);
      this.servicePage.set(1);
    }
  }
}
