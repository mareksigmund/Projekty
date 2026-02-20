import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ServicesApi } from '../../../core/vehicles/services-api';
import { AuthStore } from '../../../core/auth/auth.store';
import { ServiceEntryFormModel } from '../../../core/models/service.model';

import { ServiceVehiclesApi } from '../../../core/vehicles/service-vehicles-api';
import { ServiceVehicleListItem } from '../../../core/models/service-vehicle.model';

type AppRole = 'User' | 'Insurer' | 'Service' | 'Admin';

type ServiceTypeOption = {
  key: string;
  label: string;
  defaultTitle: string;
  defaultDescription: string;
};

type WorkshopOption = {
  key: string;
  label: string;
};

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './service-form.html',
  styleUrl: './service-form.scss',
})
export class ServiceForm {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ServicesApi);
  private readonly auth = inject(AuthStore);

  // ✅ optional dla roli Service (jeśli masz getVehicleById po stronie service)
  private readonly serviceVehiclesApi = inject(ServiceVehiclesApi);

  loading = signal(false);
  error = signal<string | null>(null);

  vehicleId = computed(() => this.route.snapshot.paramMap.get('vehicleId'));
  serviceId = computed(() => this.route.snapshot.paramMap.get('id'));
  isEditMode = computed(() => !!this.serviceId());

  // ===== dane pojazdu do nagłówka =====
  vehicleLabel = signal<string>('—');
  vehicleVin = signal<string | null>(null);
  vehicleMileage = signal<number | null>(null);
  vehicleFuel = signal<string | null>(null);
  vehiclePower = signal<number | null>(null);

  // ===== kontrola nad autouzupełnianiem =====
  private descriptionTouchedByUser = signal(false);
  private titleTouchedByUser = signal(false);

  // ===== opcje =====
  serviceTypes: ServiceTypeOption[] = [
    {
      key: 'oil_filters',
      label: 'Wymiana oleju + filtrów',
      defaultTitle: 'Wymiana oleju i filtrów',
      defaultDescription: 'Wymiana oleju silnikowego oraz filtrów (oleju/powietrza/kabiny).',
    },
    {
      key: 'tires',
      label: 'Opony',
      defaultTitle: 'Serwis opon',
      defaultDescription: 'Wymiana kół/wyważenie/naprawa przebicia.',
    },
    {
      key: 'brakes',
      label: 'Hamulce',
      defaultTitle: 'Serwis układu hamulcowego',
      defaultDescription: 'Kontrola/wymiana klocków, tarcz, płynu hamulcowego.',
    },
    {
      key: 'inspection',
      label: 'Przegląd / diagnostyka',
      defaultTitle: 'Diagnostyka / przegląd',
      defaultDescription: 'Podpięcie komputera, kontrola błędów i podstawowy przegląd.',
    },
    {
      key: 'other',
      label: 'Inne',
      defaultTitle: 'Wpis serwisowy',
      defaultDescription: '',
    },
  ];

  workshops: WorkshopOption[] = [
    { key: 'autologix', label: 'AutoLogix (wewnętrzny)' },
    { key: 'partner_a', label: 'Partner A' },
    { key: 'partner_b', label: 'Partner B' },
    { key: 'other', label: 'Inny…' },
  ];

  form = this.fb.nonNullable.group({
    // UI-only (nie wysyłamy jako osobne pole do backendu, ale wykorzystujemy do title/description)
    serviceType: this.fb.nonNullable.control<string>('oil_filters', Validators.required),

    // wymagane backendowo
    serviceDate: this.fb.nonNullable.control<string>('', Validators.required),
    title: this.fb.nonNullable.control<string>('', [
      Validators.required,
      Validators.maxLength(200),
    ]),

    // liczby
    mileageAtService: this.fb.control<number | null>(null, [Validators.min(0)]),
    cost: this.fb.control<number | null>(null, [Validators.min(0)]),

    // tekst
    description: this.fb.control<string | null>(null),
    notes: this.fb.control<string | null>(null),

    // warsztat (select + własny)
    workshopKey: this.fb.nonNullable.control<string>('autologix'),
    workshopCustomName: this.fb.control<string | null>(null),
    workshopAddress: this.fb.control<string | null>(null),

    // następny serwis
    nextServiceDate: this.fb.control<string | null>(null),
    nextServiceMileage: this.fb.control<number | null>(null, [Validators.min(0)]),
  });

  role = computed<AppRole | null>(() => this.getRoleFromToken());

  constructor() {
    const vId = this.vehicleId();
    if (!vId) {
      this.error.set('Brak vehicleId w adresie.');
      return;
    }

    // default date = today
    const today = new Date().toISOString().slice(0, 10);
    this.form.controls.serviceDate.setValue(today);

    // ===== obserwacje: autouzupełnianie =====
    this.form.controls.description.valueChanges.subscribe(() => {
      // jeśli user cokolwiek zmieni w opisie ręcznie -> blokujemy auto-overwrite
      if (this.form.controls.description.dirty) this.descriptionTouchedByUser.set(true);
    });

    this.form.controls.title.valueChanges.subscribe(() => {
      if (this.form.controls.title.dirty) this.titleTouchedByUser.set(true);
    });

    this.form.controls.serviceType.valueChanges.subscribe((key) => {
      const opt = this.serviceTypes.find((x) => x.key === key);
      if (!opt) return;

      // tytuł: tylko jeśli user go nie ruszył
      if (!this.titleTouchedByUser()) {
        this.form.controls.title.setValue(opt.defaultTitle, { emitEvent: false });
        this.form.controls.title.markAsPristine();
      }

      // opis: tylko jeśli user go nie ruszył
      if (!this.descriptionTouchedByUser()) {
        this.form.controls.description.setValue(opt.defaultDescription, { emitEvent: false });
        this.form.controls.description.markAsPristine();
      }
    });

    // warsztat: gdy nie "other" -> czyścimy custom name
    this.form.controls.workshopKey.valueChanges.subscribe((key) => {
      if (key !== 'other') {
        this.form.controls.workshopCustomName.setValue(null, { emitEvent: false });
        this.form.controls.workshopCustomName.markAsPristine();
      }
    });

    // ustaw startowe wartości title/desc z domyślnego typu
    const initType = this.form.controls.serviceType.value;
    const initOpt = this.serviceTypes.find((x) => x.key === initType);
    if (initOpt) {
      this.form.controls.title.setValue(initOpt.defaultTitle, { emitEvent: false });
      this.form.controls.description.setValue(initOpt.defaultDescription, { emitEvent: false });
    }

    // ===== pobierz dane pojazdu do nagłówka + domyślny przebieg =====
    this.loadVehicleHeader(vId);

    // ===== EDIT: wczytaj wpis i patchuj =====
    const sId = this.serviceId();
    if (sId) {
      this.loading.set(true);

      this.api.getServiceById(vId, sId).subscribe({
        next: (s: any) => {
          // gdy wczytujemy wpis, nie traktuj tego jako "user changed"
          this.descriptionTouchedByUser.set(false);
          this.titleTouchedByUser.set(false);

          this.form.patchValue({
            serviceDate: s.serviceDate?.slice(0, 10) ?? '',
            title: s.title ?? '',
            mileageAtService: s.mileageAtService ?? null,
            cost: s.cost ?? null,
            description: s.description ?? null,

            // warsztat
            workshopKey: s.workshopName ? 'other' : 'autologix', // prosto: jak jest nazwa -> other
            workshopCustomName: s.workshopName ?? null,
            workshopAddress: s.workshopAddress ?? null,

            nextServiceDate: s.nextServiceDate ? s.nextServiceDate.slice(0, 10) : null,
            nextServiceMileage: s.nextServiceMileage ?? null,
            notes: s.notes ?? null,
          });

          // po patchu: user jeszcze nie edytował ręcznie
          this.form.markAsPristine();
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Nie udało się wczytać wpisu serwisowego.');
          this.loading.set(false);
        },
      });
    }
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

  private shortGuid(id: string) {
    if (!id) return '—';
    return `${id.slice(0, 8)}…${id.slice(-5)}`;
  }

  private formatVehicleLabel(v: Partial<ServiceVehicleListItem>) {
    const brand = (v.brand ?? '').trim();
    const model = (v.model ?? '').trim();
    const reg = (v.registrationNumber ?? '').trim();
    const year = v.year != null ? ` • ${v.year}` : '';
    const regPart = reg ? ` (${reg})` : '';
    const main = [brand, model].filter(Boolean).join(' ');
    return main ? `${main}${regPart}${year}` : this.shortGuid(String(v.id ?? ''));
  }

  private loadVehicleHeader(vehicleId: string) {
    // 🔥 Najprościej: dla roli Service pobierz przez endpoint service/vehicles/{id}
    // Jeśli nie masz – zobacz komentarz niżej.
    const role = this.role();

    if (role === 'Service' || role === 'Admin') {
      const apiAny = this.serviceVehiclesApi as any;
      const getByIdFn = apiAny.getVehicleById ?? apiAny.getById ?? null;

      if (typeof getByIdFn !== 'function') {
        // fallback — nie blokujemy ekranu
        this.vehicleLabel.set(`Pojazd: ${this.shortGuid(vehicleId)}`);
        return;
      }

      getByIdFn.call(this.serviceVehiclesApi, vehicleId).subscribe({
        next: (v: any) => {
          this.vehicleLabel.set(this.formatVehicleLabel(v));
          this.vehicleVin.set(v.vin ?? null);
          this.vehicleMileage.set(v.mileage ?? null);

          // opcjonalne
          this.vehicleFuel.set(v.fuelType ?? null);
          this.vehiclePower.set(v.enginePowerHp ?? null);

          // domyślny przebieg do wpisu
          if (this.form.controls.mileageAtService.value == null && v.mileage != null) {
            this.form.controls.mileageAtService.setValue(v.mileage, { emitEvent: false });
          }
        },
        error: () => {
          this.vehicleLabel.set(`Pojazd: ${this.shortGuid(vehicleId)}`);
        },
      });

      return;
    }

    // rola User – jeżeli masz getVehicleById w VehiclesApi, można tu dopiąć,
    // ale nie mieszam Ci teraz zależności – zostawiam fallback.
    this.vehicleLabel.set(`Pojazd: ${this.shortGuid(vehicleId)}`);
  }

  // ===== helpers =====
  isWorkshopOther() {
    return this.form.controls.workshopKey.value === 'other';
  }

  // ===== submit/delete =====
  submit() {
    const vId = this.vehicleId();
    if (!vId) return;

    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();

    const resolvedWorkshopName =
      raw.workshopKey === 'other'
        ? (raw.workshopCustomName ?? '').trim()
        : this.workshops.find((w) => w.key === raw.workshopKey)?.label ?? null;

    const payload: ServiceEntryFormModel = {
      serviceDate: raw.serviceDate ? `${raw.serviceDate}T00:00:00Z` : (raw.serviceDate as any),
      title: (raw.title ?? '').trim(),
      mileageAtService: raw.mileageAtService ?? null,
      cost: raw.cost ?? null,

      description: raw.description ? raw.description.trim() : null,
      workshopName: resolvedWorkshopName ? resolvedWorkshopName : null,
      workshopAddress: raw.workshopAddress ? raw.workshopAddress.trim() : null,

      nextServiceDate: raw.nextServiceDate ? `${raw.nextServiceDate}T00:00:00Z` : null,
      nextServiceMileage: raw.nextServiceMileage ?? null,

      notes: raw.notes ? raw.notes.trim() : null,
    };

    const sId = this.serviceId();
    const req$ = sId
      ? this.api.updateService(vId, sId, payload)
      : this.api.createService(vId, payload);

    req$.subscribe({
      next: () => {
        this.loading.set(false);
        // ✅ wracamy do listy wpisów (lepsze UX dla serwisanta)
        this.router.navigateByUrl(`/app/vehicles/${vId}/services`);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Nie udało się zapisać wpisu serwisowego.');
      },
    });
  }

  onDelete() {
    const vId = this.vehicleId();
    const sId = this.serviceId();
    if (!vId || !sId) return;

    const ok = confirm('Na pewno usunąć wpis serwisowy?');
    if (!ok) return;

    this.loading.set(true);
    this.error.set(null);

    this.api.deleteService(vId, sId).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl(`/app/vehicles/${vId}/services`);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Nie udało się usunąć wpisu serwisowego.');
      },
    });
  }

  backToList() {
    const vId = this.vehicleId();
    if (!vId) return;
    this.router.navigateByUrl(`/app/vehicles/${vId}/services`);
  }
}
