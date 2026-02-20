import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PagedResponse } from '../models/vehicle.model';
import {
  ServiceEntryDetails,
  ServiceEntryFormModel,
  ServiceEntryListItem,
} from '../models/service.model';

@Injectable({
  providedIn: 'root',
})
export class ServicesApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getServices(vehicleId: string, page: number, pageSize: number) {
    const params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));

    return this.http.get<PagedResponse<ServiceEntryListItem>>(
      `${this.apiBaseUrl}/vehicles/${vehicleId}/services`,
      { params }
    );
  }
  getServiceById(vehicleId: string, id: string) {
    return this.http.get<ServiceEntryDetails>(
      `${this.apiBaseUrl}/vehicles/${vehicleId}/services/${id}`
    );
  }

  createService(vehicleId: string, payload: ServiceEntryFormModel) {
    return this.http.post<ServiceEntryDetails>(
      `${this.apiBaseUrl}/vehicles/${vehicleId}/services`,
      payload
    );
  }

  updateService(vehicleId: string, id: string, payload: ServiceEntryFormModel) {
    return this.http.put<ServiceEntryDetails>(
      `${this.apiBaseUrl}/vehicles/${vehicleId}/services/${id}`,
      payload
    );
  }

  deleteService(vehicleId: string, id: string) {
    return this.http.delete<void>(`${this.apiBaseUrl}/vehicles/${vehicleId}/services/${id}`);
  }
}
