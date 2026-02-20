import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { OfferRequestsApi } from '../../../core/offers/offer-requests-api';
import { VehiclesApi } from '../../../core/vehicles/vehicles-api';

import { VehicleListItem, VehicleDetails } from '../../../core/models/vehicle.model';
import {
  CreateOfferRequest,
  OfferRequest,
  OfferRequestType,
} from '../../../core/models/offer-request.model';
import { Location } from '@angular/common';
type BlockReasonMap = Partial<Record<OfferRequestType, string>>;

@Component({
  selector: 'app-offer-request-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './offer-request-form.html',
  styleUrl: './offer-request-form.scss',
})
export class OfferRequestForm {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(OfferRequestsApi);
  private readonly vehiclesApi = inject(VehiclesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private location = inject(Location);
  private readonly RENEW_WINDOW_DAYS = 14;

  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  vehicles = signal<VehicleListItem[]>([]);
  lockedVehicleLabel = signal<string>('—');

  vehicleDetails = signal<VehicleDetails | null>(null);
  openRequests = signal<OfferRequest[]>([]);
  blockReasons = signal<BlockReasonMap>({});

  vehicleIdFromUrl = computed(() => this.route.snapshot.queryParamMap.get('vehicleId'));
  isLockedVehicle = computed(() => !!this.vehicleIdFromUrl());

  form = this.fb.nonNullable.group({
    vehicleId: this.fb.nonNullable.control<string>('', Validators.required),
    type: this.fb.nonNullable.control<OfferRequestType>('OC', Validators.required),
    message: this.fb.control<string | null>(null, [Validators.maxLength(2000)]),
  });

  constructor() {
    const vid = this.vehicleIdFromUrl();

    // najpierw bierzemy Open requesty (żeby blokować typy)
    this.loadOpenRequests(() => {
      if (vid) {
        this.form.patchValue({ vehicleId: vid });
        this.form.controls.vehicleId.disable({ emitEvent: false });
        this.loadLockedVehicle(vid);
      } else {
        this.loadVehiclesList();
      }
    });

    // jeśli tryb z selectem i user zmienia auto -> wczytaj detale i przelicz blokady
    this.form.controls.vehicleId.valueChanges.subscribe((id) => {
      if (this.isLockedVehicle()) return;
      const vId = (id ?? '').trim();
      if (!vId) {
        this.vehicleDetails.set(null);
        this.recomputeTypeAvailability();
        return;
      }
      this.loadVehicleDetailsOnly(vId);
    });
  }

  // -----------------------
  // LOADERS
  // -----------------------
  private loadOpenRequests(done: () => void) {
    this.api.getMyRequests('Open').subscribe({
      next: (reqs) => {
        this.openRequests.set(reqs ?? []);
        done();
      },
      error: () => {
        this.openRequests.set([]);
        done();
      },
    });
  }

  private shortGuid(id: string) {
    if (!id) return '—';
    return `${id.slice(0, 8)}…${id.slice(-5)}`;
  }

  private formatLabel(v: { brand: string; model: string; registrationNumber?: string | null }) {
    const reg = v.registrationNumber ? ` (${v.registrationNumber})` : '';
    return `${v.brand} ${v.model}${reg}`;
  }

  private loadLockedVehicle(vehicleId: string) {
    this.loading.set(true);
    this.error.set(null);

    this.vehiclesApi.getVehicleById(vehicleId).subscribe({
      next: (v) => {
        this.vehicleDetails.set(v);

        const label = this.formatLabel({
          brand: v.brand,
          model: v.model,
          registrationNumber: v.registrationNumber,
        });

        this.lockedVehicleLabel.set(label);

        this.vehicles.set([
          {
            id: v.id,
            brand: v.brand,
            model: v.model,
            registrationNumber: v.registrationNumber,
            year: v.year ?? null,
            mileage: v.mileage ?? null,
          } as VehicleListItem,
        ]);

        this.recomputeTypeAvailability();
        this.loading.set(false);
      },
      error: () => {
        this.lockedVehicleLabel.set(this.shortGuid(vehicleId));
        this.vehicleDetails.set(null);
        this.recomputeTypeAvailability();
        this.loading.set(false);
      },
    });
  }

  private loadVehicleDetailsOnly(vehicleId: string) {
    this.loading.set(true);
    this.error.set(null);

    this.vehiclesApi.getVehicleById(vehicleId).subscribe({
      next: (v) => {
        this.vehicleDetails.set(v);
        this.recomputeTypeAvailability();
        this.loading.set(false);
      },
      error: () => {
        this.vehicleDetails.set(null);
        this.recomputeTypeAvailability();
        this.loading.set(false);
      },
    });
  }

  private loadVehiclesList() {
    this.loading.set(true);
    this.error.set(null);

    this.vehiclesApi.getVehicles(1, 100).subscribe({
      next: (res) => {
        const list = res?.items ?? [];
        this.vehicles.set(list);

        if (list.length > 0 && !this.form.value.vehicleId) {
          this.form.patchValue({ vehicleId: list[0].id });
          this.loadVehicleDetailsOnly(list[0].id);
          return;
        }

        this.recomputeTypeAvailability();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Nie udało się pobrać listy pojazdów.');
      },
    });
  }

  // -----------------------
  // LABELS
  // -----------------------
  vehicleLabelById(vehicleId: string | null | undefined) {
    const id = (vehicleId ?? '').trim();
    if (!id) return '—';

    const v = this.vehicles().find((x) => x.id === id);
    return v
      ? this.formatLabel({
          brand: v.brand,
          model: v.model,
          registrationNumber: v.registrationNumber,
        })
      : this.shortGuid(id);
  }

  // -----------------------
  // RULES
  // -----------------------
  private normalizeId(id: string | null | undefined): string {
    return (id ?? '').trim().toLowerCase();
  }

  private hasOpenRequest(vehicleId: string, type: OfferRequestType) {
    const vid = this.normalizeId(vehicleId);
    return (this.openRequests() ?? []).some(
      (r) => this.normalizeId(r.vehicleId) === vid && (r.type ?? '').toUpperCase() === type
    );
  }

  private daysLeft(isoOrNull?: string | null): number | null {
    if (!isoOrNull) return null;

    const d = new Date(isoOrNull);
    const today = new Date();

    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }

  private recomputeTypeAvailability() {
    const vehicleId = (this.form.getRawValue().vehicleId ?? '').trim();
    const reasons: BlockReasonMap = {};

    if (!vehicleId) {
      this.blockReasons.set(reasons);
      return;
    }

    const v = this.vehicleDetails();

    // --- Policy rules (14 dni)
    let canOC = true;
    let canAC = true;

    if (v) {
      const ocDays = this.daysLeft(v.insuranceOcDueDate);
      const acDays = this.daysLeft(v.insuranceAcDueDate);

      if (v.insuranceOcDueDate && ocDays != null && ocDays > this.RENEW_WINDOW_DAYS) {
        canOC = false;
        reasons.OC = `Masz OC ważne jeszcze ${ocDays} dni (wniosek dopiero ≤ ${this.RENEW_WINDOW_DAYS} dni przed końcem).`;
      }

      if (v.insuranceAcDueDate && acDays != null && acDays > this.RENEW_WINDOW_DAYS) {
        canAC = false;
        reasons.AC = `Masz AC ważne jeszcze ${acDays} dni (wniosek dopiero ≤ ${this.RENEW_WINDOW_DAYS} dni przed końcem).`;
      }

      if (!(canOC && canAC)) {
        reasons.OC_AC =
          'Pakiet OC+AC dostępny tylko, gdy możesz zawnioskować o oba (brak polisy lub koniec w oknie odnowienia).';
      }
    }

    // --- Open request duplicates
    if (this.hasOpenRequest(vehicleId, 'OC')) {
      reasons.OC = reasons.OC || 'Masz już otwartą prośbę OC dla tego pojazdu.';
    }
    if (this.hasOpenRequest(vehicleId, 'AC')) {
      reasons.AC = reasons.AC || 'Masz już otwartą prośbę AC dla tego pojazdu.';
    }
    if (this.hasOpenRequest(vehicleId, 'OC_AC')) {
      reasons.OC_AC = reasons.OC_AC || 'Masz już otwartą prośbę OC+AC dla tego pojazdu.';
    }

    this.blockReasons.set(reasons);

    // jeśli wybrany typ stał się zablokowany -> ustaw pierwszy dostępny
    const current = this.form.controls.type.value;
    if (this.isTypeDisabled(current)) {
      const fallback = this.pickFirstEnabledType();
      if (fallback) this.form.patchValue({ type: fallback });
    }
  }

  private pickFirstEnabledType(): OfferRequestType | null {
    const all: OfferRequestType[] = ['OC', 'AC', 'OC_AC'];
    for (const t of all) {
      if (!this.isTypeDisabled(t)) return t;
    }
    return null;
  }

  isTypeDisabled(t: OfferRequestType) {
    return !!this.blockReasons()[t];
  }

  typeReason(t: OfferRequestType) {
    return this.blockReasons()[t] ?? '';
  }

  // -----------------------
  // SUBMIT
  // -----------------------
  submit() {
    if (this.saving() || this.form.invalid) return;

    const raw = this.form.getRawValue();
    if (this.isTypeDisabled(raw.type)) {
      this.error.set('Wybrany typ nie jest teraz dostępny dla tego pojazdu.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload: CreateOfferRequest = {
      vehicleId: raw.vehicleId,
      type: raw.type,
      message: raw.message ?? null,
    };

    this.api.create(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigateByUrl('/app/offer-requests');
      },
      error: (err) => {
        this.saving.set(false);

        if (err?.status === 409) {
          this.error.set('Masz już otwartą prośbę o ten typ dla tego pojazdu.');
          // odśwież open requesty i przelicz blokady
          this.loadOpenRequests(() => this.recomputeTypeAvailability());
          return;
        }

        this.error.set('Nie udało się wysłać prośby o ofertę.');
      },
    });
  }

  back() {
    this.location.back();
  }
}
