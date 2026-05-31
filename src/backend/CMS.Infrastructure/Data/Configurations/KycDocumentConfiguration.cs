using CMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CMS.Infrastructure.Data.Configurations;

public sealed class KycDocumentConfiguration : IEntityTypeConfiguration<KycDocument>
{
    public void Configure(EntityTypeBuilder<KycDocument> builder)
    {
        builder.ToTable("KycDocuments");
        builder.HasKey(k => k.DocumentId);

        builder.Property(k => k.DocumentNumber)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(k => k.FileUrl)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(k => k.FileName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(k => k.RejectionReason)
            .HasMaxLength(500);

        builder.Property(k => k.DocumentType)
            .HasConversion<int>();

        builder.HasIndex(k => k.MemberId);
        builder.HasIndex(k => k.IsVerified);
    }
}
