import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { VehiclesApi } from '../../../core/vehicles/vehicles-api';
import { VehicleFormModel } from '../../../core/models/vehicle.model';
import { AuthService } from '../../../core/auth/auth-service';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

type FuelOption = { value: string; label: string };

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,

    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatSelectModule,

    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './vehicle-form.html',
  styleUrl: './vehicle-form.scss',
})
export class VehicleForm {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly api = inject(VehiclesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  vehicleId = computed(() => this.route.snapshot.paramMap.get('id'));
  isEditMode = computed(() => !!this.vehicleId());

  role = computed(() => this.auth.getRole());
  isUser = computed(() => this.role() === 'User');
  canEditSensitiveDates = computed(() => this.role() === 'Insurer' || this.role() === 'Admin');

  loading = signal(false);
  error = signal<string | null>(null);

  fuelOptions: FuelOption[] = [
    { value: '', label: '— wybierz —' },
    { value: 'Benzyna', label: 'Benzyna' },
    { value: 'Diesel', label: 'Diesel' },
    { value: 'LPG', label: 'LPG' },
    { value: 'Hybryda', label: 'Hybryda' },
    { value: 'Elektryczny', label: 'Elektryczny' },
    { value: 'Inne', label: 'Inne' },
  ];

  form = this.fb.nonNullable.group({
    // required
    brand: ['', [Validators.required, Validators.maxLength(100)]],
    model: ['', [Validators.required, Validators.maxLength(100)]],
    registrationNumber: ['', [Validators.required, Validators.maxLength(20)]],

    // optional
    year: this.fb.control<number | null>(null, [
      Validators.min(1900),
      Validators.max(new Date().getFullYear()),
    ]),
    mileage: this.fb.control<number | null>(null, [Validators.min(0)]),
    notes: this.fb.control<string | null>(null, [Validators.maxLength(1000)]),

    version: this.fb.control<string | null>(null),
    vin: this.fb.control<string | null>(null),
    fuelType: this.fb.control<string | null>(null),
    engineCapacity: this.fb.control<number | null>(null, [Validators.min(0)]),
    enginePowerHp: this.fb.control<number | null>(null, [Validators.min(0)]),

    // ✅ DATEPICKER -> Date | null
    firstRegistrationDate: this.fb.control<Date | null>(null),
    technicalInspectionDueDate: this.fb.control<Date | null>(null),
    insuranceOcDueDate: this.fb.control<Date | null>(null),
    insuranceAcDueDate: this.fb.control<Date | null>(null),

    // consent
    allowInsuranceOffers: this.fb.control<boolean>(false),
  });

  constructor() {
    // ✅ User nie edytuje pól "serwis/ubezpieczenia"
    if (this.isUser()) {
      this.form.controls.technicalInspectionDueDate.disable({ emitEvent: false });
      this.form.controls.insuranceOcDueDate.disable({ emitEvent: false });
      this.form.controls.insuranceAcDueDate.disable({ emitEvent: false });
    }

    const id = this.vehicleId();
    if (!id) return;

    this.loading.set(true);
    this.error.set(null);

    this.api.getVehicleById(id).subscribe({
      next: (v) => {
        this.form.patchValue({
          brand: v.brand,
          model: v.model,
          registrationNumber: v.registrationNumber,

          year: v.year ?? null,
          mileage: v.mileage ?? null,
          notes: v.notes ?? null,

          version: v.version ?? null,
          vin: v.vin ?? null,
          fuelType: v.fuelType ?? null,
          engineCapacity: v.engineCapacity ?? null,
          enginePowerHp: v.enginePowerHp ?? null,

          // ISO -> Date
          firstRegistrationDate: this.isoToDate(v.firstRegistrationDate),
          technicalInspectionDueDate: this.isoToDate(v.technicalInspectionDueDate),
          insuranceOcDueDate: this.isoToDate(v.insuranceOcDueDate),
          insuranceAcDueDate: this.isoToDate(v.insuranceAcDueDate),

          allowInsuranceOffers: !!v.allowInsuranceOffers,
        });

        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się wczytać pojazdu do edycji.');
        this.loading.set(false);
      },
    });
  }

  private isoToDate(value?: string | null): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  private dateToIsoOrNull(date: Date | null): string | null {
    if (!date) return null;

    // Datepicker daje Date w lokalnym czasie; chcemy "dzień" bez przesunięć.
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}T00:00:00Z`;
  }

  submit() {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);
    const reg = (this.form.controls.registrationNumber.value ?? '').trim().toUpperCase();
    this.form.controls.registrationNumber.setValue(reg);
    if (this.isUser()) {
      this.form.patchValue(
        {
          technicalInspectionDueDate: null,
          insuranceOcDueDate: null,
          insuranceAcDueDate: null,
        },
        { emitEvent: false }
      );
    }

    const id = this.vehicleId();
    const raw = this.form.getRawValue();

    const payload: VehicleFormModel = {
      ...raw,

      // ✅ Date -> ISO
      firstRegistrationDate: this.dateToIsoOrNull(raw.firstRegistrationDate),
      technicalInspectionDueDate: this.dateToIsoOrNull(raw.technicalInspectionDueDate),
      insuranceOcDueDate: this.dateToIsoOrNull(raw.insuranceOcDueDate),
      insuranceAcDueDate: this.dateToIsoOrNull(raw.insuranceAcDueDate),

      allowInsuranceOffers: raw.allowInsuranceOffers,
    };

    const req$ = id ? this.api.updateVehicle(id, payload) : this.api.createVehicle(payload);

    req$.subscribe({
      next: (res: any) => {
        this.loading.set(false);

        const newId = res?.id ?? id;
        if (newId) this.router.navigateByUrl(`/app/vehicles/${newId}`);
        else this.router.navigateByUrl('/app/vehicles');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Wystąpił błąd podczas zapisu pojazdu.');
        console.error(err);
      },
    });
  }
}
