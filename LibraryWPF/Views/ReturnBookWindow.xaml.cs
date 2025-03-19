using LibraryWPF.Data;
using LibraryWPF.Models;
using Microsoft.EntityFrameworkCore;
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
    /// Logika interakcji dla klasy ReturnBookWindow.xaml
    /// </summary>
    public partial class ReturnBookWindow : Window
    {
        private readonly AppDbContext _context;

        public ReturnBookWindow()
        {
            InitializeComponent();
            _context = new AppDbContext();
            LoadLoans();
        }

        private void LoadLoans()
        {
            var activeLoans = _context.Loans
                .Include(l => l.Book)  // Załaduj relację z tabelą Book
                .Include(l => l.User)  // Załaduj relację z tabelą User
                .Where(l => l.Status == "Aktywne")
                .ToList();

            LstLoans.ItemsSource = activeLoans;
        }



        private void TxtSearch_TextChanged(object sender, System.Windows.Controls.TextChangedEventArgs e)
        {
            string searchQuery = TxtSearch.Text.ToLower();
            var filteredLoans = _context.Loans
                .Include(l => l.Book)
                .Include(l => l.User)
                .Where(l => l.Book.Title.ToLower().Contains(searchQuery) || l.User.Username.ToLower().Contains(searchQuery))
                .ToList();
            LstLoans.ItemsSource = filteredLoans;
        }

        private void BtnConfirmReturn_Click(object sender, RoutedEventArgs e)
        {
            if (LstLoans.SelectedItem is Loan selectedLoan)
            {
                selectedLoan.Status = "Zakończone";
                var book = _context.Books.Find(selectedLoan.BookId);
                if (book != null)
                {
                    book.Status = "Dostępna";
                }

                _context.SaveChanges();
                MessageBox.Show("Zwrot książki został potwierdzony.", "Sukces", MessageBoxButton.OK, MessageBoxImage.Information);
                LoadLoans();
            }
            else
            {
                MessageBox.Show("Proszę wybrać wypożyczenie.", "Błąd", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void BtnMarkLost_Click(object sender, RoutedEventArgs e)
        {
            if (LstLoans.SelectedItem is Loan selectedLoan)
            {
                selectedLoan.Status = "Zgubione";
                var book = _context.Books.Find(selectedLoan.BookId);
                if (book != null)
                {
                    book.Status = "Zgubiona";
                }

                _context.SaveChanges();
                MessageBox.Show("Status książki został zmieniony na zgubiona.", "Informacja", MessageBoxButton.OK, MessageBoxImage.Warning);
                LoadLoans();
            }
            else
            {
                MessageBox.Show("Proszę wybrać wypożyczenie.", "Błąd", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }
}