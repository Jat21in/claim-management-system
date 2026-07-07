using Microsoft.Extensions.Configuration;

namespace CMS.Application.Services;

public class EmailLinkService
{
    private readonly IConfiguration _configuration;
    private readonly string _frontendUrl;
    private readonly string _apiUrl;

    public EmailLinkService(IConfiguration configuration)
    {
        _configuration = configuration;
        _frontendUrl = _configuration["AppUrls:FrontendUrl"] ?? "https://localhost:4200";
        _apiUrl = _configuration["AppUrls:ApiUrl"] ?? "https://localhost:7013";
    }

    public string GetDashboardLink()
    {
        return $"{_frontendUrl}{_configuration["AppUrls:DashboardPath"] ?? "/app/dashboard"}";
    }

    public string GetPaymentLink()
    {
        return $"{_frontendUrl}{_configuration["AppUrls:PaymentPath"] ?? "/app/payments"}";
    }

    public string GetPolicyLink()
    {
        return $"{_frontendUrl}{_configuration["AppUrls:PolicyPath"] ?? "/app/policies"}";
    }

    public string GetClaimsLink()
    {
        return $"{_frontendUrl}{_configuration["AppUrls:ClaimsPath"] ?? "/app/claims"}";
    }

    public string GetKycLink()
    {
        return $"{_frontendUrl}{_configuration["AppUrls:KycPath"] ?? "/app/kyc/upload"}";
    }

    public string GetReinstateLink()
    {
        return $"{_frontendUrl}{_configuration["AppUrls:ReinstatePath"] ?? "/app/policies/reinstate"}";
    }

    public string GetClaimDetailsLink(string claimId)
    {
        return $"{_frontendUrl}/app/claims/{claimId}";
    }

    public string GetPolicyCertificateLink(string policyNumber)
    {
        return $"{_apiUrl}/api/v1/policies/{policyNumber}/certificate";
    }

    public string GetPaymentReceiptLink(string paymentId)
    {
        return $"{_apiUrl}/api/v1/payments/{paymentId}/receipt";
    }

    public string GetGstInvoiceLink(string paymentId)
    {
        return $"{_apiUrl}/api/v1/payments/{paymentId}/gst-invoice";
    }

    public string GetSettlementLetterLink(string claimId)
    {
        return $"{_apiUrl}/api/v1/claims/{claimId}/settlement-letter";
    }

    public string GetMedicalReportLink(string claimId)
    {
        return $"{_apiUrl}/api/v1/claims/{claimId}/medical-report";
    }
}