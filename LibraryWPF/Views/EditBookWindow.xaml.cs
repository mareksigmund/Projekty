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
    /// Logika interakcji dla klasy EditBookWindow.xaml
    /// </summary>
    public partial class EditBookWindow : Window
    {
        private readonly Book _book;
        public EditBookWindow(Book book)
        {
            InitializeComponent();
            _book = book;

            // Wypełniamy pola istniejącymi danymi książki
            TxtTitle.Text = _book.Title;
            TxtAuthor.Text = _book.Author;
            CmbStatus.Text = _book.Status;
        }


        private void BtnSave_Click(object sender, RoutedEventArgs e)
        {
            using (var context = new AppDbContext())
            {
                var bookToUpdate = context.Books.Find(_book.Id);
                if (bookToUpdate != null)
                {
                    bookToUpdate.Title = TxtTitle.Text;
                    bookToUpdate.Author = TxtAuthor.Text;
                    bookToUpdate.Status = CmbStatus.Text;

                    context.SaveChanges();
                }
            }

            MessageBox.Show("Zmiany zapisane pomyślnie!", "Sukces", MessageBoxButton.OK, MessageBoxImage.Information);
            this.Close();
        }
    }
}
