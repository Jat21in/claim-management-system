using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPremiumRatingFactorAndNetworkHospitals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ========== PLANS TABLE ADDITIONS ==========
            migrationBuilder.AddColumn<decimal>(
                name: "AgeLoadingPercentage",
                table: "Plans",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CorporateDiscountPercentage",
                table: "Plans",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsFamilyFloater",
                table: "Plans",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "LocationRiskMultiplier",
                table: "Plans",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PreExistingConditionLoading",
                table: "Plans",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "SmokerLoadingPercentage",
                table: "Plans",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            // ========== CLAIMS TABLE ADDITIONS ==========
            migrationBuilder.AddColumn<DateTime>(
                name: "AdmissionDate",
                table: "Claims",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Diagnosis",
                table: "Claims",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DischargeDate",
                table: "Claims",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DoctorName",
                table: "Claims",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "HospitalId",
                table: "Claims",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HospitalName",
                table: "Claims",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPreAuthorization",
                table: "Claims",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PaymentDate",
                table: "Claims",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentMode",
                table: "Claims",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentReferenceNumber",
                table: "Claims",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TreatmentType",
                table: "Claims",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            // ========== CREATE NETWORK HOSPITALS TABLE ==========
            migrationBuilder.CreateTable(
                name: "NetworkHospitals",
                columns: table => new
                {
                    HospitalId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HospitalName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    RegistrationNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    State = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PinCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    ContactNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
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

            // Create indexes for NetworkHospitals
            migrationBuilder.CreateIndex(
                name: "IX_NetworkHospitals_City_IsActive",
                table: "NetworkHospitals",
                columns: new[] { "City", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_NetworkHospitals_RegistrationNumber",
                table: "NetworkHospitals",
                column: "RegistrationNumber",
                unique: true);

            // ========== CREATE RATING FACTOR TABLE (Optional - for dynamic factors) ==========
            migrationBuilder.CreateTable(
                name: "RatingFactors",
                columns: table => new
                {
                    RatingFactorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FactorName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Percentage = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    MinAge = table.Column<int>(type: "int", nullable: true),
                    MaxAge = table.Column<int>(type: "int", nullable: true),
                    PlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RatingFactors", x => x.RatingFactorId);
                    table.ForeignKey(
                        name: "FK_RatingFactors_Plans_PlanId",
                        column: x => x.PlanId,
                        principalTable: "Plans",
                        principalColumn: "PlanId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RatingFactors_PlanId",
                table: "RatingFactors",
                column: "PlanId");

            // ========== UPDATE EXISTING PLANS WITH DEFAULT VALUES ==========
            migrationBuilder.Sql(@"
                UPDATE Plans 
                SET 
                    AgeLoadingPercentage = 15.00,
                    SmokerLoadingPercentage = 25.00,
                    PreExistingConditionLoading = 30.00,
                    LocationRiskMultiplier = 1.00,
                    IsFamilyFloater = 1,
                    CorporateDiscountPercentage = 10.00
                WHERE Name = 'Health Pro Plus';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop RatingFactors table
            migrationBuilder.DropTable(name: "RatingFactors");

            // Drop NetworkHospitals table
            migrationBuilder.DropTable(name: "NetworkHospitals");

            // Drop Claim columns
            migrationBuilder.DropColumn(name: "AdmissionDate", table: "Claims");
            migrationBuilder.DropColumn(name: "Diagnosis", table: "Claims");
            migrationBuilder.DropColumn(name: "DischargeDate", table: "Claims");
            migrationBuilder.DropColumn(name: "DoctorName", table: "Claims");
            migrationBuilder.DropColumn(name: "HospitalId", table: "Claims");
            migrationBuilder.DropColumn(name: "HospitalName", table: "Claims");
            migrationBuilder.DropColumn(name: "IsPreAuthorization", table: "Claims");
            migrationBuilder.DropColumn(name: "PaymentDate", table: "Claims");
            migrationBuilder.DropColumn(name: "PaymentMode", table: "Claims");
            migrationBuilder.DropColumn(name: "PaymentReferenceNumber", table: "Claims");
            migrationBuilder.DropColumn(name: "TreatmentType", table: "Claims");

            // Drop Plan columns
            migrationBuilder.DropColumn(name: "AgeLoadingPercentage", table: "Plans");
            migrationBuilder.DropColumn(name: "CorporateDiscountPercentage", table: "Plans");
            migrationBuilder.DropColumn(name: "IsFamilyFloater", table: "Plans");
            migrationBuilder.DropColumn(name: "LocationRiskMultiplier", table: "Plans");
            migrationBuilder.DropColumn(name: "PreExistingConditionLoading", table: "Plans");
            migrationBuilder.DropColumn(name: "SmokerLoadingPercentage", table: "Plans");
        }
    }
}
