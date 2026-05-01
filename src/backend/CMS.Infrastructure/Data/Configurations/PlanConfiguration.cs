using CMS.Domain.Entities;
using CMS.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

public sealed class PlanConfiguration : IEntityTypeConfiguration<Plan>
{
    public void Configure(EntityTypeBuilder<Plan> builder)
    {
        builder.HasKey(p => p.PlanId);

        var moneyConverter = new ValueConverter<Money, decimal>(
            m => m.Amount,
            v => new Money(v));

        builder.Property(p => p.InsuredAmount)
            .HasConversion(moneyConverter)
            .HasColumnName("InsuredAmount")
            .IsRequired();

        builder.Property(p => p.StartDate).IsRequired();
        builder.Property(p => p.EndDate).IsRequired();
    }
}