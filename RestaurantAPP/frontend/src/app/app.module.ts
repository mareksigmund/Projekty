import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavbarComponent } from './Components/navbar/navbar.component';
import { HomeComponent } from './Components/home/home.component';

import { RegisterComponent } from './Components/register/register.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
//Materails impotrs
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card'; // Dodanie MatCardModule
import { MatSidenavModule } from '@angular/material/sidenav'; // Dodanie MatSidenavModule
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RestaurantDetailComponent } from './Components/restaurant-detail/restaurant-detail.component';
import { RestaurantListComponent } from './Components/restaurant-list/restaurant-list.component';
import { MatListModule } from '@angular/material/list';

import { FormsModule } from '@angular/forms';
import { UserPanelComponent } from './Components/user-panel/user-panel.component';
import { ReservationComponent } from './Components/reservation/reservation.component';
import { RecommendationsComponent } from './Components/recommendations/recommendations.component';


@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    RegisterComponent,
    RestaurantDetailComponent,
    RestaurantListComponent,
    UserPanelComponent,
    ReservationComponent,
    RecommendationsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSidenavModule,
    MatListModule,
    NgbModule,
    HttpClientModule,
    FontAwesomeModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
