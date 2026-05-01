using CMS.Domain.Entities;
using CMS.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

public sealed class ClaimConfiguration : IEntityTypeConfiguration<Claim>
{
    public void Configure(EntityTypeBuilder<Claim> builder)
    {
        builder.HasKey(c => c.ClaimId);

        var moneyConverter = new ValueConverter<Money, decimal>(
            m => m.Amount,
            v => new Money(v));

        builder.Property(c => c.ClaimAmount)
            .HasConversion(moneyConverter)
            .HasColumnName("ClaimAmount")
            .IsRequired();

        builder.Property(c => c.Status)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(c => c.ClaimDate)
            .IsRequired();
    }
}