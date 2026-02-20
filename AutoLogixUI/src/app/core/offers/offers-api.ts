import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { InsuranceOffer, OfferStatus } from '../models/insurance.model';

@Injectable({ providedIn: 'root' })
export class OffersApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getMyOffers(status?: OfferStatus) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);

    return this.http.get<InsuranceOffer[]>(`${this.apiBaseUrl}/me/offers`, { params });
  }

  accept(offerId: string) {
    return this.http.post<void>(`${this.apiBaseUrl}/me/offers/${offerId}/accept`, {});
  }

  reject(offerId: string) {
    return this.http.post<void>(`${this.apiBaseUrl}/me/offers/${offerId}/reject`, {});
  }
}
