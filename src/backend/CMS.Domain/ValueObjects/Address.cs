using System;

namespace CMS.Domain.ValueObjects;

public sealed class Address
{
    public string Street { get; }
    public string City { get; }
    public string? State { get; }
    public string Country { get; }
    public string? PostalCode { get; }

    public Address(
        string street,
        string city,
        string? state,
        string country,
        string? postalCode)
    {
        if (string.IsNullOrWhiteSpace(street))
            throw new ArgumentException("Street is required.", nameof(street));

        if (string.IsNullOrWhiteSpace(city))
            throw new ArgumentException("City is required.", nameof(city));

        if (string.IsNullOrWhiteSpace(country))
            throw new ArgumentException("Country is required.", nameof(country));

        Street = street.Trim();
        City = city.Trim();
        State = state?.Trim();
        Country = country.Trim();
        PostalCode = postalCode?.Trim();
    }

    private bool Equals(Address other)
    {
        return Street == other.Street &&
               City == other.City &&
               State == other.State &&
               Country == other.Country &&
               PostalCode == other.PostalCode;
    }

    public override bool Equals(object? obj)
    {
        return obj is Address other && Equals(other);
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(Street, City, State, Country, PostalCode);
    }
}