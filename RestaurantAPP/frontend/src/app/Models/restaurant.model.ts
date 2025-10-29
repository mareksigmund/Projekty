export interface Table {
  size: number;
  count: number;
}

export interface MenuItem {
  name: string;
  description: string;
  price: number;
}

export interface Rating {
  _id: string;
  rating: number;
  comment: string;
  user: string;
}

export interface Table {
  size: number;
  count: number;
}

export interface Restaurant {
  _id: string;
  name: string;
  description: string;
  tables: Table[];
  availableTables: Table[];
  rating: number;
  ratingCount: number;
  images: string[];
  menu: { name: string; description: string; price: number }[];
  category: string;
  priceRange: string;
  location: string;
  cuisine: string;
}