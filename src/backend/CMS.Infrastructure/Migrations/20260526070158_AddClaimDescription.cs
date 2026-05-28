using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddClaimDescription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Claims_Members_MemberId",
                table: "Claims");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Claims",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "MemberId1",
                table: "Claims",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Claims_MemberId1",
                table: "Claims",
                column: "MemberId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Claims_Members_MemberId",
                table: "Claims",
                column: "MemberId",
                principalTable: "Members",
                principalColumn: "MemberId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Claims_Members_MemberId1",
                table: "Claims",
                column: "MemberId1",
                principalTable: "Members",
                principalColumn: "MemberId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Claims_Members_MemberId",
                table: "Claims");

            migrationBuilder.DropForeignKey(
                name: "FK_Claims_Members_MemberId1",
                table: "Claims");

            migrationBuilder.DropIndex(
                name: "IX_Claims_MemberId1",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "MemberId1",
                table: "Claims");

            migrationBuilder.AddForeignKey(
                name: "FK_Claims_Members_MemberId",
                table: "Claims",
                column: "MemberId",
                principalTable: "Members",
                principalColumn: "MemberId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
