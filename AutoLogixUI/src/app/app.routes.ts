import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Shell } from './layout/shell/shell';
import { Vehicles } from './features/vehicles/vehicles';
import { authGuard } from './core/auth/auth-guard';
import { VehicleForm } from './features/vehicles/vehicle-form/vehicle-form';
import { VehicleDetailsComponent } from './features/vehicles/vehicle-details/vehicle-details';
import { ServiceForm } from './features/services/service-form/service-form';
import { InsuranceExpiring } from './features/insurance/insurance-expiring/insurance-expiring';
import { OfferRequestForm } from './features/offers/offer-request-form/offer-request-form';
import { OfferRequests } from './features/offers/offer-requests/offer-requests';
import { Dashboard } from './features/dashboard/dashboard/dashboard';
import { Offers } from './features/offers/offers/offers';
import { InsurerOfferRequests } from './features/insurer/insurer-offer-requests/insurer-offer-requests';
import { InsurerOfferForm } from './features/insurer/insurer-offer-form/insurer-offer-form';
import { InsurerVehicleDetailsComponent } from './features/insurer/insurer-vehicle-details/insurer-vehicle-details';
import { InsurerOffers } from './features/insurer/insurer-offers/insurer-offers';
import { ServiceList } from './features/services/service-list/service-list';
import { AuthShell } from './features/auth/auth-shell/auth-shell';

export const routes: Routes = [
  // public
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: AuthShell },
  { path: 'register', component: AuthShell },

  // protected
  {
    path: 'app',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      { path: 'dashboard', component: Dashboard },

      // Vehicles
      { path: 'vehicles', component: Vehicles },
      { path: 'vehicles/new', component: VehicleForm },
      { path: 'vehicles/:id/edit', component: VehicleForm },
      { path: 'vehicles/:id', component: VehicleDetailsComponent },

      // Services
      { path: 'vehicles/:vehicleId/services', component: ServiceList },
      { path: 'vehicles/:vehicleId/services/new', component: ServiceForm },
      { path: 'vehicles/:vehicleId/services/:id/edit', component: ServiceForm },

      // Insurance + offers
      { path: 'insurance', component: InsuranceExpiring },
      { path: 'insurer/offer-requests', component: InsurerOfferRequests },
      { path: 'insurer/offers/new', component: InsurerOfferForm },
      { path: 'insurer/vehicles/:id', component: InsurerVehicleDetailsComponent },
      { path: 'insurer/offers', component: InsurerOffers },

      // Offer requests (new before list)
      { path: 'offer-requests/new', component: OfferRequestForm },
      { path: 'offer-requests', component: OfferRequests },

      // Offers
      { path: 'offers', component: Offers },
    ],
  },

  // fallback
  { path: '**', redirectTo: 'login' },
];
