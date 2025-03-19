import { Component } from '@angular/core';
import { Restaurant } from 'src/app/Models/restaurant.model';
import { User } from 'src/app/Models/user.model';
import { AuthServiceService } from 'src/app/services/auth-service.service';
import { RestaurantService } from 'src/app/services/restaurant.service';
import { faStar as faStarSolid, faStarHalfAlt, faStar as faStarRegular } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-recommendations',
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.css']
})
export class RecommendationsComponent {
  recommendedRestaurants: Restaurant[] = [];
  recommendedUser: User | null = null;
  userRatingsWithRestaurants: any[] = [];

  // FontAwesome icons
  faStarSolid = faStarSolid;
  faStarHalfAlt = faStarHalfAlt;
  faStarRegular = faStarRegular;

  constructor(
    private restaurantService: RestaurantService,
    private authService: AuthServiceService
  ) { }

  ngOnInit(): void {
    this.restaurantService.getRestaurantRecommendations().subscribe((data) => {
      this.recommendedRestaurants = data;
    });

    this.restaurantService.getUserRecommendation().subscribe((data) => {
      this.recommendedUser = data;
      if (this.recommendedUser && this.recommendedUser._id) {
        this.getUserRatingsWithRestaurants(this.recommendedUser._id);
      }
    });
  }

  getUserRatingsWithRestaurants(userId: string): void {
    this.restaurantService.getUserRatingsWithRestaurants(userId).subscribe((ratings) => {
      this.userRatingsWithRestaurants = ratings;
    });
  }

  getStars(rating: number) {
    let fullStars = Math.floor(rating);
    let halfStar = rating % 1 >= 0.5 ? 1 : 0;
    let emptyStars = 5 - fullStars - halfStar;
    return { fullStars: Array(fullStars).fill(0), halfStar: Array(halfStar).fill(0), emptyStars: Array(emptyStars).fill(0) };
  }

  prev() {
    const carousel = document.querySelector('.carousel');
    if (carousel) {
      carousel.scrollBy({ left: -300, behavior: 'smooth' });
    }
  }

  next() {
    const carousel = document.querySelector('.carousel');
    if (carousel) {
      carousel.scrollBy({ left: 300, behavior: 'smooth' });
    }
  }
}