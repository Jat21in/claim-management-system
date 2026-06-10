using CMS.Domain.Entities;

namespace CMS.Application.Interfaces.Services;

public interface IPdfGenerationService
{
    Task<byte[]> GeneratePolicyCertificateAsync(Policy policy, Member member, Plan plan, CancellationToken cancellationToken);
    Task<byte[]> GeneratePaymentReceiptAsync(PremiumPayment payment, Policy policy, Member member, CancellationToken cancellationToken);
    Task<byte[]> GenerateClaimSettlementLetterAsync(Claim claim, Member member, Policy policy, CancellationToken cancellationToken);
    Task<byte[]> GenerateGstInvoiceAsync(PremiumPayment payment, Policy policy, Member member, CancellationToken cancellationToken);
}