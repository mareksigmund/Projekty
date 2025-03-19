using LibraryWPF.Data;
using LibraryWPF.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
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
    /// Logika interakcji dla klasy AdminPanel.xaml
    /// </summary>
    public partial class AdminPanel : Window
    {
        private readonly AppDbContext _context;
        public AdminPanel()
        {
            InitializeComponent();
            _context = new AppDbContext();
        }
        private void BtnAddUser_Click(object sender, RoutedEventArgs e)
        {
            string username = TxtUsername.Text;
            string password = TxtPassword.Password;
            string? role = (CmbRole.SelectedItem as ComboBoxItem)?.Content.ToString();

            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(role))
            {
                MessageBox.Show("Wszystkie pola są wymagane.", "Błąd", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            if (_context.Users.Any(u => u.Username == username))
            {
                MessageBox.Show("Użytkownik o tej nazwie już istnieje.", "Błąd", MessageBoxButton.OK, MessageBoxImage.Error);
                return;
            }

            var newUser = new User
            {
                Username = username,
                PasswordHash = HashPassword(password),
                Role = role
            };

            _context.Users.Add(newUser);
            _context.SaveChanges();

            MessageBox.Show("Użytkownik dodany pomyślnie!", "Sukces", MessageBoxButton.OK, MessageBoxImage.Information);

            // Czyszczenie pól po dodaniu użytkownika
            TxtUsername.Clear();
            TxtPassword.Clear();
            CmbRole.SelectedIndex = -1;
        }

        private static string HashPassword(string password)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(bytes);
            }
        }

        private void BtnLogout_Click(object sender, RoutedEventArgs e)
        {
            LoginWindow loginWindow = new LoginWindow();
            loginWindow.Show();

            // Zamykamy wszystkie okna oprócz LoginWindow
            foreach (Window window in Application.Current.Windows)
            {
                if (window is not LoginWindow)
                {
                    window.Close();
                }
            }
        }

    }
}