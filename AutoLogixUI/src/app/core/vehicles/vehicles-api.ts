import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { VehicleDetails, VehicleFormModel, VehicleListItem } from '../models/vehicle.model';

@Injectable({
  providedIn: 'root',
})
export class VehiclesApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getVehicles(page: number, pageSize: number) {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<{ items: VehicleListItem[]; totalCount: number }>(
      `${this.apiBaseUrl}/vehicles`,
      { params }
    );
  }

  createVehicle(payload: VehicleFormModel) {
    return this.http.post<void>(`${this.apiBaseUrl}/vehicles`, payload);
  }

  getVehicleById(id: string) {
    return this.http.get<VehicleDetails>(`${this.apiBaseUrl}/vehicles/${id}`);
  }

  updateVehicle(id: string, payload: VehicleFormModel) {
    return this.http.put<void>(`${this.apiBaseUrl}/vehicles/${id}`, payload);
  }

  deleteVehicle(id: string) {
    return this.http.delete<void>(`${this.apiBaseUrl}/vehicles/${id}`);
  }
}
