using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoLogix.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVehicleInsuranceConsent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AllowInsuranceOffers",
                table: "Vehicles",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllowInsuranceOffers",
                table: "Vehicles");
        }
    }
}
