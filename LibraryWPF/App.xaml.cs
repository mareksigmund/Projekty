using LibraryWPF.Data;
using LibraryWPF.Views;
using System.Configuration;
using System.Data;
using System.Windows;

namespace LibraryWPF
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : Application
    {
        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            LoginWindow loginWindow = new LoginWindow();
            loginWindow.Show();
        }
    }
}