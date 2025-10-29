export interface Reservation {
  _id?: string; // Dodaj ten atrybut jako opcjonalny
  userId: string;
  restaurantId: string;
  date: string;
  time: string;
  seats: number;
  status?: string; // Opcjonalny atrybut dla statusu rezerwacji
}