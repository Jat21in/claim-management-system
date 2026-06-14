// /src/backend/CMS.Domain/Entities/Policy.cs

using CMS.Domain.Enums;

namespace CMS.Domain.Entities;

public sealed class Policy
{
    public Guid PolicyId { get; private set; }
    public Guid MemberId { get; private set; }
    public Guid PlanId { get; private set; }
    public string PolicyNumber { get; private set; } = null!;
    public PolicyStatus Status { get; private set; }

    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public DateTime? LapsedAt { get; private set; }
    public DateTime? CancelledAt { get; private set; }

    public decimal MonthlyPremium { get; private set; }
    public decimal AnnualPremium { get; private set; }
    public decimal SumInsured { get; private set; }
    public decimal UtilizedAmount { get; private set; }

    // ✅ EXISTING FIELDS
    public DateTime? LastPaymentDate { get; private set; }

    // ✅ NEW FIELDS - ADD THESE (line 237-240 errors)
    public decimal? LastPaymentAmount { get; private set; }
    public DateTime? NextPremiumDueDate { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // Navigation properties
    public Member? Member { get; private set; }
    public Plan? Plan { get; private set; }

    private readonly List<Dependent> _dependents = new();
    public IReadOnlyCollection<Dependent> Dependents => _dependents.AsReadOnly();

    private readonly List<Nominee> _nominees = new();
    public IReadOnlyCollection<Nominee> Nominees => _nominees.AsReadOnly();

    private readonly List<PremiumPayment> _payments = new();
    public IReadOnlyCollection<PremiumPayment> Payments => _payments.AsReadOnly();

    private Policy() { }

    public Policy(
        Guid memberId,
        Guid planId,
        string policyNumber,
        decimal monthlyPremium,
        decimal annualPremium,
        decimal sumInsured,
        DateTime startDate,
        int durationInMonths)
    {
        PolicyId = Guid.NewGuid();
        MemberId = memberId;
        PlanId = planId;
        PolicyNumber = policyNumber;

        Status = PolicyStatus.Active;

        MonthlyPremium = monthlyPremium;
        AnnualPremium = annualPremium;
        SumInsured = sumInsured;

        UtilizedAmount = 0;

        StartDate = startDate;
        EndDate = startDate.AddMonths(durationInMonths);

        CreatedAt = DateTime.UtcNow;
    }

    public void AddDependent(Dependent dependent)
    {
        if (dependent == null)
            throw new ArgumentNullException(nameof(dependent));

        _dependents.Add(dependent);

        UpdatedAt = DateTime.UtcNow;
    }

    public void AddNominee(Nominee nominee)
    {
        if (nominee == null)
            throw new ArgumentNullException(nameof(nominee));

        var totalPercentage = _nominees.Sum(n => n.PercentageAllocation) + nominee.PercentageAllocation;

        if (totalPercentage > 100)
        {
            throw new InvalidOperationException("Total nominee allocation cannot exceed 100%");
        }

        _nominees.Add(nominee);

        UpdatedAt = DateTime.UtcNow;
    }

    public void RecordPayment(PremiumPayment payment)
    {
        if (payment == null)
            throw new ArgumentNullException(nameof(payment));

        if (!_payments.Any(p => p.PaymentId == payment.PaymentId))
        {
            _payments.Add(payment);
        }

        if (payment.Status == PaymentStatus.Completed)
        {
            LastPaymentDate = payment.PaymentDate;
            LastPaymentAmount = payment.Amount;  // ✅ Now works
            NextPremiumDueDate = payment.DueDate.AddMonths(1);  // ✅ Now works

            if (Status == PolicyStatus.Lapsed)
            {
                Status = PolicyStatus.Active;
                LapsedAt = null;
            }

            UpdatedAt = DateTime.UtcNow;
        }
    }

    // ✅ FIXED RecordPayment overload
    public void RecordPayment(decimal amount, DateTime paymentDueDate)
    {
        LastPaymentDate = DateTime.UtcNow;
        LastPaymentAmount = amount;
        NextPremiumDueDate = paymentDueDate.AddMonths(1);

        if (Status == PolicyStatus.Lapsed)
        {
            Status = PolicyStatus.Active;
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public bool CanClaim(decimal amount)
    {
        return Status == PolicyStatus.Active &&
               (UtilizedAmount + amount) <= SumInsured &&
               DateTime.UtcNow <= EndDate;
    }

    public void UtilizeClaimAmount(decimal amount)
    {
        if (!CanClaim(amount))
        {
            throw new InvalidOperationException("Claim amount exceeds available coverage");
        }

        UtilizedAmount += amount;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Lapse()
    {
        if (Status != PolicyStatus.Active)
            return;

        Status = PolicyStatus.Lapsed;
        LapsedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Cancel()
    {
        if (Status == PolicyStatus.Active)
        {
            Status = PolicyStatus.Cancelled;
            CancelledAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public DateTime GetNextPremiumDueDate()
    {
        if (NextPremiumDueDate.HasValue)
            return NextPremiumDueDate.Value;

        if (LastPaymentDate.HasValue)
            return LastPaymentDate.Value.AddMonths(1);

        var lastPayment = _payments
            .Where(p => p.Status == PaymentStatus.Completed)
            .OrderByDescending(p => p.PaymentDate)
            .FirstOrDefault();

        if (lastPayment != null)
            return lastPayment.PaymentDate.AddMonths(1);

        return StartDate.AddMonths(1);
    }

    public bool IsPremiumPaidForCurrentMonth()
    {
        var nextDue = GetNextPremiumDueDate();
        return nextDue > DateTime.UtcNow;
    }

    public bool IsPremiumDue(DateTime currentDate)
    {
        var nextDue = GetNextPremiumDueDate();
        return currentDate >= nextDue;
    }

    public void Reinstate()
    {
        if (Status != PolicyStatus.Lapsed)
        {
            throw new InvalidOperationException("Only lapsed policies can be reinstated.");
        }

        Status = PolicyStatus.Active;
        LapsedAt = null;
        UpdatedAt = DateTime.UtcNow;
    }
}