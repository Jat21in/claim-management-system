namespace CMS.Application.DTOs.Claim;

public sealed class ProcessClaimPaymentRequest
{
    public string PaymentMode { get; init; } = "NEFT"; // NEFT, IMPS, CHEQUE
    public string BankAccountNumber { get; init; } = string.Empty;
    public string IfscCode { get; init; } = string.Empty;
    public string AccountHolderName { get; init; } = string.Empty;
    public string? ChequeNumber { get; init; }
    public DateTime? ChequeDate { get; init; }
}

public sealed class ClaimPaymentResult
{
    public bool Success { get; init; }
    public string PaymentReferenceNumber { get; init; } = string.Empty;
    public DateTime PaymentDate { get; init; }
    public string Message { get; init; } = string.Empty;
}
