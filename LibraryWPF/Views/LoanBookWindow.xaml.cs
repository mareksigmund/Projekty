using LibraryWPF.Data;
using LibraryWPF.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace LibraryWPF.Views
{
    /// <summary>
    /// Logika interakcji dla klasy LoanBookWindow.xaml
    /// </summary>
    public partial class LoanBookWindow : Window
    {
        private readonly AppDbContext _context;

        public LoanBookWindow()
        {
            InitializeComponent();
            _context = new AppDbContext();
            LoadBooksAndUsers();
        }
        private void LoadBooksAndUsers()
        {
            var availableBooks = _context.Books.Where(b => b.Status == "Dostępna" || b.Status=="Zarezerwowana").ToList();
            LstBooks.ItemsSource = availableBooks;

            var readers = _context.Users.Where(u => u.Role == "Czytelnik").ToList();
            LstUsers.ItemsSource = readers;
        }
        private void TxtSearchBooks_TextChanged(object sender, System.Windows.Controls.TextChangedEventArgs e)
        {
            string searchQuery = TxtSearchBooks.Text.ToLower();
            var filteredBooks = _context.Books
                .Where(b => b.Title.ToLower().Contains(searchQuery))
                .ToList();
            LstBooks.ItemsSource = filteredBooks;
        }

        private void TxtSearchUsers_TextChanged(object sender, System.Windows.Controls.TextChangedEventArgs e)
        {
            string searchQuery = TxtSearchUsers.Text.ToLower();
            var filteredUsers = _context.Users
                .Where(u => u.Username.ToLower().Contains(searchQuery))
                .ToList();
            LstUsers.ItemsSource = filteredUsers;
        }

        private void BtnLoanBook_Click(object sender, RoutedEventArgs e)
        {
            if (LstBooks.SelectedItem is Book selectedBook &&
                LstUsers.SelectedItem is User selectedUser &&
                DtpEndDate.SelectedDate.HasValue)
            {
                var loan = new Loan
                {
                    BookId = selectedBook.Id,
                    UserId = selectedUser.Id,
                    StartDate = DateTime.Now,
                    EndDate = DtpEndDate.SelectedDate.Value,
                    Status = "Aktywne"
                };

                selectedBook.Status = "Wypożyczona";
                _context.Loans.Add(loan);
                _context.SaveChanges();

                // Wywołanie metody, aby oznaczyć rezerwację jako zrealizowaną
                MarkReservationAsCompleted(selectedBook.Id, selectedUser.Id);

                MessageBox.Show("Książka została wypożyczona!", "Sukces", MessageBoxButton.OK, MessageBoxImage.Information);
                this.Close();
            }
            else
            {
                MessageBox.Show("Proszę wybrać książkę, użytkownika i datę zakończenia wypożyczenia.", "Błąd", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }


        private void MarkReservationAsCompleted(int bookId, int userId)
        {
            using (var context = new AppDbContext())
            {
                var reservation = context.Reservations
                    .FirstOrDefault(r => r.BookId == bookId && r.UserId == userId && r.Status == "Gotowa do odbioru");

                if (reservation != null)
                {
                    reservation.Status = "Zrealizowana";
                    context.SaveChanges();
                }
            }
        }

    }
}


