using LibraryWPF.Data;
using LibraryWPF.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Windows;

namespace LibraryWPF.Views
{
    public partial class LibrarianPanel : Window
    {
        private readonly User _currentUser;

        public LibrarianPanel(User user)
        {
            InitializeComponent();
            _currentUser = user;
            Title = $"Panel Bibliotekarza - {_currentUser.Username}";
            LoadReservations();
        }

        // Ładowanie rezerwacji do listy
        private void LoadReservations()
        {
            using (var context = new AppDbContext())
            {
                var reservations = context.Reservations
                    .Include(r => r.Book)
                    .Include(r => r.User)
                    .Where(r => r.Status == "Oczekująca" || r.Status == "Gotowa do odbioru")
                    .OrderBy(r => r.ReservationDate)
                    .Select(r => new ReservationViewModel
                    {
                        ReservationId = r.ReservationId,
                        BookTitle = r.Book.Title,
                        Username = r.User.Username,
                        ReservationDate = r.ReservationDate,
                        Status = r.Status,
                        ExpirationDate = r.Status == "Gotowa do odbioru" ? r.ReservationDate.AddDays(4) : (DateTime?)null
                    })
                    .ToList();

                LstReservations.ItemsSource = reservations;
            }
        }

        // Oznaczanie rezerwacji jako "Gotowa do odbioru"
        private void BtnConfirmReservation_Click(object sender, RoutedEventArgs e)
        {
            if (LstReservations.SelectedItem is ReservationViewModel selectedReservation)
            {
                using (var context = new AppDbContext())
                {
                    var reservation = context.Reservations
                        .Include(r => r.Book)
                        .FirstOrDefault(r => r.ReservationId == selectedReservation.ReservationId);

                    if (reservation != null)
                    {
                        reservation.Status = "Gotowa do odbioru";
                        reservation.ReservationDate = DateTime.Now;  // Aktualizacja daty na rozpoczęcie 4-dniowego okresu
                        reservation.Book.Status = "Zarezerwowana";
                        context.SaveChanges();

                        MessageBox.Show("Rezerwacja została potwierdzona. Użytkownik ma 4 dni na odbiór książki.", "Sukces", MessageBoxButton.OK, MessageBoxImage.Information);
                        LoadReservations();
                    }
                }
            }
            else
            {
                MessageBox.Show("Proszę wybrać rezerwację do potwierdzenia.", "Błąd", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        // Usuwanie rezerwacji (np. po terminie odbioru)
        private void BtnDeleteReservation_Click(object sender, RoutedEventArgs e)
        {
            if (LstReservations.SelectedItem is ReservationViewModel selectedReservation)
            {
                using (var context = new AppDbContext())
                {
                    var reservation = context.Reservations
                        .Include(r => r.Book)
                        .FirstOrDefault(r => r.ReservationId == selectedReservation.ReservationId);

                    if (reservation != null)
                    {
                        reservation.Book.Status = "Dostępna";  // Zmiana statusu książki na Dostępna
                        context.Reservations.Remove(reservation);
                        context.SaveChanges();

                        MessageBox.Show("Rezerwacja została usunięta.", "Sukces", MessageBoxButton.OK, MessageBoxImage.Information);
                        LoadReservations();
                    }
                }
            }
            else
            {
                MessageBox.Show("Proszę wybrać rezerwację do usunięcia.", "Błąd", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        // Oznaczanie rezerwacji jako "Zrealizowana" po wypożyczeniu książki
        private void MarkReservationAsCompleted(int reservationId)
        {
            using (var context = new AppDbContext())
            {
                var reservation = context.Reservations.FirstOrDefault(r => r.ReservationId == reservationId);
                if (reservation != null)
                {
                    reservation.Status = "Zrealizowana";
                    context.SaveChanges();
                }
            }
            LoadReservations();  // Odświeżenie listy rezerwacji
        }

        private void BtnLoan_Click(object sender, RoutedEventArgs e)
        {
            var loanBookWindow = new LoanBookWindow();
            loanBookWindow.ShowDialog();  // Poczekaj na zamknięcie okna wypożyczenia

            // Sprawdzenie i oznaczenie rezerwacji jako zrealizowanej
            if (LstReservations.SelectedItem is ReservationViewModel selectedReservation)
            {
                MarkReservationAsCompleted(selectedReservation.ReservationId);
            }
        }

        private void BtnReturnBook_Click(object sender, RoutedEventArgs e)
        {
            var returnBookWindow = new ReturnBookWindow();
            returnBookWindow.Show();
        }

        private void BtnOpenBookSearch_Click(object sender, RoutedEventArgs e)
        {
            var bookSearchWindow = new BookSearchWindow();
            bookSearchWindow.Show();
        }

        private void BtnManageBooks_Click(object sender, RoutedEventArgs e)
        {
            var manageBooksWindow = new ManageBooksWindow();
            manageBooksWindow.Show();
        }

        private void BtnLogout_Click(object sender, RoutedEventArgs e)
        {
            var loginWindow = new LoginWindow();
            loginWindow.Show();

            foreach (Window window in Application.Current.Windows)
            {
                if (window is not LoginWindow)
                {
                    window.Close();
                }
            }
        }

        private void TabControl_SelectionChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
        {
            if (e.Source is System.Windows.Controls.TabControl)
            {
                switch (((System.Windows.Controls.TabControl)sender).SelectedIndex)
                {
                    case 1:
                        LoadReservations();
                        break;
                }
            }
        }
    }

    public class ReservationViewModel
    {
        public int ReservationId { get; set; }
        public string BookTitle { get; set; }
        public string Username { get; set; }
        public DateTime ReservationDate { get; set; }
        public string Status { get; set; }
        public DateTime? ExpirationDate { get; set; }
    }
}
