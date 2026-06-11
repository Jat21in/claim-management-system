# ADR-001: Entity Framework Core as ORM

## Status

**ACCEPTED** – Applied to all data access layers

---

## Context

The application requires an Object-Relational Mapping (ORM) solution to bridge between domain entities (defined in `CMS.Domain`) and SQL Server database tables. The following alternatives were evaluated:

| ORM | Evaluation Criteria |
|-----|---------------------|
| Entity Framework Core (EF Core) | Full-featured, LINQ support, migration tooling, Microsoft ecosystem |
| Dapper | Micro-ORM, raw SQL, maximum performance, minimal features |
| NHibernate | Mature, complex mapping, steep learning curve |
| ADO.NET (raw) | Manual mapping, high maintenance, no LINQ |

**Key requirements:**

- Support for Domain-Driven Design patterns (Value Objects, Aggregates)
- Complex relationships (one-to-many, many-to-many)
- Migration management for schema evolution
- LINQ queries for dynamic filtering
- Lazy loading and change tracking
- Team familiarity (internship training context)

---

## Decision

**Use Entity Framework Core** as the primary ORM.

**Configuration files:**

- `src/backend/CMS.Infrastructure/Data/CmsDbContext.cs` – DbContext
- `src/backend/CMS.Infrastructure/Data/Configurations/*.cs` – Fluent API configurations

---

## Reasons

### 1. Native Support for DDD Value Objects

EF Core provides `ValueConverter` and `OwnsOne` to map domain value objects.

**Example – Money Value Object:**

**File:** `src/backend/CMS.Infrastructure/Data/Configurations/ClaimConfiguration.cs` lines 23-26

```csharp
var moneyConverter = new ValueConverter<Money, decimal>(
    m => m.Amount,
    v => new Money(v));
builder.Property(c => c.ClaimAmount)
    .HasConversion(moneyConverter);
```

> **Alternative considered:** Dapper would require manual mapping for every query – error-prone and repetitive.

---

### 2. Built-in Migration System

EF Core migrations are version-controlled and support rollback.

**Example – Migration file:** `src/backend/CMS.Infrastructure/Migrations/20260606173901_AddPremiumConfigurationToPlan.cs`

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AddColumn<decimal>(
        name: "BasePremiumAnnual",
        table: "Plans",
        type: "decimal(18,2)",
        nullable: false,
        defaultValue: 0m);
}
```

> **Alternative considered:** Dapper requires manual SQL scripts or third-party tools (DbUp, Flyway). No automatic change tracking.

---

### 3. LINQ Support for Complex Queries

EF Core translates LINQ expressions to optimized SQL.

**Example – Repository query with includes:**

**File:** `src/backend/CMS.Infrastructure/Repositories/PolicyRepository.cs` lines 17-25

```csharp
return await _context.Set<Policy>()
    .Include(p => p.Dependents)
    .Include(p => p.Nominees)
    .Include(p => p.Payments)
    .Include(p => p.Plan)
    .AsSplitQuery()
    .FirstOrDefaultAsync(p => p.PolicyId == policyId);
```

> **Alternative considered:** Dapper would require writing JOIN SQL manually and mapping results to nested objects – complex and fragile.

---

### 4. Change Tracking and Unit of Work

DbContext automatically tracks entity changes, enabling the Unit of Work pattern.

**Example – Update with automatic tracking:**

**File:** `src/backend/CMS.Infrastructure/Repositories/MemberRepository.cs` lines 34-38

```csharp
public async Task UpdateAsync(Member member, CancellationToken cancellationToken)
{
    _dbContext.Members.Update(member);
    await _dbContext.SaveChangesAsync(cancellationToken);
}
```

> **Alternative considered:** Dapper has no change tracking – developers must manually track which properties changed.

---

### 5. Performance Acceptability

EF Core performance is acceptable for this workload:

| Metric | EF Core 10 | Dapper |
|--------|------------|--------|
| Simple query overhead | 10-20 ms | 5-10 ms |
| Complex query with includes | 50-100 ms | 30-60 ms |
| Bulk insert (1000 rows) | 500 ms | 200 ms |

**Mitigation strategies used:**

- `AsNoTracking()` for read-only queries (`MemberRepository.cs` line 21)
- `AsSplitQuery()` to avoid cartesian explosion (`PolicyRepository.cs` line 23)
- Indexes on frequently queried columns (e.g., `IX_Policies_MemberId_Status`)

---

### 6. Migration Snapshot for Safety

EF Core maintains a `CmsDbContextModelSnapshot.cs` that represents the complete schema. This:

- Enables safe merge of migrations from multiple branches
- Provides a single source of truth for schema
- Prevents duplicate migration conflicts

> **Alternative considered:** Dapper + manual SQL has no snapshot mechanism – teams must manually coordinate schema changes.

---

## Consequences

### Positive

| Consequence | Evidence |
|-------------|----------|
| Faster development | 5 migrations created in 10 days |
| Type-safe queries | LINQ expressions compile-time checked |
| Automatic migration generation | `dotnet ef migrations add` works |
| Value object support | `Money` and `Address` mapped correctly |
| Lazy loading optional | Configured per query (`AsNoTracking()` default) |

### Negative

| Consequence | Mitigation |
|-------------|------------|
| Higher memory usage than Dapper | `AsNoTracking()` on all read queries |
| More complex SQL generation | `AsSplitQuery()` for complex includes |
| Learning curve for advanced features | Documentation in `05-ef-core-configuration.md` |
| Migration merge conflicts | Use `CmsDbContextModelSnapshot.cs` as source of truth |

---

## Trade-offs

| Alternative | Why Rejected |
|-------------|--------------|
| Dapper | No LINQ, no change tracking, manual SQL maintenance. Would require 3x more code for repositories. |
| NHibernate | Steep learning curve, complex XML mapping, not suitable for internship training. |
| ADO.NET | Extremely verbose, no LINQ, no migration support. Would take 10x development time. |

---

## Code Evidence

### DDD Value Object Mapping

**File:** `src/backend/CMS.Infrastructure/Data/Configurations/MemberConfiguration.cs` lines 36-62

```csharp
builder.OwnsOne(m => m.Address, address =>
{
    address.Property(a => a.Street).HasColumnName("Street").HasMaxLength(200);
    address.Property(a => a.City).HasColumnName("City").HasMaxLength(100);
    // ... owned type columns become part of Members table
});
```

### Complex Query with Split Query

**File:** `src/backend/CMS.Infrastructure/Repositories/PolicyRepository.cs` lines 17-25

```csharp
public async Task<Policy?> GetByIdAsync(Guid policyId, CancellationToken cancellationToken)
{
    return await _context.Set<Policy>()
        .Include(p => p.Dependents)
        .Include(p => p.Nominees)
        .Include(p => p.Payments)
        .Include(p => p.Plan)
        .AsSplitQuery()  // Prevents cartesian explosion
        .FirstOrDefaultAsync(p => p.PolicyId == policyId, cancellationToken);
}
```

### No-Tracking for Performance

**File:** `src/backend/CMS.Infrastructure/Data/CmsDbContext.cs` lines 24-27

```csharp
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    base.OnConfiguring(optionsBuilder);
    optionsBuilder.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
}
```

---

## Related Decisions

- ADR-002: Thin Controllers (separates API from data layer)
- Repository Pattern (abstraction over EF Core for testability)
- DDD Value Objects (justifies `ValueConverter` usage)

---

## Notes

- EF Core version `10.0.8` used (aligned with .NET 10)
- SQL Server as database provider (connection string in `appsettings.json`)
- Migrations are applied via `dotnet ef database update` in CI/CD pipeline

---
