import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { VehiclesApi } from '../../core/vehicles/vehicles-api';
import { VehicleListItem } from '../../core/models/vehicle.model';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatTableModule],
  templateUrl: './vehicles.html',
  styleUrl: './vehicles.scss',
})
export class Vehicles implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);
  items = signal<VehicleListItem[]>([]);

  // MVP: jedna strona
  private readonly pageSize = 50;

  cols = ['vehicle', 'registration', 'year', 'mileage', 'offers', 'actions'];

  constructor(private vehiclesApi: VehiclesApi) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    this.vehiclesApi.getVehicles(1, this.pageSize).subscribe({
      next: (response) => {
        this.items.set(response.items ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Błąd podczas ładowania pojazdów');
        this.loading.set(false);
      },
    });
  }

  offersText(v: VehicleListItem) {
    return v.allowInsuranceOffers ? 'TAK' : 'NIE';
  }
}
