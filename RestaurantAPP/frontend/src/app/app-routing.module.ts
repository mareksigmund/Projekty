import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './Components/home/home.component';
import { RegisterComponent } from './Components/register/register.component';
import { RestaurantDetailComponent } from './Components/restaurant-detail/restaurant-detail.component';
import{RestaurantListComponent} from './Components/restaurant-list/restaurant-list.component';
import { UserPanelComponent } from './Components/user-panel/user-panel.component';
import { AuthGuard } from './guards/auth.guard';
import { ReservationComponent } from './Components/reservation/reservation.component';
import { RecommendationsComponent } from './Components/recommendations/recommendations.component';

const routes: Routes = [
  {path:'',component : HomeComponent},
  { path: 'login', component: RegisterComponent, data: { isLoginMode: true } },
  {path:'register',component:RegisterComponent },
  { path: 'restaurant/:name', component: RestaurantDetailComponent },
  {path:'restaurants', component:RestaurantListComponent},
  {path:'register',component:RegisterComponent},
  { path: 'user-panel', component: UserPanelComponent, canActivate: [AuthGuard] },
  { path: 'reservation/:id', component: ReservationComponent },
  { path: 'recommendations', component: RecommendationsComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
