using CMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CMS.Infrastructure.Data.Configurations;

public sealed class PremiumPaymentConfiguration : IEntityTypeConfiguration<PremiumPayment>
{
    public void Configure(EntityTypeBuilder<PremiumPayment> builder)
    {
        builder.ToTable("PremiumPayments");
        builder.HasKey(p => p.PaymentId);

        builder.Property(p => p.Amount)
            .HasPrecision(18, 2);

        builder.Property(p => p.PaymentMethod)
            .HasMaxLength(50);

        builder.Property(p => p.TransactionId)
            .HasMaxLength(100);

        builder.Property(p => p.ReceiptUrl)
            .HasMaxLength(500);

        builder.Property(p => p.Status)
            .HasConversion<int>();

        builder.HasIndex(p => p.DueDate);
        builder.HasIndex(p => p.Status);
    }
}
