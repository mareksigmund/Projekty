import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { InsuranceApi } from '../../../core/insurance/insurance-api';
import {
  InsuranceExpiringVehicle,
  InsuranceTypeFilter,
} from '../../../core/models/insurance.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-insurance-expiring',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './insurance-expiring.html',
  styleUrl: './insurance-expiring.scss',
})
export class InsuranceExpiring {
  private readonly api = inject(InsuranceApi);

  loading = signal(false);
  error = signal<string | null>(null);
  items = signal<InsuranceExpiringVehicle[]>([]);

  days = signal<number>(30);
  type = signal<InsuranceTypeFilter>('ANY');

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    this.api.getExpiring(this.days(), this.type()).subscribe({
      next: (res) => {
        this.items.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się pobrać alertów ubezpieczeń.');
        this.loading.set(false);
      },
    });
  }

  // ====== SELECT HANDLERS ======
  onDaysChange(v: string | number) {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n) || n <= 0) return;
    if (this.days() === n) return;
    this.days.set(n);
    this.load();
  }

  onTypeChange(v: string) {
    const next = (v as InsuranceTypeFilter) ?? 'ANY';
    if (this.type() === next) return;
    this.type.set(next);
    this.load();
  }

  // ====== DAYS LEFT ======
  private startOfDayLocal(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private daysLeftFromIso(iso?: string | null): number | null {
    if (!iso) return null;

    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;

    const today = this.startOfDayLocal(new Date());
    const target = this.startOfDayLocal(d);

    const diffMs = target.getTime() - today.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return Math.max(0, days);
  }

  ocDaysLeft(v: InsuranceExpiringVehicle): number | null {
    return this.daysLeftFromIso(v.ocDueDate) ?? v.ocDaysLeft ?? null;
  }

  acDaysLeft(v: InsuranceExpiringVehicle): number | null {
    return this.daysLeftFromIso(v.acDueDate) ?? v.acDaysLeft ?? null;
  }
}
