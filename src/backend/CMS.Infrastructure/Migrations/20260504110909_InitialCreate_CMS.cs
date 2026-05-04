using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate_CMS : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Members_Plans_ActivePlanPlanId",
                table: "Members");

            migrationBuilder.AddColumn<string>(
                name: "ContactNumber",
                table: "Members",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Members_Plans_ActivePlanPlanId",
                table: "Members",
                column: "ActivePlanPlanId",
                principalTable: "Plans",
                principalColumn: "PlanId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Members_Plans_ActivePlanPlanId",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "ContactNumber",
                table: "Members");

            migrationBuilder.AddForeignKey(
                name: "FK_Members_Plans_ActivePlanPlanId",
                table: "Members",
                column: "ActivePlanPlanId",
                principalTable: "Plans",
                principalColumn: "PlanId");
        }
    }
}
