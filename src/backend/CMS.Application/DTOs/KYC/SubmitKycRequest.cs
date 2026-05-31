using CMS.Domain.Enums;

namespace CMS.Application.DTOs.KYC;

public sealed class SubmitKycRequest
{
    public DocumentType DocumentType { get; init; }
    public string DocumentNumber { get; init; } = null!;
}