using LibraryWPF.Data;
using LibraryWPF.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
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
    /// Logika interakcji dla klasy BookSearchWindow.xaml
    /// </summary>
    public partial class BookSearchWindow : Window
    {
        private readonly HttpClient _httpClient = new HttpClient();
        private List<Book> _searchResults = new List<Book>();

        public BookSearchWindow()
        {
            InitializeComponent();
        }

        private async void BtnSearch_Click(object sender, RoutedEventArgs e)
        {
            string query = TxtSearchQuery.Text;
            if (string.IsNullOrWhiteSpace(query))
            {
                MessageBox.Show("Wpisz tytuł książki!", "Błąd", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            await SearchBooks(query);
        }

        private async Task SearchBooks(string query)
        {
            string url = $"https://www.googleapis.com/books/v1/volumes?q={query}";

            try
            {
                string response = await _httpClient.GetStringAsync(url);
                var jsonDoc = JsonDocument.Parse(response);

                if (!jsonDoc.RootElement.TryGetProperty("items", out var items))
                {
                    MessageBox.Show("Brak wyników dla podanego zapytania.", "Informacja", MessageBoxButton.OK, MessageBoxImage.Information);
                    _searchResults.Clear();
                    LstBooks.ItemsSource = null;
                    return;
                }

                _searchResults.Clear(); // Usunięcie poprzednich wyników
                foreach (var item in items.EnumerateArray())
                {
                    var volumeInfo = item.GetProperty("volumeInfo");
                    var title = volumeInfo.GetProperty("title").GetString();
                    var authors = volumeInfo.TryGetProperty("authors", out var authorsArray) ?
                                  string.Join(", ", authorsArray.EnumerateArray().Select(a => a.GetString())) : "Nieznany autor";
                    var isbn = volumeInfo.TryGetProperty("industryIdentifiers", out var identifiers) && identifiers.GetArrayLength() > 0
                               ? identifiers[0].GetProperty("identifier").GetString()
                               : "Brak ISBN";

                    _searchResults.Add(new Book { Title = title, Author = authors, ISBN = isbn });
                }

                LstBooks.ItemsSource = null;  // Resetowanie źródła danych
                LstBooks.ItemsSource = _searchResults;  // Aktualizacja wyników
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Błąd podczas pobierania danych: {ex.Message}", "Błąd", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }



        private void LstBooks_DoubleClick(object sender, RoutedEventArgs e)
        {
            if (LstBooks.SelectedItem is Book selectedBook)
            {
                ConfirmAndAddBook(selectedBook);
            }
        }

        private void BtnAddBook_Click(object sender, RoutedEventArgs e)
        {
            if (LstBooks.SelectedItem is Book selectedBook)
            {
                ConfirmAndAddBook(selectedBook);
            }
            else
            {
                MessageBox.Show("Najpierw wybierz książkę!", "Błąd", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        private void ConfirmAndAddBook(Book book)
        {
            MessageBoxResult result = MessageBox.Show(
                $"Czy na pewno chcesz dodać książkę?\n\nTytuł: {book.Title}\nAutor: {book.Author}\nISBN: {book.ISBN}",
                "Potwierdzenie", MessageBoxButton.YesNo, MessageBoxImage.Question);

            if (result == MessageBoxResult.Yes)
            {
                using (var context = new AppDbContext())
                {
                    context.Books.Add(book);
                    context.SaveChanges();
                }

                MessageBox.Show("Książka została dodana do biblioteki!", "Sukces", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }
    }
}
