import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PagedResponse } from '../models/vehicle.model';
import { ServiceVehicleListItem } from '../models/service-vehicle.model';

export type ServiceVehicleDetails = ServiceVehicleListItem & {
  fuelType?: string | null;
  engineCapacity?: number | null;
  enginePowerHp?: number | null;
};
@Injectable({
  providedIn: 'root',
})
export class ServiceVehiclesApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  searchVehicles(query: string, page: number, pageSize: number) {
    const params = new HttpParams()
      .set('query', query)
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.http.get<PagedResponse<ServiceVehicleListItem>>(
      `${this.apiBaseUrl}/service/vehicles`,
      { params }
    );
  }

  getRecent(take: number) {
    const params = new HttpParams().set('take', String(take));
    return this.http.get<ServiceVehicleListItem[]>(`${this.apiBaseUrl}/service/vehicles/recent`, {
      params,
    });
  }

  getById(id: string) {
    return this.http.get<ServiceVehicleDetails>(`${this.apiBaseUrl}/service/vehicles/${id}`);
  }
}
