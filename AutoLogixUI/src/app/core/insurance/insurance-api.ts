import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { InsuranceExpiringVehicle, InsuranceTypeFilter } from '../models/insurance.model';
import { OfferRequest, OfferRequestStatus } from '../models/offer-request.model';

@Injectable({ providedIn: 'root' })
export class InsuranceApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getExpiring(days: number, type: InsuranceTypeFilter) {
    const params = new HttpParams().set('days', String(days)).set('type', type);

    return this.http.get<InsuranceExpiringVehicle[]>(`${this.apiBaseUrl}/me/insurance/expiring`, {
      params,
    });
  }
}
