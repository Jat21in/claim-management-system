using CMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CMS.Infrastructure.Data.Configurations;

public sealed class DependentConfiguration : IEntityTypeConfiguration<Dependent>
{
    public void Configure(EntityTypeBuilder<Dependent> builder)
    {
        builder.ToTable("Dependents");
        builder.HasKey(d => d.DependentId);

        builder.Property(d => d.FullName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(d => d.Relationship)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(d => d.DateOfBirth)
            .IsRequired();
    }
}
