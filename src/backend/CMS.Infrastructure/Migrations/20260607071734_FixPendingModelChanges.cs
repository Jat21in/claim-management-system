using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixPendingModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RatingFactor_Plans_PlanId",
                table: "RatingFactor");

            migrationBuilder.DropPrimaryKey(
                name: "PK_RatingFactor",
                table: "RatingFactor");

            migrationBuilder.RenameTable(
                name: "RatingFactor",
                newName: "RatingFactors");

            migrationBuilder.RenameIndex(
                name: "IX_RatingFactor_PlanId",
                table: "RatingFactors",
                newName: "IX_RatingFactors_PlanId");

            migrationBuilder.AlterColumn<string>(
                name: "FactorName",
                table: "RatingFactors",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "RatingFactors",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddPrimaryKey(
                name: "PK_RatingFactors",
                table: "RatingFactors",
                column: "RatingFactorId");

            migrationBuilder.CreateTable(
                name: "NetworkHospitals",
                columns: table => new
                {
                    HospitalId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HospitalName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    RegistrationNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    State = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PinCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    ContactNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EmpanelmentDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EmpanelmentEndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CashlessLimit = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Specializations = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConsultationFee = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    RoomRates = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NetworkHospitals", x => x.HospitalId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NetworkHospitals_City_IsActive",
                table: "NetworkHospitals",
                columns: new[] { "City", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_NetworkHospitals_RegistrationNumber",
                table: "NetworkHospitals",
                column: "RegistrationNumber",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_RatingFactors_Plans_PlanId",
                table: "RatingFactors",
                column: "PlanId",
                principalTable: "Plans",
                principalColumn: "PlanId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RatingFactors_Plans_PlanId",
                table: "RatingFactors");

            migrationBuilder.DropTable(
                name: "NetworkHospitals");

            migrationBuilder.DropPrimaryKey(
                name: "PK_RatingFactors",
                table: "RatingFactors");

            migrationBuilder.RenameTable(
                name: "RatingFactors",
                newName: "RatingFactor");

            migrationBuilder.RenameIndex(
                name: "IX_RatingFactors_PlanId",
                table: "RatingFactor",
                newName: "IX_RatingFactor_PlanId");

            migrationBuilder.AlterColumn<string>(
                name: "FactorName",
                table: "RatingFactor",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "RatingFactor",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AddPrimaryKey(
                name: "PK_RatingFactor",
                table: "RatingFactor",
                column: "RatingFactorId");

            migrationBuilder.AddForeignKey(
                name: "FK_RatingFactor_Plans_PlanId",
                table: "RatingFactor",
                column: "PlanId",
                principalTable: "Plans",
                principalColumn: "PlanId");
        }
    }
}
