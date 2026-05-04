using CMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CMS.Infrastructure.Data.Configurations;

public sealed class MemberConfiguration : IEntityTypeConfiguration<Member>
{
    public void Configure(EntityTypeBuilder<Member> builder)
    {
        builder.HasKey(m => m.MemberId);

        builder.Property(m => m.FullName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(m => m.Email)
            .IsRequired()
            .HasMaxLength(200);


        builder.Property(m => m.PasswordHash)
            .IsRequired()
            .HasMaxLength(500);


        // ✅ Address owned type mapping (CRUCIAL)
        builder.OwnsOne(m => m.Address, address =>
        {
            address.Property(a => a.Street)
                .HasColumnName("Street")
                .IsRequired()
                .HasMaxLength(200);

            address.Property(a => a.City)
                .HasColumnName("City")
                .IsRequired()
                .HasMaxLength(100);

            address.Property(a => a.State)
                .HasColumnName("State")
                .IsRequired()
                .HasMaxLength(100);

            address.Property(a => a.Country)
                .HasColumnName("Country")
                .IsRequired()
                .HasMaxLength(100);

            address.Property(a => a.PostalCode)
                .HasColumnName("PostalCode")
                .IsRequired()
                .HasMaxLength(20);
        });

        builder.HasMany(m => m.Claims)
            .WithOne()
            .HasForeignKey(c => c.MemberId);

        builder
    .HasOne(m => m.ActivePlan)
    .WithMany()                       // Plan does not need navigation
    .HasForeignKey("ActivePlanPlanId")// Explicit FK
    .OnDelete(DeleteBehavior.Restrict);

    }
}