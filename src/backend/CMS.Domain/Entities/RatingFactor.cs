namespace CMS.Domain.Entities;

public sealed class RatingFactor
{
    public Guid RatingFactorId { get; private set; } = Guid.NewGuid();

    public string FactorName { get; private set; } = string.Empty;

    public decimal Percentage { get; private set; }

    public string Description { get; private set; } = string.Empty;

    private RatingFactor()
    {
    }

    public RatingFactor(
        string factorName,
        decimal percentage,
        string description)
    {
        FactorName = factorName;
        Percentage = percentage;
        Description = description;
    }
}