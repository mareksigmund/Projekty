import { Component,OnInit } from '@angular/core';
import { RestaurantService } from '../../services/restaurant.service';
import { Router } from '@angular/router';
import { faStar as faStarSolid, faStarHalfAlt, faStar as faStarRegular } from '@fortawesome/free-solid-svg-icons';
import { Restaurant } from 'src/app/Models/restaurant.model';
import { AuthServiceService } from 'src/app/services/auth-service.service';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  restaurants: Restaurant[]=[];
  topRestaurants: Restaurant[]=[];
  futureRecommendationPlaceholder=true;
  
  // FontAwesome icons
 faStarSolid = faStarSolid;
 faStarHalfAlt = faStarHalfAlt;
 faStarRegular = faStarRegular;
 isLoggedIn: boolean = false; 
  constructor(private restaurantService: RestaurantService, private router:Router,private authService: AuthServiceService) { }

  ngOnInit(): void {
    this.restaurantService.getRestaurants().subscribe((data) => {
      this.restaurants = data;
    });

    this.restaurantService.getTopRestaurants().subscribe((data) => {
      this.topRestaurants = data;
    });
    this.isLoggedIn = this.authService.isAuthenticated();
  }

  showAllRestaurants(): void {
    this.router.navigate(['/restaurants']);
  }

  viewDetails(name: string): void {
    const encodedName = name.replace(/ /g, '_');
    this.router.navigate(['/restaurant', encodedName]);
  }
  getStars(rating: number) {
    let fullStars = Math.floor(rating);
    let halfStar = rating % 1 >= 0.5 ? 1 : 0;
    let emptyStars = 5 - fullStars - halfStar;
    return { fullStars: Array(fullStars).fill(0), halfStar: Array(halfStar).fill(0), emptyStars: Array(emptyStars).fill(0) };
  }

  showRecommendations(): void {
    this.router.navigate(['/recommendations']);
  }

}
