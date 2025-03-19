using LibraryWPF.Data;
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
    /// Logika interakcji dla klasy LoginWindow.xaml
    /// </summary>
    public partial class LoginWindow : Window
    {
        private readonly AppDbContext _context;

        public LoginWindow()
        {
            InitializeComponent();
            _context = new AppDbContext();
        }

        //private void BtnLogin_Click(object sender, RoutedEventArgs e)
        //{
        //    string username = TxtUsername.Text;
        //    string password = TxtPassword.Password;

        //    var user = _context.Users.FirstOrDefault(u => u.Username == username);
        //    if (user != null && VerifyPassword(password, user.PasswordHash))
        //    {
        //        MainWindow mainWindow = new MainWindow(user);
        //        mainWindow.Show();
        //        this.Close();
        //    }
        //    else
        //    {
        //        MessageBox.Show("Nieprawidłowe dane logowania.", "Błąd", MessageBoxButton.OK, MessageBoxImage.Error);
        //    }
        //}

        private void BtnLogin_Click(object sender, RoutedEventArgs e)
        {
            string username = TxtUsername.Text;
            string password = TxtPassword.Password;

            var user = _context.Users.FirstOrDefault(u => u.Username == username);
            if (user != null && VerifyPassword(password, user.PasswordHash))
            {
                if (user.Role == "Admin")
                {
                    AdminPanel adminPanel = new AdminPanel();
                    adminPanel.Show();
                }
                else if (user.Role == "Bibliotekarz")
                {
                    LibrarianPanel librarianPanel = new LibrarianPanel(user);
                    librarianPanel.Show();
                }
                else if(user.Role == "Czytelnik"){
                    ReaderPanel readerPanel = new ReaderPanel(user);
                    readerPanel.Show();
                }
                else
                {
                    MainWindow mainWindow = new MainWindow(user);
                    mainWindow.Show();
                }

                this.Close();
            }
            else
            {
                MessageBox.Show("Nieprawidłowe dane logowania.", "Błąd", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private bool VerifyPassword(string password, string storedHash)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(bytes) == storedHash;
            }
        }
    }
}