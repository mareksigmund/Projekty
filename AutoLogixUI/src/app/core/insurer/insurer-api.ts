import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

import { OfferRequest, OfferRequestStatus } from '../models/offer-request.model';
import { Offer, OfferStatus } from '../models/offer.model';
import { CreateInsurerOfferPayload, InsurerVehicleDetails } from '../models/insurance.model';
import { InsurerOfferRequest } from '../models/insurer-offer-request.model';
import { ServiceEntryListItem } from '../models/service.model';

@Injectable({ providedIn: 'root' })
export class InsurerApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getOfferRequests(status?: OfferRequestStatus) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);

    return this.http.get<InsurerOfferRequest[]>(`${this.apiBaseUrl}/insurer/offer-requests`, {
      params,
    });
  }

  createOffer(payload: CreateInsurerOfferPayload) {
    return this.http.post<void>(`${this.apiBaseUrl}/insurer/offers`, payload);
  }

  getMyOffers(status?: OfferStatus) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);

    return this.http.get<Offer[]>(`${this.apiBaseUrl}/insurer/offers`, { params });
  }

  getVehicleById(vehicleId: string) {
    return this.http.get<any>(`${this.apiBaseUrl}/insurer/vehicles/${vehicleId}`);
  }

  getVehicleDetails(vehicleId: string) {
    return this.http.get<InsurerVehicleDetails>(`${this.apiBaseUrl}/insurer/vehicles/${vehicleId}`);
  }

  getVehicleServices(vehicleId: string, page: number, pageSize: number) {
    const params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    return this.http.get<{
      items: ServiceEntryListItem[];
      totalCount: number;
      page: number;
      pageSize: number;
    }>(`${this.apiBaseUrl}/insurer/vehicles/${vehicleId}/services`, { params });
  }
}
