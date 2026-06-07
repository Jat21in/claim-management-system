using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPremiumConfigurationToPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "BasePremiumAnnual",
                table: "Plans",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "DependentLoadingPercentage",
                table: "Plans",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "MaxDependentsAllowed",
                table: "Plans",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxNomineesAllowed",
                table: "Plans",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "RequiredKycDocuments",
                table: "Plans",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BasePremiumAnnual",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "DependentLoadingPercentage",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "MaxDependentsAllowed",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "MaxNomineesAllowed",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "RequiredKycDocuments",
                table: "Plans");
        }
    }
}
