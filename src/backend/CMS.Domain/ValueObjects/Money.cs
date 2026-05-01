namespace CMS.Domain.ValueObjects;

public sealed class Money
{
    public decimal Amount { get; private set; }

    // ✅ Required by EF Core (DO NOT USE DIRECTLY)
    private Money() { }

    public Money(decimal amount)
    {
        if (amount < 0)
            throw new ArgumentException("Amount cannot be negative.", nameof(amount));

        Amount = Math.Round(amount, 2, MidpointRounding.AwayFromZero);
    }

    public static Money Zero => new Money(0);

    public Money Add(Money other)
    {
        if (other is null)
            throw new ArgumentNullException(nameof(other));

        return new Money(Amount + other.Amount);
    }

    public Money Subtract(Money other)
    {
        if (other is null)
            throw new ArgumentNullException(nameof(other));

        if (other.Amount > Amount)
            throw new InvalidOperationException("Insufficient amount.");

        return new Money(Amount - other.Amount);
    }

    // Operator overloads 
    public static Money operator +(Money left, Money right)
        => left.Add(right);

    public static Money operator -(Money left, Money right)
        => left.Subtract(right);

    // Value-based equality
    public bool Equals(Money? other)
    {
        if (other is null)
            return false;

        return Amount == other.Amount;
    }

    public override bool Equals(object? obj)
        => Equals(obj as Money);

    public override int GetHashCode()
        => Amount.GetHashCode();
}