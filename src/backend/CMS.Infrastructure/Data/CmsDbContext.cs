using CMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

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

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);

        // ✅ Just set query tracking behavior - that's enough
        optionsBuilder.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CmsDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
