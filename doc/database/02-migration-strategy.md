# Migration Strategy

## Overview

Entity Framework Core Migrations are used to manage database schema changes. Migrations are stored in `CMS.Infrastructure/Migrations/` and applied using `dotnet ef` commands.

**Design-Time Factory:** `src/backend/CMS.Infrastructure/Data/CmsDbContextFactory.cs`

---

## Migration History

| Migration | Date | Description |
|---|---|---|
| `20260601085111_AddPhoneNumberToMember` | 2026-06-01 | Add PhoneNumber column to Members table |
| `20260603071928_AddPendingToClaimStatus` | 2026-06-03 | Add Pending status to ClaimStatus enum, modify PhoneNumber length |
| `20260606173901_AddPremiumConfigurationToPlan` | 2026-06-06 | Add premium calculation fields to Plans table |
| `20260607164920_AddLastPaymentDateToPolicy` | 2026-06-07 | Add LastPaymentDate to Policies table |
| `20260610150053_AddUpdatedAtToPlan` | 2026-06-10 | Add UpdatedAt and RequiredKycDocumentsJson to Plans |

---

## Migration Details

### Migration 1: `20260601085111_AddPhoneNumberToMember`

**File:** `src/backend/CMS.Infrastructure/Migrations/20260601085111_AddPhoneNumberToMember.cs`

```csharp
public partial class AddPhoneNumberToMember : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "PhoneNumber",
            table: "Members",
            type: "nvarchar(max)",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "PhoneNumber",
            table: "Members");
    }
}
```

> Purpose: Add phone number field for OTP verification during KYC.

---

### Migration 2: `20260603071928_AddPendingToClaimStatus`

**File:** `src/backend/CMS.Infrastructure/Migrations/20260603071928_AddPendingToClaimStatus.cs`

```csharp
public partial class AddPendingToClaimStatus : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<string>(
            name: "PhoneNumber",
            table: "Members",
            type: "nvarchar(20)",
            maxLength: 20,
            nullable: true,
            oldClrType: typeof(string),
            oldType: "nvarchar(max)",
            oldNullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<string>(
            name: "PhoneNumber",
            table: "Members",
            type: "nvarchar(max)",
            nullable: true,
            oldClrType: typeof(string),
            oldType: "nvarchar(20)",
            oldMaxLength: 20,
            oldNullable: true);
    }
}
```

> Purpose: Add `Pending` value to `ClaimStatus` enum; constrain `PhoneNumber` to 20 characters (from `NVARCHAR(MAX)`).

---

### Migration 3: `20260606173901_AddPremiumConfigurationToPlan`

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

        migrationBuilder.AddColumn<int>(
            name: "MaxNomineesAllowed",
            table: "Plans",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<string>(
            name: "RequiredKycDocuments",
            table: "Plans",
            type: "nvarchar(max)",
            nullable: false,
            defaultValue: "[]");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "BasePremiumAnnual", table: "Plans");
        migrationBuilder.DropColumn(name: "DependentLoadingPercentage", table: "Plans");
        migrationBuilder.DropColumn(name: "MaxDependentsAllowed", table: "Plans");
        migrationBuilder.DropColumn(name: "MaxNomineesAllowed", table: "Plans");
        migrationBuilder.DropColumn(name: "RequiredKycDocuments", table: "Plans");
    }
}
```

> Purpose: Add premium calculation fields to the Plans table.

---

### Migration 4: `20260607164920_AddLastPaymentDateToPolicy`

**File:** `src/backend/CMS.Infrastructure/Migrations/20260607164920_AddLastPaymentDateToPolicy.cs`

```csharp
public partial class AddLastPaymentDateToPolicy : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "LastPaymentDate",
            table: "Policies",
            type: "datetime2",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "LastPaymentDate",
            table: "Policies");
    }
}
```

> Purpose: Track last premium payment date for grace period calculations.

---

### Migration 5: `20260610150053_AddUpdatedAtToPlan`

**File:** `src/backend/CMS.Infrastructure/Migrations/20260610150053_AddUpdatedAtToPlan.cs`

```csharp
public partial class AddUpdatedAtToPlan : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "RequiredKycDocumentsJson",
            table: "Plans",
            type: "nvarchar(max)",
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<DateTime>(
            name: "UpdatedAt",
            table: "Plans",
            type: "datetime2",
            nullable: false,
            defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

        migrationBuilder.AddColumn<DateTime>(
            name: "UpdatedAt",
            table: "NetworkHospitals",
            type: "datetime2",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "RequiredKycDocumentsJson", table: "Plans");
        migrationBuilder.DropColumn(name: "UpdatedAt", table: "Plans");
        migrationBuilder.DropColumn(name: "UpdatedAt", table: "NetworkHospitals");
    }
}
```

> Purpose: Add audit timestamps to Plans and NetworkHospitals.

---

## Design-Time DbContext Factory

**File:** `src/backend/CMS.Infrastructure/Data/CmsDbContextFactory.cs`

```csharp
public sealed class CmsDbContextFactory : IDesignTimeDbContextFactory<CmsDbContext>
{
    public CmsDbContext CreateDbContext(string[] args)
    {
        var apiProjectPath = Path.GetFullPath(
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "CMS.API")
        );

        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiProjectPath)
            .AddJsonFile("appsettings.json", optional: false)
            .Build();

        var optionsBuilder = new DbContextOptionsBuilder<CmsDbContext>();
        optionsBuilder.UseSqlServer(
            configuration.GetConnectionString("CmsDatabase"));

        return new CmsDbContext(optionsBuilder.Options);
    }
}
```

> Purpose: Allows EF Core tools to locate the connection string during migration generation (`dotnet ef migrations add`).

---

## Migration Commands

### Generate a New Migration

```bash
# From the CMS.API project directory
cd src/backend/CMS.API

# Add migration
dotnet ef migrations add AddNewColumnToTable \
    --project ../CMS.Infrastructure \
    --startup-project . \
    --output-dir Migrations

# With custom namespace
dotnet ef migrations add AddPolicyNumberIndex \
    --project ../CMS.Infrastructure \
    --startup-project . \
    --output-dir Migrations \
    --namespace CMS.Infrastructure.Migrations
```

### Apply Migrations to Database

```bash
# Update to latest migration
dotnet ef database update \
    --project ../CMS.Infrastructure \
    --startup-project .

# Update to specific migration
dotnet ef database update 20260606173901_AddPremiumConfigurationToPlan \
    --project ../CMS.Infrastructure \
    --startup-project .
```

### Remove Last Migration (if not yet applied)

```bash
dotnet ef migrations remove \
    --project ../CMS.Infrastructure \
    --startup-project .
```

### Generate SQL Script (for DBA review)

```bash
dotnet ef migrations script \
    --project ../CMS.Infrastructure \
    --startup-project . \
    --output migration.sql
```

### View Pending Migrations

```bash
dotnet ef migrations list \
    --project ../CMS.Infrastructure \
    --startup-project .
```

---

## Migration Best Practices

### 1. Always Test the Down Migration

```csharp
// Ensure Down() correctly reverts everything Up() did
protected override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.DropColumn(name: "NewColumn", table: "Members");
}
```

### 2. Use Default Values for Non-Nullable Columns

```csharp
migrationBuilder.AddColumn<string>(
    name: "NewColumn",
    table: "Members",
    type: "nvarchar(100)",
    nullable: false,
    defaultValue: "");  // Prevents errors on existing rows
```

### 3. Avoid Data Loss in Down Migration

```csharp
// If Up() removes a column, Down() cannot restore its data.
// Consider making columns nullable instead of dropping them.
```

### 4. Use `migrationBuilder.Sql()` for Complex Changes

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.Sql(@"
        UPDATE Members
        SET Status = 1
        WHERE Status = 0 AND KycVerifiedAt IS NOT NULL
    ");
}
```

---

## EF Core Fluent API vs Migrations

| Concern | Handled By | File |
|---|---|---|
| Table name | Fluent API | `MemberConfiguration.cs` |
| Column types | Fluent API | `MemberConfiguration.cs` |
| Max length | Fluent API | `MemberConfiguration.cs` |
| Required / Nullable | Fluent API | `MemberConfiguration.cs` |
| Relationships | Fluent API | `MemberConfiguration.cs` |
| Indexes | Fluent API | `MemberConfiguration.cs` |
| New columns | Migration | `20260601085111_*.cs` |
| Column modifications | Migration | `20260603071928_*.cs` |

> Rule: Schema structure → Fluent API. Schema changes → Migrations.

---

## Current Schema State

After applying all 5 migrations, the database includes:

- 9 entity tables: `Members`, `Plans`, `Policies`, `Claims`, `Dependents`, `Nominees`, `PremiumPayments`, `KycDocuments`, `NetworkHospitals`
- 1 lookup table: `RatingFactors`
- 15+ indexes for query performance
- Foreign key constraints with appropriate delete behaviors

The snapshot file at `src/backend/CMS.Infrastructure/Migrations/CmsDbContextModelSnapshot.cs` is auto-generated and represents the complete current schema. **Do not edit manually.**

---

## Troubleshooting

**"No database provider has been configured"**
Ensure `CmsDbContextFactory` points to the correct API project path.

**"Cannot add migration because another migration is pending"**
Apply pending migrations first, or remove the unapplied one with `migrations remove`.

**"Object already exists"**
The migration may have been partially applied. Roll back with `dotnet ef database update 0`, then re-apply.

**Connection string not found**
Verify that `appsettings.json` exists in the `CMS.API` project and contains the `ConnectionStrings:CmsDatabase` key.