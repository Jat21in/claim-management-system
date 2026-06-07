using CMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CMS.Infrastructure.Data.Configurations;

public sealed class PlanConfiguration : IEntityTypeConfiguration<Plan>
{
    public void Configure(EntityTypeBuilder<Plan> builder)
    {
        builder.ToTable("Plans");

        builder.HasKey(p => p.PlanId);

        builder.Property(p => p.Code)
               .IsRequired()
               .HasMaxLength(20);

        builder.Property(p => p.Name)
               .IsRequired()
               .HasMaxLength(200);

        builder.Property(p => p.Description)
               .IsRequired()
               .HasMaxLength(1000);

        builder.Property(p => p.InsuredAmount)
               .HasPrecision(18, 2);

        builder.Property(p => p.DurationInMonths)
               .IsRequired();

        builder.Property(p => p.FeaturesJson)
               .IsRequired();

        builder.Property(p => p.IsFeatured)
               .IsRequired();

        builder.Property(p => p.IsActive)
               .IsRequired();

        builder.Property(p => p.StartDate)
               .IsRequired();

        builder.Property(p => p.EndDate)
               .IsRequired();

        builder.Property(p => p.BasePremiumAnnual)
               .HasPrecision(18, 2)
               .IsRequired();

        builder.Property(p => p.DependentLoadingPercentage)
               .HasPrecision(5, 2)
               .IsRequired();

        builder.Property(p => p.MaxDependentsAllowed)
               .IsRequired();

        builder.Property(p => p.MaxNomineesAllowed)
               .IsRequired();

        builder.Property(p => p.RequiredKycDocuments)
               .IsRequired();

        builder.HasIndex(p => p.Code)
               .IsUnique();
    }
}
