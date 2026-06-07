using CMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace CMS.Infrastructure.Data;

public sealed class CmsDbContext : DbContext
{
    public CmsDbContext(DbContextOptions<CmsDbContext> options)
        : base(options)
    {
    }

    public DbSet<Member> Members => Set<Member>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<Claim> Claims => Set<Claim>();
    public DbSet<Policy> Policies => Set<Policy>();
    public DbSet<Dependent> Dependents => Set<Dependent>();
    public DbSet<Nominee> Nominees => Set<Nominee>();
    public DbSet<PremiumPayment> PremiumPayments => Set<PremiumPayment>();
    public DbSet<KycDocument> KycDocuments => Set<KycDocument>();
    public DbSet<NetworkHospital> NetworkHospitals => Set<NetworkHospital>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);

        optionsBuilder.UseQueryTrackingBehavior(
            QueryTrackingBehavior.NoTracking);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CmsDbContext).Assembly);

        base.OnModelCreating(modelBuilder);

        // =========================
        // NetworkHospital Entity
        // =========================
        modelBuilder.Entity<NetworkHospital>(entity =>
        {
            entity.ToTable("NetworkHospitals");

            entity.HasKey(e => e.HospitalId);

            entity.Property(e => e.HospitalName)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.RegistrationNumber)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.City)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.State)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.PinCode)
                .IsRequired()
                .HasMaxLength(10);

            entity.Property(e => e.CashlessLimit)
                .HasPrecision(18, 2);

            entity.Property(e => e.ConsultationFee)
                .HasPrecision(18, 2);

            // ✅ Specializations Converter + Comparer
            entity.Property(e => e.Specializations)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries))
                .Metadata.SetValueComparer(
                    new ValueComparer<string[]>(
                        (c1, c2) => c1!.SequenceEqual(c2!),
                        c => c.Aggregate(
                            0,
                            (a, v) => HashCode.Combine(a, v.GetHashCode())),
                        c => c.ToArray()));

            // ✅ RoomRates Converter + Comparer
            entity.Property(e => e.RoomRates)
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(
                        v,
                        (System.Text.Json.JsonSerializerOptions?)null),

                    v => System.Text.Json.JsonSerializer.Deserialize
                        <Dictionary<string, decimal>>(
                            v,
                            (System.Text.Json.JsonSerializerOptions?)null)
                         ?? new Dictionary<string, decimal>())
                .Metadata.SetValueComparer(
                    new ValueComparer<Dictionary<string, decimal>>(
                        (c1, c2) => c1!.SequenceEqual(c2!),

                        c => c.Aggregate(
                            0,
                            (a, v) => HashCode.Combine(
                                a,
                                v.Key.GetHashCode(),
                                v.Value.GetHashCode())),

                        c => c.ToDictionary(
                            entry => entry.Key,
                            entry => entry.Value)));

            entity.HasIndex(e => e.RegistrationNumber)
                .IsUnique();

            entity.HasIndex(e => new
            {
                e.City,
                e.IsActive
            });
        });

        // =========================
        // Plan Entity
        // =========================
        modelBuilder.Entity<Plan>(entity =>
        {
            entity.Property(p => p.AgeLoadingPercentage)
                .HasPrecision(18, 2);

            entity.Property(p => p.SmokerLoadingPercentage)
                .HasPrecision(18, 2);

            entity.Property(p => p.PreExistingConditionLoading)
                .HasPrecision(18, 2);

            entity.Property(p => p.LocationRiskMultiplier)
                .HasPrecision(18, 2);

            entity.Property(p => p.CorporateDiscountPercentage)
                .HasPrecision(18, 2);
        });

        // =========================
        // RatingFactor Entity
        // =========================
        modelBuilder.Entity<RatingFactor>(entity =>
        {
            entity.ToTable("RatingFactors");

            entity.HasKey(r => r.RatingFactorId);

            entity.Property(r => r.FactorName)
                .HasMaxLength(100);

            entity.Property(r => r.Description)
                .HasMaxLength(500);

            entity.Property(r => r.Percentage)
                .HasPrecision(18, 2);
        });
    }
}