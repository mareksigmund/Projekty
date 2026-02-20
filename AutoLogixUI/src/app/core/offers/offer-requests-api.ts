import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  CreateOfferRequest,
  OfferRequest,
  OfferRequestStatus,
} from '../models/offer-request.model';

@Injectable({ providedIn: 'root' })
export class OfferRequestsApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getMyRequests(status?: OfferRequestStatus) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);

    return this.http.get<OfferRequest[]>(`${this.apiBaseUrl}/me/offer-requests`, { params });
  }

  create(payload: CreateOfferRequest) {
    return this.http.post<void>(`${this.apiBaseUrl}/me/offer-requests`, payload);
  }

  cancel(id: string) {
    return this.http.post<void>(`${this.apiBaseUrl}/me/offer-requests/${id}/cancel`, {});
  }
}
