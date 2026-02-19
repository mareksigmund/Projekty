using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoLogix.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInsuranceOffers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "InsuranceOffers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleId = table.Column<Guid>(type: "uuid", nullable: false),
                    InsurerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    OfferRequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    ValidFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ValidTo = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InsuranceOffers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InsuranceOffers_InsuranceOfferRequests_OfferRequestId",
                        column: x => x.OfferRequestId,
                        principalTable: "InsuranceOfferRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_InsuranceOffers_Users_InsurerUserId",
                        column: x => x.InsurerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_InsuranceOffers_Vehicles_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InsuranceOffers_InsurerUserId_Status",
                table: "InsuranceOffers",
                columns: new[] { "InsurerUserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_InsuranceOffers_OfferRequestId",
                table: "InsuranceOffers",
                column: "OfferRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_InsuranceOffers_VehicleId_Status",
                table: "InsuranceOffers",
                columns: new[] { "VehicleId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InsuranceOffers");
        }
    }
}
