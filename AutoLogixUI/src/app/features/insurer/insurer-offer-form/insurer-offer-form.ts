import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { InsurerApi } from '../../../core/insurer/insurer-api';
import { CreateInsurerOfferPayload } from '../../../core/models/insurance.model';
import { OfferType } from '../../../core/models/offer.model';
import { OfferRequest } from '../../../core/models/offer-request.model';

type InsurerVehicleDetails = {
  id: string;
  brand: string;
  model: string;
  registrationNumber: string;

  year?: number | null;
  mileage?: number | null;
  vin?: string | null;

  fuelType?: string | null;
  enginePowerHp?: number | null;
  engineCapacity?: number | null;

  insuranceOcDueDate?: string | null;
  insuranceAcDueDate?: string | null;

  allowInsuranceOffers?: boolean | null;
};

@Component({
  selector: 'app-insurer-offer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './insurer-offer-form.html',
  styleUrl: './insurer-offer-form.scss',
})
export class InsurerOfferForm {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(InsurerApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  loading = signal(false);
  error = signal<string | null>(null);

  offerRequestId = computed(() => this.route.snapshot.queryParamMap.get('offerRequestId'));
  isFromRequest = computed(() => !!this.offerRequestId());

  request = signal<OfferRequest | null>(null);
  vehicle = signal<InsurerVehicleDetails | null>(null);

  form = this.fb.nonNullable.group({
    offerRequestId: this.fb.control<string | null>(null),
    vehicleId: this.fb.control<string | null>(null),

    type: this.fb.nonNullable.control<OfferType>('OC', Validators.required),
    price: this.fb.nonNullable.control<number>(0, [Validators.required, Validators.min(0.01)]),

    validFrom: this.fb.nonNullable.control<string>('', Validators.required),
    validTo: this.fb.nonNullable.control<string>('', Validators.required),

    description: this.fb.control<string | null>(null, [Validators.maxLength(4000)]),
  });

  constructor() {
    const reqId = this.offerRequestId();

    // default dates
    const today = this.toDateInput(new Date());
    const plus30 = this.toDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    this.form.patchValue({ validFrom: today, validTo: plus30 });

    // flow A: odpowiadam na request
    if (reqId) {
      this.form.patchValue({ offerRequestId: reqId });

      // vehicleId nie ma sensu w tym trybie
      this.form.controls.vehicleId.disable({ emitEvent: false });

      // type też blokujemy (wynika z requestu)
      this.form.controls.type.disable({ emitEvent: false });

      this.loadRequestFromList(reqId);
      return;
    }

    // flow B: oferta bez requestu (insurer “z własnej inicjatywy”)
    // type zostaje edytowalny, vehicleId edytowalne, offerRequestId edytowalne
  }

  private loadRequestFromList(reqId: string) {
    this.loading.set(true);
    this.error.set(null);

    // bierzemy Open (bo tylko na Open odpowiadamy)
    this.api.getOfferRequests('Open').subscribe({
      next: (list) => {
        const found = (list ?? []).find((x) => x.id === reqId);

        if (!found) {
          this.error.set('Nie znaleziono requestu (może już nie jest Open).');
          this.loading.set(false);
          return;
        }

        this.request.set(found);

        // typ z requestu
        this.form.patchValue({
          type: found.type as OfferType,
        });

        // pobierz pełne dane pojazdu (Insurer endpoint)
        this.api.getVehicleById(found.vehicleId).subscribe({
          next: (v) => {
            this.vehicle.set(v as InsurerVehicleDetails);
          },
          error: () => {
            // fallback: po prostu nie pokażemy szczegółów pojazdu
            this.vehicle.set(null);
          },
        });

        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Nie udało się pobrać listy requestów.');
        this.loading.set(false);
      },
    });
  }

  vehicleLabelFromRequest(): string {
    const v = this.vehicle();
    if (v) {
      const reg = v.registrationNumber ? ` (${v.registrationNumber})` : '';
      return `${v.brand} ${v.model}${reg}`;
    }

    const r = this.request();
    if (!r) return '—';
    return this.shortGuid(r.vehicleId);
  }

  private shortGuid(id: string) {
    if (!id) return '—';
    return `${id.slice(0, 8)}…${id.slice(-5)}`;
  }

  private toDateInput(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private toIsoDate(date: string) {
    // date input => YYYY-MM-DD
    return `${date}T00:00:00Z`;
  }

  submit() {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();

    const payload: CreateInsurerOfferPayload = {
      offerRequestId: raw.offerRequestId || null,
      vehicleId: this.isFromRequest() ? null : raw.vehicleId || null,

      // UWAGA: jeśli type jest disabled, getRawValue() go nadal zwraca (super)
      type: raw.type,
      price: raw.price,

      validFrom: this.toIsoDate(raw.validFrom),
      validTo: this.toIsoDate(raw.validTo),
      description: raw.description ?? null,
    };

    if (!payload.offerRequestId && !payload.vehicleId) {
      this.loading.set(false);
      this.error.set('Musisz podać OfferRequestId lub VehicleId.');
      return;
    }

    if (raw.validFrom > raw.validTo) {
      this.loading.set(false);
      this.error.set('ValidTo nie może być wcześniejsze niż ValidFrom.');
      return;
    }

    this.api.createOffer(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/app/insurer/offer-requests');
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.error.set('Nie udało się wystawić oferty.');
      },
    });
  }
}
