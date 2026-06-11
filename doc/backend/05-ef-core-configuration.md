# Entity Framework Core Configuration

## Overview

Entity Framework Core serves as the ORM (Object-Relational Mapper), bridging domain entities to SQL Server tables. Configuration is done via **Fluent API** in `CMS.Infrastructure.Data.Configurations`.

Key features:

- **Value Conversions** – Map domain value objects (e.g., `Money`, `Address`) to database columns
- **Owned Types** – Embed value objects as columns in parent tables
- **Relationship Mapping** – Define foreign keys and navigation properties
- **Query Splitting** – Prevent cartesian explosion with `.AsSplitQuery()`

---

## DbContext – The Unit of Work

**File:** `src/backend/CMS.Infrastructure/Data/CmsDbContext.cs`

```csharp
public sealed class CmsDbContext : DbContext
{
    public CmsDbContext(DbContextOptions<CmsDbContext> options) : base(options) { }

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
        optionsBuilder.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CmsDbContext).Assembly);
        // Additional configurations...
    }
}
```

### Key Configuration Decisions

| Line(s) | Setting | Purpose |
|---|---|---|
| 24–27 | `UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)` | All queries read-only by default — improves performance |
| 36 | `ApplyConfigurationsFromAssembly` | Automatically discovers all `IEntityTypeConfiguration<T>` classes |

---

## Configuration Pattern – Separate Files per Entity

Each entity has a dedicated configuration file in `CMS.Infrastructure.Data.Configurations`.

### 1. `MemberConfiguration`

**File:** `src/backend/CMS.Infrastructure/Data/Configurations/MemberConfiguration.cs`

```csharp
public sealed class MemberConfiguration : IEntityTypeConfiguration<Member>
{
    public void Configure(EntityTypeBuilder<Member> builder)
    {
        builder.ToTable("Members");
        builder.HasKey(m => m.MemberId);

        // Explicit Foreign Key mapping
        builder.Property(m => m.ActivePlanId)
            .HasColumnName("ActivePlanPlanId");

        // Primitive properties
        builder.Property(m => m.FullName).IsRequired().HasMaxLength(200);
        builder.Property(m => m.Email).IsRequired().HasMaxLength(200);
        builder.Property(m => m.PasswordHash).IsRequired().HasMaxLength(500);
        builder.Property(m => m.PhoneNumber).HasMaxLength(20).IsRequired(false);

        // Owned Type: Address
        builder.OwnsOne(m => m.Address, address =>
        {
            address.Property(a => a.Street).HasColumnName("Street").IsRequired().HasMaxLength(200);
            address.Property(a => a.City).HasColumnName("City").IsRequired().HasMaxLength(100);
            address.Property(a => a.State).HasColumnName("State").IsRequired().HasMaxLength(100);
            address.Property(a => a.Country).HasColumnName("Country").IsRequired().HasMaxLength(100);
            address.Property(a => a.PostalCode).HasColumnName("PostalCode").IsRequired().HasMaxLength(20);
        });

        // Relationships
        builder.HasMany(m => m.Claims)
            .WithOne(c => c.Member)
            .HasForeignKey(c => c.MemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.ActivePlan)
            .WithMany()
            .HasForeignKey(m => m.ActivePlanId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
```

| Pattern | Line(s) | Explanation |
|---|---|---|
| `OwnsOne` | 36–62 | `Address` value object stored as columns in `Members` table (no separate table) |
| `HasMaxLength` | 21, 24, 28, 35 | Prevents `NVARCHAR(MAX)` – reduces storage |
| `OnDelete(Restrict)` | 67, 72 | Prevents cascade delete – safe for production |
| `HasColumnName` | 14, 38–62 | Matches existing database column names |

---

### 2. `ClaimConfiguration` – Value Converter for `Money`

**File:** `src/backend/CMS.Infrastructure/Data/Configurations/ClaimConfiguration.cs`

```csharp
public sealed class ClaimConfiguration : IEntityTypeConfiguration<Claim>
{
    public void Configure(EntityTypeBuilder<Claim> builder)
    {
        builder.ToTable("Claims");
        builder.HasKey(c => c.ClaimId);

        // Value Converter for Money
        var moneyConverter = new ValueConverter<Money, decimal>(
            m => m.Amount,      // Money → decimal
            v => new Money(v)); // decimal → Money

        builder.Property(c => c.ClaimAmount)
            .HasConversion(moneyConverter)
            .HasColumnName("ClaimAmount")
            .IsRequired();

        builder.Property(c => c.Status)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(c => c.ClaimDate).IsRequired();
        builder.Property(c => c.Description).HasMaxLength(500).IsRequired(false);

        builder.Property(c => c.AiConfidenceScore).HasPrecision(5, 2).IsRequired(false);
        builder.Property(c => c.AiDecision).HasMaxLength(50).IsRequired(false);
        builder.Property(c => c.AiReasoning).HasMaxLength(1000).IsRequired(false);
    }
}
```

| Pattern | Line(s) | Explanation |
|---|---|---|
| `ValueConverter<Money, decimal>` | 23–26 | Converts `Money.Amount` to `decimal` for storage |
| `HasConversion<string>` | 29 | Stores `ClaimStatus` enum as string (readable in DB) |
| `HasPrecision(5, 2)` | 35 | `AiConfidenceScore` stored as `DECIMAL(5,2)` – 99.99 max |

---

### 3. `PolicyConfiguration` – Complex Relationships

**File:** `src/backend/CMS.Infrastructure/Data/Configurations/PolicyConfiguration.cs`

```csharp
public sealed class PolicyConfiguration : IEntityTypeConfiguration<Policy>
{
    public void Configure(EntityTypeBuilder<Policy> builder)
    {
        builder.ToTable("Policies");
        builder.HasKey(p => p.PolicyId);

        builder.Property(p => p.PolicyNumber).IsRequired().HasMaxLength(50);
        builder.HasIndex(p => p.PolicyNumber).IsUnique();

        builder.Property(p => p.MonthlyPremium).HasPrecision(18, 2);
        builder.Property(p => p.AnnualPremium).HasPrecision(18, 2);
        builder.Property(p => p.SumInsured).HasPrecision(18, 2);
        builder.Property(p => p.UtilizedAmount).HasPrecision(18, 2).HasDefaultValue(0);

        builder.Property(p => p.Status).HasConversion<int>();

        // Relationships
        builder.HasOne(p => p.Member)
            .WithMany()
            .HasForeignKey(p => p.MemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Plan)
            .WithMany()
            .HasForeignKey(p => p.PlanId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(p => p.Dependents)
            .WithOne(d => d.Policy)
            .HasForeignKey(d => d.PolicyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Nominees)
            .WithOne(n => n.Policy)
            .HasForeignKey(n => n.PolicyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Payments)
            .WithOne(pm => pm.Policy)
            .HasForeignKey(pm => pm.PolicyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

| Relationship | Delete Behavior | Reason |
|---|---|---|
| `Policy` → `Member` | `Restrict` | Cannot delete member with active policy |
| `Policy` → `Dependents` | `Cascade` | Delete dependents when policy deleted |
| `Policy` → `Nominees` | `Cascade` | Delete nominees when policy deleted |
| `Policy` → `Payments` | `Cascade` | Delete payments when policy deleted |

---

### 4. `PlanConfiguration` – Advanced Properties

**File:** `src/backend/CMS.Infrastructure/Data/Configurations/PlanConfiguration.cs`

```csharp
public sealed class PlanConfiguration : IEntityTypeConfiguration<Plan>
{
    public void Configure(EntityTypeBuilder<Plan> builder)
    {
        builder.ToTable("Plans");
        builder.HasKey(p => p.PlanId);

        builder.Property(p => p.Code).IsRequired().HasMaxLength(20);
        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Description).IsRequired().HasMaxLength(1000);
        builder.Property(p => p.InsuredAmount).HasPrecision(18, 2);
        builder.Property(p => p.DurationInMonths).IsRequired();

        builder.Property(p => p.FeaturesJson).IsRequired(); // JSON string
        builder.Property(p => p.IsFeatured).IsRequired();
        builder.Property(p => p.IsActive).IsRequired();

        builder.Property(p => p.BasePremiumAnnual).HasPrecision(18, 2).IsRequired();
        builder.Property(p => p.DependentLoadingPercentage).HasPrecision(5, 2).IsRequired();

        builder.Property(p => p.AgeLoadingPercentage).HasPrecision(18, 2);
        builder.Property(p => p.SmokerLoadingPercentage).HasPrecision(18, 2);
        builder.Property(p => p.PreExistingConditionLoading).HasPrecision(18, 2);
        builder.Property(p => p.LocationRiskMultiplier).HasPrecision(18, 2);

        builder.HasIndex(p => p.Code).IsUnique();
    }
}
```

> **Note:** `FeaturesJson` stores a JSON array as a string — deserialized in `PlanService.cs` line 28.

---

### 5. `NetworkHospitalConfiguration` – JSON Collections

**File:** `src/backend/CMS.Infrastructure/Data/CmsDbContext.cs` — lines 90–121

```csharp
modelBuilder.Entity<NetworkHospital>(entity =>
{
    entity.ToTable("NetworkHospitals");
    entity.HasKey(e => e.HospitalId);

    entity.Property(e => e.HospitalName).IsRequired().HasMaxLength(200);
    entity.Property(e => e.City).IsRequired().HasMaxLength(100);
    entity.Property(e => e.PinCode).IsRequired().HasMaxLength(10);
    entity.Property(e => e.CashlessLimit).HasPrecision(18, 2);

    // JSON array stored as comma-separated string
    entity.Property(e => e.Specializations)
        .HasConversion(
            v => string.Join(',', v),
            v => v.Split(',', StringSplitOptions.RemoveEmptyEntries));

    // JSON dictionary stored as serialized JSON
    entity.Property(e => e.RoomRates)
        .HasConversion(
            v => JsonSerializer.Serialize(v),
            v => JsonSerializer.Deserialize<Dictionary<string, decimal>>(v) ?? new());

    entity.HasIndex(e => e.RegistrationNumber).IsUnique();
});
```

| Data Type | Storage Method | Converter |
|---|---|---|
| `string[]` | Comma-separated string | `string.Join` / `Split` |
| `Dictionary<K,V>` | JSON string | `JsonSerializer.Serialize` / `Deserialize` |

---

## Migration Strategy

**File:** `src/backend/CMS.Infrastructure/Migrations/`

| Migration File | Date | Purpose |
|---|---|---|
| `20260601085111_AddPhoneNumberToMember.cs` | 2026-06-01 | Add `PhoneNumber` column to `Members` |
| `20260603071928_AddPendingToClaimStatus.cs` | 2026-06-03 | Add `Pending` status to `ClaimStatus` enum |
| `20260606173901_AddPremiumConfigurationToPlan.cs` | 2026-06-06 | Add premium fields to `Plans` table |
| `20260607164920_AddLastPaymentDateToPolicy.cs` | 2026-06-07 | Add `LastPaymentDate` to `Policies` |
| `20260610150053_AddUpdatedAtToPlan.cs` | 2026-06-10 | Add `UpdatedAt` and `RequiredKycDocumentsJson` to `Plans` |

### Migration Example

**File:** `src/backend/CMS.Infrastructure/Migrations/20260606173901_AddPremiumConfigurationToPlan.cs`

```csharp
public partial class AddPremiumConfigurationToPlan : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<decimal>(
            name: "BasePremiumAnnual",
            table: "Plans",
            type: "decimal(18,2)",
            nullable: false,
            defaultValue: 0m);

        migrationBuilder.AddColumn<decimal>(
            name: "DependentLoadingPercentage",
            table: "Plans",
            type: "decimal(5,2)",
            nullable: false,
            defaultValue: 0m);

        migrationBuilder.AddColumn<int>(
            name: "MaxDependentsAllowed",
            table: "Plans",
            type: "int",
            nullable: false,
            defaultValue: 0);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "BasePremiumAnnual", table: "Plans");
        migrationBuilder.DropColumn(name: "DependentLoadingPercentage", table: "Plans");
        migrationBuilder.DropColumn(name: "MaxDependentsAllowed", table: "Plans");
    }
}
```

### Migration Commands

```bash
# From CMS.API project directory
dotnet ef migrations add AddNewColumn --project ../CMS.Infrastructure --startup-project .

# Apply migrations to database
dotnet ef database update --project ../CMS.Infrastructure --startup-project .
```

---

## Query Splitting – Performance Optimization

**File:** `src/backend/CMS.Infrastructure/DependencyInjection.cs` — line 28

```csharp
sqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
```

### Without `SplitQuery` (Single Query – Cartesian Explosion)

```sql
SELECT p.*, d.*, n.*, pm.*
FROM Policies p
LEFT JOIN Dependents d ON p.PolicyId = d.PolicyId
LEFT JOIN Nominees n ON p.PolicyId = n.PolicyId
LEFT JOIN PremiumPayments pm ON p.PolicyId = pm.PolicyId
-- Returns Policy row × Dependents × Nominees × Payments rows (bloated)
```

### With `SplitQuery` (Multiple Queries)

```sql
-- Query 1: Policies + Dependents
SELECT p.*, d.* FROM Policies p LEFT JOIN Dependents d ON p.PolicyId = d.PolicyId

-- Query 2: Policies + Nominees
SELECT p.*, n.* FROM Policies p LEFT JOIN Nominees n ON p.PolicyId = n.PolicyId

-- Query 3: Policies + Payments
SELECT p.*, pm.* FROM Policies p LEFT JOIN PremiumPayments pm ON p.PolicyId = pm.PolicyId
-- EF Core combines results in memory
```

---

## Summary – Configuration Files

| Entity | Configuration File | Key Features |
|---|---|---|
| `Member` | `MemberConfiguration.cs` | `OwnsOne` for `Address`, `Restrict` delete |
| `Claim` | `ClaimConfiguration.cs` | `ValueConverter<Money, decimal>` |
| `Policy` | `PolicyConfiguration.cs` | Multiple relationships, `Cascade` vs `Restrict` |
| `Plan` | `PlanConfiguration.cs` | JSON string for Features, precision fields |
| `Dependent` | `DependentConfiguration.cs` | Simple properties |
| `Nominee` | `NomineeConfiguration.cs` | Percentage precision |
| `PremiumPayment` | `PremiumPaymentConfiguration.cs` | Indexes on `DueDate`, `Status` |
| `KycDocument` | `KycDocumentConfiguration.cs` | File metadata fields |
| `NetworkHospital` | Inline in `CmsDbContext` | JSON converters for arrays/dictionaries |

> All configurations are automatically applied via `ApplyConfigurationsFromAssembly`, ensuring the `OnModelCreating` method stays clean.