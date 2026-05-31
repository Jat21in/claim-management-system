IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528092510_FINAL_REAL_FIX'
)
BEGIN
    CREATE TABLE [Plans] (
        [PlanId] uniqueidentifier NOT NULL,
        [Code] nvarchar(20) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Description] nvarchar(1000) NOT NULL,
        [InsuredAmount] decimal(18,2) NOT NULL,
        [DurationInMonths] int NOT NULL,
        [FeaturesJson] nvarchar(max) NOT NULL,
        [IsFeatured] bit NOT NULL,
        [IsActive] bit NOT NULL,
        [StartDate] datetime2 NOT NULL,
        [EndDate] datetime2 NOT NULL,
        CONSTRAINT [PK_Plans] PRIMARY KEY ([PlanId])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528092510_FINAL_REAL_FIX'
)
BEGIN
    CREATE TABLE [Members] (
        [MemberId] uniqueidentifier NOT NULL,
        [ActivePlanPlanId] uniqueidentifier NULL,
        [FullName] nvarchar(200) NOT NULL,
        [Email] nvarchar(200) NOT NULL,
        [DateOfBirth] datetime2 NOT NULL,
        [Street] nvarchar(200) NOT NULL,
        [City] nvarchar(100) NOT NULL,
        [State] nvarchar(100) NOT NULL,
        [Country] nvarchar(100) NOT NULL,
        [PostalCode] nvarchar(20) NOT NULL,
        [ContactNumber] nvarchar(max) NULL,
        [Role] nvarchar(max) NOT NULL,
        [PasswordHash] nvarchar(500) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Members] PRIMARY KEY ([MemberId]),
        CONSTRAINT [FK_Members_Plans_ActivePlanPlanId] FOREIGN KEY ([ActivePlanPlanId]) REFERENCES [Plans] ([PlanId]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528092510_FINAL_REAL_FIX'
)
BEGIN
    CREATE TABLE [Claims] (
        [ClaimId] uniqueidentifier NOT NULL,
        [MemberId] uniqueidentifier NOT NULL,
        [PlanId] uniqueidentifier NOT NULL,
        [ClaimDate] date NOT NULL,
        [ClaimAmount] decimal(18,2) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [Description] nvarchar(500) NULL,
        [AiConfidenceScore] float(5) NULL,
        [AiDecision] nvarchar(50) NULL,
        [AiReasoning] nvarchar(1000) NULL,
        [AiVerifiedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [MedicalReportFileName] nvarchar(500) NULL,
        [MedicalReportPath] nvarchar(1000) NULL,
        [MedicalReportSize] bigint NULL,
        [MedicalReportContentType] nvarchar(100) NULL,
        CONSTRAINT [PK_Claims] PRIMARY KEY ([ClaimId]),
        CONSTRAINT [FK_Claims_Members_MemberId] FOREIGN KEY ([MemberId]) REFERENCES [Members] ([MemberId]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528092510_FINAL_REAL_FIX'
)
BEGIN
    CREATE INDEX [IX_Claims_MemberId] ON [Claims] ([MemberId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528092510_FINAL_REAL_FIX'
)
BEGIN
    CREATE INDEX [IX_Members_ActivePlanPlanId] ON [Members] ([ActivePlanPlanId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528092510_FINAL_REAL_FIX'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Plans_Code] ON [Plans] ([Code]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528092510_FINAL_REAL_FIX'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260528092510_FINAL_REAL_FIX', N'10.0.7');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    ALTER TABLE [Members] ADD [KycSubmittedAt] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    ALTER TABLE [Members] ADD [KycVerifiedAt] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    ALTER TABLE [Members] ADD [RejectionReason] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    ALTER TABLE [Members] ADD [Status] int NOT NULL DEFAULT 0;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    ALTER TABLE [Members] ADD [VerifiedByAdminId] uniqueidentifier NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    CREATE TABLE [KycDocuments] (
        [DocumentId] uniqueidentifier NOT NULL,
        [MemberId] uniqueidentifier NOT NULL,
        [DocumentType] int NOT NULL,
        [DocumentNumber] nvarchar(100) NOT NULL,
        [FileUrl] nvarchar(500) NOT NULL,
        [FileName] nvarchar(200) NOT NULL,
        [FileSize] bigint NOT NULL,
        [ContentType] nvarchar(max) NULL,
        [IsVerified] bit NOT NULL,
        [VerifiedByAdminId] uniqueidentifier NULL,
        [VerifiedAt] datetime2 NULL,
        [RejectionReason] nvarchar(500) NULL,
        [UploadedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_KycDocuments] PRIMARY KEY ([DocumentId]),
        CONSTRAINT [FK_KycDocuments_Members_MemberId] FOREIGN KEY ([MemberId]) REFERENCES [Members] ([MemberId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    CREATE TABLE [Policies] (
        [PolicyId] uniqueidentifier NOT NULL,
        [MemberId] uniqueidentifier NOT NULL,
        [PlanId] uniqueidentifier NOT NULL,
        [PolicyNumber] nvarchar(50) NOT NULL,
        [Status] int NOT NULL,
        [StartDate] datetime2 NOT NULL,
        [EndDate] datetime2 NOT NULL,
        [LapsedAt] datetime2 NULL,
        [CancelledAt] datetime2 NULL,
        [MonthlyPremium] decimal(18,2) NOT NULL,
        [AnnualPremium] decimal(18,2) NOT NULL,
        [SumInsured] decimal(18,2) NOT NULL,
        [UtilizedAmount] decimal(18,2) NOT NULL DEFAULT 0.0,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Policies] PRIMARY KEY ([PolicyId]),
        CONSTRAINT [FK_Policies_Members_MemberId] FOREIGN KEY ([MemberId]) REFERENCES [Members] ([MemberId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Policies_Plans_PlanId] FOREIGN KEY ([PlanId]) REFERENCES [Plans] ([PlanId]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    CREATE TABLE [Dependents] (
        [DependentId] uniqueidentifier NOT NULL,
        [PolicyId] uniqueidentifier NOT NULL,
        [FullName] nvarchar(200) NOT NULL,
        [Relationship] nvarchar(50) NOT NULL,
        [DateOfBirth] datetime2 NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Dependents] PRIMARY KEY ([DependentId]),
        CONSTRAINT [FK_Dependents_Policies_PolicyId] FOREIGN KEY ([PolicyId]) REFERENCES [Policies] ([PolicyId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    CREATE TABLE [Nominees] (
        [NomineeId] uniqueidentifier NOT NULL,
        [PolicyId] uniqueidentifier NOT NULL,
        [FullName] nvarchar(200) NOT NULL,
        [Relationship] nvarchar(50) NOT NULL,
        [PercentageAllocation] decimal(5,2) NOT NULL,
        [GuardianName] nvarchar(200) NULL,
        [IsPrimary] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Nominees] PRIMARY KEY ([NomineeId]),
        CONSTRAINT [FK_Nominees_Policies_PolicyId] FOREIGN KEY ([PolicyId]) REFERENCES [Policies] ([PolicyId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    CREATE TABLE [PremiumPayments] (
        [PaymentId] uniqueidentifier NOT NULL,
        [PolicyId] uniqueidentifier NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [PaymentDate] datetime2 NOT NULL,
        [DueDate] datetime2 NOT NULL,
        [Status] int NOT NULL,
        [PaymentMethod] nvarchar(50) NULL,
        [TransactionId] nvarchar(100) NULL,
        [ReceiptUrl] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [CompletedAt] datetime2 NULL,
        CONSTRAINT [PK_PremiumPayments] PRIMARY KEY ([PaymentId]),
        CONSTRAINT [FK_PremiumPayments_Policies_PolicyId] FOREIGN KEY ([PolicyId]) REFERENCES [Policies] ([PolicyId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    CREATE INDEX [IX_Dependents_PolicyId] ON [Dependents] ([PolicyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    CREATE INDEX [IX_KycDocuments_IsVerified] ON [KycDocuments] ([IsVerified]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    CREATE INDEX [IX_KycDocuments_MemberId] ON [KycDocuments] ([MemberId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    CREATE INDEX [IX_Nominees_PolicyId] ON [Nominees] ([PolicyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    CREATE INDEX [IX_Policies_MemberId] ON [Policies] ([MemberId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    CREATE INDEX [IX_Policies_PlanId] ON [Policies] ([PlanId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Policies_PolicyNumber] ON [Policies] ([PolicyNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    CREATE INDEX [IX_PremiumPayments_DueDate] ON [PremiumPayments] ([DueDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    CREATE INDEX [IX_PremiumPayments_PolicyId] ON [PremiumPayments] ([PolicyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    CREATE INDEX [IX_PremiumPayments_Status] ON [PremiumPayments] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530082507_AddPolicyAndKYCEntities'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260530082507_AddPolicyAndKYCEntities', N'10.0.7');
END;

COMMIT;
GO

