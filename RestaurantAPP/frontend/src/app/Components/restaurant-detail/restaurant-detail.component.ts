import { Component, OnInit } from '@angular/core';
import { RestaurantService } from 'src/app/services/restaurant.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Restaurant } from '../../Models/restaurant.model';
import { AuthServiceService } from 'src/app/services/auth-service.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { faStar as faStarSolid, faStarHalfAlt, faStar as faStarRegular } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-restaurant-detail',
  templateUrl: './restaurant-detail.component.html',
  styleUrls: ['./restaurant-detail.component.css']
})
export class RestaurantDetailComponent implements OnInit {

  restaurant: Restaurant | null = null;
  rating: number = 0;
  comment: string = '';
  submitted: boolean = false;
  isLoggedIn: boolean = false;
  userRating: any = null;
  mainImage: string | undefined;
  sideImages: string[] = [];
  userRatings: any[] = []; // Zmienna do przechowywania ocen użytkowników
  // FontAwesome icons
  faStarSolid = faStarSolid;
  faStarHalfAlt = faStarHalfAlt;
  faStarRegular = faStarRegular;

  constructor(
    private route: ActivatedRoute,
    private restaurantService: RestaurantService,
    private authService: AuthServiceService,
    public router: Router,
    private modalService: NgbModal,
  ) { }

  ngOnInit(): void {
    const name = this.route.snapshot.paramMap.get('name');
    if (name) {
      this.restaurantService.getRestaurantByName(name).subscribe((data) => {
        this.restaurant = data;
        if (this.isLoggedIn) {
          this.checkUserRating(data._id);
        }
        if (this.restaurant && this.restaurant.images.length > 0) {
          this.mainImage = this.restaurant.images[0];
          this.sideImages = this.restaurant.images.slice(1, 3);
        }
        this.loadUserRatings(this.restaurant._id);
      });
      
    }
    this.isLoggedIn = this.authService.isAuthenticated();
  }

  submitRating(): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    if (this.restaurant) {
      this.restaurantService.rateRestaurant(this.restaurant._id, this.rating, this.comment).subscribe(
        () => {
          this.submitted = true;
          this.checkUserRating(this.restaurant!._id);
          this.refreshRestaurantData(); // Odśwież dane po wysłaniu oceny
        },
        (error) => {
          console.error('Error submitting rating:', error);
        }
      );
    }
  }

  refreshRestaurantData(): void {
    if (this.restaurant) {
      this.restaurantService.getRestaurant(this.restaurant._id).subscribe((data) => {
        this.restaurant = data;
      });
    }
  }

  checkUserRating(restaurantId: string): void {
    this.restaurantService.getUserRating(restaurantId).subscribe(
      (rating) => {
        this.userRating = rating;
        this.submitted = true;
      },
      (error) => {
        this.userRating = null;
      }
    );
  }

  changeImage(image: string): void {
    if (this.mainImage) {
      const temp = this.mainImage;
      this.mainImage = image;
      const index = this.sideImages.indexOf(image);
      if (index > -1) {
        this.sideImages[index] = temp;
      }
    }
  }

  openMenuModal(content: any): void {
    this.modalService.open(content, { size: 'lg' });
  }

  loadUserRatings(restaurantId: string): void {
    this.restaurantService.getUserRatings(restaurantId).subscribe(
      (ratings) => {
        this.userRatings = ratings;
        this.loadUserAvatars(); // Pobierz awatary po załadowaniu ocen
      },
      (error) => {
        console.error('Error loading user ratings:', error);
      }
    );
  }

  loadUserAvatars(): void {
    this.userRatings.forEach(rating => {
      this.authService.getUserAvatar(rating.user._id).subscribe(
        (avatarUrl) => {
          rating.user.avatar = avatarUrl;
        },
        (error) => {
          console.error('Error loading user avatar:', error);
        }
      );
    });
  }

  goToReservation(): void {
    if (this.restaurant) {
      this.router.navigate(['/reservation', this.restaurant._id]);
    }
  }
}