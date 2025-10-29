using LibraryWPF.Data;
using LibraryWPF.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Text;
using System.Windows;
using System.Windows.Controls;

namespace LibraryWPF.Views
{
    public partial class ReaderPanel : Window
    {
        private readonly User _currentUser;

        public ReaderPanel(User user)
        {
            InitializeComponent();
            _currentUser = user;
            Title = $"Panel Czytelnika - {_currentUser.Username}";

            LoadAvailableBooks();
            LoadMyLoans();
            LoadUnavailableBooks();
            LoadMyReservations();
            ShowUpcomingDueDates();
        }

        // Ładowanie dostępnych książek
        private void LoadAvailableBooks()
        {
            using (var context = new AppDbContext())
            {
                var availableBooks = context.Books
                    .Where(b => b.Status == "Dostępna")
                    .ToList();

                LstAvailableBooks.ItemsSource = availableBooks;
            }
        }

        private void LoadMyReservations()
        {
            using (var context = new AppDbContext())
            {
                var myReservations = context.Reservations
                    .Include(r => r.Book)
                    .Where(r => r.UserId == _currentUser.Id && (r.Status == "Oczekująca" || r.Status == "Gotowa do odbioru"))
                    .ToList();

                var enrichedReservations = myReservations.Select(r =>
                {
                    int positionInQueue = 0;
                    string estimatedDays = "N/A";

                    if (r.Status == "Oczekująca")
                    {
                        var allReservations = context.Reservations
                            .Where(res => res.BookId == r.BookId && res.Status == "Oczekująca")
                            .OrderBy(res => res.ReservationDate)
                            .ToList();

                        positionInQueue = allReservations.IndexOf(r) + 1;

                        if (positionInQueue == 1)
                        {
                            var activeLoan = context.Loans
                                .Where(l => l.BookId == r.BookId && l.Status == "Aktywne")
                                .OrderBy(l => l.EndDate)
                                .FirstOrDefault();

                            if (activeLoan != null)
                            {
                                int daysLeft = (activeLoan.EndDate - DateTime.Now).Days + 1;
                                estimatedDays = $"{Math.Max(daysLeft, 0)} dni";
                            }
                        }
                    }
                    else if (r.Status == "Gotowa do odbioru")
                    {
                        DateTime expirationDate = r.ReservationDate.AddDays(4);
                        estimatedDays = (expirationDate - DateTime.Now).TotalDays > 0
                            ? $"{Math.Ceiling((expirationDate - DateTime.Now).TotalDays)} dni"
                            : "Minął termin odbioru";
                    }

                    return new
                    {
                        r.ReservationId,
                        Title = r.Book.Title,
                        r.ReservationDate,
                        r.Status,
                        PositionInQueue = r.Status == "Oczekująca" ? positionInQueue : 0,
                        EstimatedDays = estimatedDays
                    };
                }).ToList();

                LstMyReservations.ItemsSource = enrichedReservations;
            }
        }




        private void LoadUnavailableBooks()
        {
            using (var context = new AppDbContext())
            {
                var unavailableBooks = context.Books
                    .Where(b => (b.Status == "Wypożyczona" || b.Status == "W transporcie" || b.Status == "Zarezerwowana") &&
                                !context.Loans.Any(l => l.BookId == b.Id && l.UserId == _currentUser.Id && l.Status == "Aktywne"))
                    .ToList();

                LstUnavailableBooks.ItemsSource = unavailableBooks;
            }
        }



        // Ładowanie aktywnych wypożyczeń użytkownika
        private void LoadMyLoans()
        {
            using (var context = new AppDbContext())
            {
                var myLoans = context.Loans
                    .Where(l => l.UserId == _currentUser.Id && l.Status == "Aktywne")
                    .Select(l => new
                    {
                        l.Book,
                        l.EndDate,
                        l.Status,
                        DaysLeft = (l.EndDate - DateTime.Now).Days >= 0 ? (l.EndDate - DateTime.Now).Days + 1 : 0

                    })
                    .ToList();
                LstMyLoans.ItemsSource = myLoans;
            }
        }



        // Pokazanie komunikatu dla książek, których termin zwrotu zbliża się do końca
        private void ShowUpcomingDueDates()
        {
            using (var context = new AppDbContext())
            {
                var upcomingDueLoans = context.Loans
                    .Include(l => l.Book)
                    .Where(l => l.UserId == _currentUser.Id && l.Status == "Aktywne")
                    .AsEnumerable()  // Przeniesienie na poziom pamięci
                    .Where(l => (l.EndDate - DateTime.Now).TotalDays <= 3)
                    .ToList();

                if (upcomingDueLoans.Any())
                {
                    StringBuilder message = new StringBuilder("Uwaga! Zbliża się termin zwrotu dla następujących książek:\n");
                    foreach (var loan in upcomingDueLoans)
                    {
                        int daysLeft = (loan.EndDate - DateTime.Now).Days + 1;
                        message.AppendLine($"- \"{loan.Book.Title}\": pozostało {Math.Max(daysLeft, 0)} dni.");
                    }

                    MessageBox.Show(message.ToString(), "Zbliżający się termin zwrotu", MessageBoxButton.OK, MessageBoxImage.Warning);
                }
            }

        }


        // Filtr dla dostępnych książek
        private void TxtSearchBooks_TextChanged(object sender, System.Windows.Controls.TextChangedEventArgs e)
        {
            string searchQuery = TxtSearchBooks.Text.ToLower();
            using (var context = new AppDbContext())
            {
                var filteredBooks = context.Books
                    .Where(b => b.Status == "Dostępna" && (b.Title.ToLower().Contains(searchQuery) || b.Author.ToLower().Contains(searchQuery)))
                    .ToList();

                LstAvailableBooks.ItemsSource = filteredBooks;
            }
        }

        private void BtnLogout_Click(object sender, RoutedEventArgs e)
        {
            var loginWindow = new LoginWindow();
            loginWindow.Show();

            // Zamknięcie bieżącego okna
            this.Close();
        }

        private void BtnReserveBook_Click(object sender, RoutedEventArgs e)
        {
            if (LstUnavailableBooks.SelectedItem is Book selectedBook)
            {
                using (var context = new AppDbContext())
                {
                    bool alreadyReservedOrBorrowed = context.Reservations
                        .Any(r => r.BookId == selectedBook.Id && r.UserId == _currentUser.Id && (r.Status == "Oczekująca" || r.Status == "Gotowa do odbioru")) ||
                        context.Loans.Any(l => l.BookId == selectedBook.Id && l.UserId == _currentUser.Id && l.Status == "Aktywne");

                    if (alreadyReservedOrBorrowed)
                    {
                        MessageBox.Show("Nie możesz zarezerwować tej książki, ponieważ jest już przez Ciebie wypożyczona lub zarezerwowana.", "Błąd", MessageBoxButton.OK, MessageBoxImage.Error);
                        return;
                    }

                    var newReservation = new Reservation
                    {
                        BookId = selectedBook.Id,
                        UserId = _currentUser.Id,
                        ReservationDate = DateTime.Now,
                        Status = "Oczekująca"
                    };

                    context.Reservations.Add(newReservation);
                    context.SaveChanges();

                    MessageBox.Show("Książka została zarezerwowana!", "Sukces", MessageBoxButton.OK, MessageBoxImage.Information);
                    LoadUnavailableBooks(); // Odśwież listę książek
                }
            }
            else
            {
                MessageBox.Show("Proszę wybrać książkę do zarezerwowania.", "Błąd", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }



        private void BtnCancelReservation_Click(object sender, RoutedEventArgs e)
        {
            if (LstMyReservations.SelectedItem is not null)
            {
                var selectedReservationId = (int)((dynamic)LstMyReservations.SelectedItem).ReservationId;

                using (var context = new AppDbContext())
                {
                    var reservation = context.Reservations.FirstOrDefault(r => r.ReservationId == selectedReservationId);

                    if (reservation != null)
                    {
                        context.Reservations.Remove(reservation);
                        context.SaveChanges();

                        MessageBox.Show("Rezerwacja została anulowana.", "Sukces", MessageBoxButton.OK, MessageBoxImage.Information);
                        LoadMyReservations(); // Odświeżenie listy rezerwacji
                    }
                    else
                    {
                        MessageBox.Show("Nie znaleziono wybranej rezerwacji.", "Błąd", MessageBoxButton.OK, MessageBoxImage.Error);
                    }
                }
            }
            else
            {
                MessageBox.Show("Proszę wybrać rezerwację do anulowania.", "Błąd", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }


        private void TabControl_SelectionChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
        {
            if (e.Source is TabControl)
            {
                switch (((TabControl)sender).SelectedIndex)
                {
                    case 0:
                        LoadAvailableBooks();
                        break;
                    case 1:
                        LoadMyLoans();
                        break;
                    case 2:
                        LoadUnavailableBooks();
                        break;
                    case 3:
                        LoadMyReservations();
                        break;
                }
            }
        }

    }
}
