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
    /// Logika interakcji dla klasy MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        private readonly User _currentUser;

        public MainWindow(User user)
        {
            InitializeComponent();
            _currentUser = user;
            TxtWelcome.Text = $"Witaj, {_currentUser.Username}! {_currentUser.Role}";
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
