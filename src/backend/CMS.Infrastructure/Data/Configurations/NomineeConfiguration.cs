using CMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CMS.Infrastructure.Data.Configurations;

public sealed class NomineeConfiguration : IEntityTypeConfiguration<Nominee>
{
    public void Configure(EntityTypeBuilder<Nominee> builder)
    {
        builder.ToTable("Nominees");
        builder.HasKey(n => n.NomineeId);

        builder.Property(n => n.FullName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(n => n.Relationship)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(n => n.PercentageAllocation)
            .HasPrecision(5, 2);

        builder.Property(n => n.GuardianName)
            .HasMaxLength(200);
    }
}
