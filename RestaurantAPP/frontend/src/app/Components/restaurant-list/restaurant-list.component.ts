import { Component,HostListener,OnInit } from '@angular/core';
import { RestaurantService } from 'src/app/services/restaurant.service';
import { ActivatedRoute } from '@angular/router';
import { Restaurant } from '../../Models/restaurant.model';
import { Router } from '@angular/router';
import { faStar as faStarSolid, faStarHalfAlt, faStar as faStarRegular } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-restaurant-list',
  templateUrl: './restaurant-list.component.html',
  styleUrls: ['./restaurant-list.component.css']
})
export class RestaurantListComponent implements OnInit {
  restaurants: Restaurant[] = []; // Lista restauracji
  filteredRestaurants: Restaurant[] = []; // Lista filtrowanych restauracji

  filters = {
    name: '',
    category: '',
    priceRange: '',
    location: '',
    cuisine: ''
  };

  isScrollButtonVisible = false;
  areFiltersApplied = false;

  faStarSolid = faStarSolid;
  faStarHalfAlt = faStarHalfAlt;
  faStarRegular = faStarRegular;

  constructor(private restaurantService: RestaurantService, private router: Router) { }

  ngOnInit(): void {
    this.restaurantService.getRestaurants().subscribe((restaurants) => {
      this.restaurants = restaurants;
      this.filteredRestaurants = this.restaurants;
    });
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

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrollButtonVisible = window.pageYOffset > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  applyFilters() {
    this.filteredRestaurants = this.restaurants.filter(restaurant => {
      return (
        (this.filters.name === '' || restaurant.name.toLowerCase().includes(this.filters.name.toLowerCase())) &&
        (this.filters.category === '' || restaurant.category === this.filters.category) &&
        (this.filters.priceRange === '' || restaurant.priceRange === this.filters.priceRange) &&
        (this.filters.location === '' || restaurant.location === this.filters.location) &&
        (this.filters.cuisine === '' || restaurant.cuisine === this.filters.cuisine)
      );
    });
    this.checkIfFiltersAreApplied();
  }

  clearFilters() {
    this.filters = {
      name: '',
      category: '',
      priceRange: '',
      location: '',
      cuisine: ''
    };
    this.filteredRestaurants = this.restaurants; // Przywróć pełną listę restauracji
    this.checkIfFiltersAreApplied();
  }

  checkIfFiltersAreApplied() {
    this.areFiltersApplied = !!this.filters.name || !!this.filters.category || !!this.filters.priceRange || !!this.filters.location || !!this.filters.cuisine;
  }
}