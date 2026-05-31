using CMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CMS.Infrastructure.Data.Configurations;

public sealed class PolicyConfiguration : IEntityTypeConfiguration<Policy>
{
    public void Configure(EntityTypeBuilder<Policy> builder)
    {
        builder.ToTable("Policies");
        builder.HasKey(p => p.PolicyId);

        builder.Property(p => p.PolicyNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(p => p.PolicyNumber)
            .IsUnique();

        builder.Property(p => p.MonthlyPremium)
            .HasPrecision(18, 2);

        builder.Property(p => p.AnnualPremium)
            .HasPrecision(18, 2);

        builder.Property(p => p.SumInsured)
            .HasPrecision(18, 2);

        builder.Property(p => p.UtilizedAmount)
            .HasPrecision(18, 2)
            .HasDefaultValue(0);

        builder.Property(p => p.Status)
            .HasConversion<int>();

        // Relationships
        builder.HasOne(p => p.Member)
            .WithMany()
            .HasForeignKey(p => p.MemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Plan)
            .WithMany()
            .HasForeignKey(p => p.PlanId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(p => p.Dependents)
            .WithOne(d => d.Policy)
            .HasForeignKey(d => d.PolicyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Nominees)
            .WithOne(n => n.Policy)
            .HasForeignKey(n => n.PolicyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Payments)
            .WithOne(pm => pm.Policy)
            .HasForeignKey(pm => pm.PolicyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
