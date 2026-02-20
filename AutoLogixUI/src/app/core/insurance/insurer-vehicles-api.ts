import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { InsuranceExpiringVehicle, InsuranceTypeFilter } from '../models/insurance.model';

@Injectable({ providedIn: 'root' })
export class InsurerVehiclesApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  // GET /insurer/vehicles/expiring?days=30&type=ANY
  getExpiring(days: number, type: InsuranceTypeFilter) {
    const params = new HttpParams().set('days', String(days)).set('type', type);
    return this.http.get<InsuranceExpiringVehicle[]>(
      `${this.apiBaseUrl}/insurer/vehicles/expiring`,
      { params }
    );
  }
}
