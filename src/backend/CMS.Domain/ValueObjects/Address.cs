namespace CMS.Domain.ValueObjects;

public sealed class Address
{
    public string Street { get; private set; } = null!;
    public string City { get; private set; } = null!;
    public string State { get; private set; } = null!;
    public string Country { get; private set; } = null!;
    public string PostalCode { get; private set; } = null!;

    // ✅ Required by EF Core
    private Address() { }

    public Address(
        string street,
        string city,
        string state,
        string country,
        string postalCode)
    {
        Street = string.IsNullOrWhiteSpace(street)
            ? throw new ArgumentException("Street is required")
            : street;

        City = string.IsNullOrWhiteSpace(city)
            ? throw new ArgumentException("City is required")
            : city;

        State = string.IsNullOrWhiteSpace(state)
            ? throw new ArgumentException("State is required")
            : state;

        Country = string.IsNullOrWhiteSpace(country)
            ? throw new ArgumentException("Country is required")
            : country;

        PostalCode = string.IsNullOrWhiteSpace(postalCode)
            ? throw new ArgumentException("Postal code is required")
            : postalCode;
    }
}