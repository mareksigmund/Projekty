using LibraryWPF.Data;
using LibraryWPF.Models;
using System.Linq;
using System.Windows;

namespace LibraryWPF.Views
{
    public partial class ManageBooksWindow : Window
    {
        private readonly AppDbContext _context;

        public ManageBooksWindow()
        {
            InitializeComponent();
            _context = new AppDbContext();
            LoadBooks();
        }

        private void LoadBooks()
        {
            var booksFromDb = _context.Books.ToList();
            LstBooks.ItemsSource = booksFromDb;  // Przypisujemy nową listę za każdym razem
        }

        private void TxtSearch_TextChanged(object sender, System.Windows.Controls.TextChangedEventArgs e)
        {
            string searchQuery = TxtSearch.Text.ToLower();
            var filteredBooks = _context.Books
                .Where(b => b.Title.ToLower().Contains(searchQuery) ||
                            b.Author.ToLower().Contains(searchQuery) ||
                            b.Status.ToLower().Contains(searchQuery))
                .ToList();

            LstBooks.ItemsSource = filteredBooks.Count > 0 ? filteredBooks : null;
        }

        private void BtnEditBook_Click(object sender, RoutedEventArgs e)
        {
            if (LstBooks.SelectedItem is Book selectedBook)
            {
                EditBookWindow editBookWindow = new EditBookWindow(selectedBook);
                editBookWindow.ShowDialog();

                // Zamiast odświeżania listy zamykamy to okno
                this.Close();
                MessageBox.Show("Zapisano zmiany. Otwórz ponownie Zarządzanie książkami, aby odświeżyć listę.",
                                "Informacja", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            else
            {
                MessageBox.Show("Najpierw wybierz książkę do edycji.", "Informacja", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        private void BtnRefresh_Click(object sender, RoutedEventArgs e)
        {
            LoadBooks();
            MessageBox.Show("Lista książek została odświeżona.", "Informacja", MessageBoxButton.OK, MessageBoxImage.Information);
        }
        private void LstBooks_MouseDoubleClick(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            if (LstBooks.SelectedItem is Book selectedBook)
            {
                EditBookWindow editBookWindow = new EditBookWindow(selectedBook);
                editBookWindow.ShowDialog();

                // Zamykamy okno po edycji, aby wymusić odświeżenie przy ponownym otwarciu
                this.Close();
                MessageBox.Show("Zapisano zmiany. Otwórz ponownie Zarządzanie książkami, aby zobaczyć aktualne dane.",
                                "Informacja", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }

    }
}
