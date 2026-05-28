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

        builder.HasOne(c => c.Member)
            .WithMany(m => m.Claims)
            .HasForeignKey(c => c.MemberId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);

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

        builder.Property(c => c.AiConfidenceScore)
            .HasPrecision(5, 2)
            .IsRequired(false);

        builder.Property(c => c.AiDecision)
            .HasMaxLength(50)
            .IsRequired(false);

        builder.Property(c => c.AiReasoning)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(c => c.AiVerifiedAt)
            .IsRequired(false);

        builder.Property(c => c.Description)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(c => c.MedicalReportFileName)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(c => c.MedicalReportPath)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(c => c.MedicalReportSize)
            .IsRequired(false);

        builder.Property(c => c.MedicalReportContentType)
            .HasMaxLength(100)
            .IsRequired(false);
    }
}
