using CMS.Application.DTOs.Payment;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Application.Services;
using CMS.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CMS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/payments")]
public sealed class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IPaymentRepository _paymentRepository;
    private readonly IPolicyRepository _policyRepository;
    private readonly IMemberRepository _memberRepository;
    private readonly IPdfGenerationService _pdfGenerationService;


    public PaymentController(
    IPaymentService paymentService,
    IPaymentRepository paymentRepository,
    IPolicyRepository policyRepository,
    IMemberRepository memberRepository,
    IPdfGenerationService pdfGenerationService)
    {
        _paymentService = paymentService;
        _paymentRepository = paymentRepository;
        _policyRepository = policyRepository;
        _memberRepository = memberRepository;
        _pdfGenerationService = pdfGenerationService;
    }


    [HttpPost("initiate")]
    public async Task<IActionResult> InitiatePayment([FromBody] InitiatePaymentRequest request)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var response = await _paymentService.InitiatePaymentAsync(memberId, request, HttpContext.RequestAborted);

        return Ok(response);
    }

    [HttpPost("mock/{paymentId:guid}")]
    public async Task<IActionResult> ProcessMockPayment(Guid paymentId)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var response = await _paymentService.ProcessMockPaymentAsync(memberId, paymentId, HttpContext.RequestAborted);

        return Ok(response);
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetPaymentHistory()
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var history = await _paymentService.GetPaymentHistoryAsync(memberId, HttpContext.RequestAborted);

        return Ok(history);
    }
    // Add to existing PaymentController.cs
    [HttpGet("{paymentId:guid}/receipt")]
    [Authorize]
    public async Task<IActionResult> DownloadPaymentReceipt(Guid paymentId)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("ClaimsProcessor");

        var payment = await _paymentRepository.GetByIdAsync(paymentId, HttpContext.RequestAborted);
        if (payment == null)
            return NotFound(new { error = "Payment not found" });

        var policy = await _policyRepository.GetByIdAsync(payment.PolicyId, HttpContext.RequestAborted);
        if (!isAdmin && policy!.MemberId != memberId)
            return Forbid();

        var member = await _memberRepository.GetByIdAsync(policy!.MemberId, HttpContext.RequestAborted);

        var pdfBytes = await _pdfGenerationService.GeneratePaymentReceiptAsync(payment, policy, member!, HttpContext.RequestAborted);

        return File(pdfBytes, "application/pdf", $"Payment_Receipt_{payment.TransactionId ?? payment.PaymentId.ToString().Substring(0, 8)}.pdf");
    }

    [HttpGet("{paymentId:guid}/gst-invoice")]
    [Authorize]
    public async Task<IActionResult> DownloadGstInvoice(Guid paymentId)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("ClaimsProcessor");

        var payment = await _paymentRepository.GetByIdAsync(paymentId, HttpContext.RequestAborted);
        if (payment == null)
            return NotFound(new { error = "Payment not found" });

        var policy = await _policyRepository.GetByIdAsync(payment.PolicyId, HttpContext.RequestAborted);
        if (!isAdmin && policy!.MemberId != memberId)
            return Forbid();

        var member = await _memberRepository.GetByIdAsync(policy!.MemberId, HttpContext.RequestAborted);

        var pdfBytes = await _pdfGenerationService.GenerateGstInvoiceAsync(payment, policy, member!, HttpContext.RequestAborted);

        return File(pdfBytes, "application/pdf", $"GST_Invoice_{DateTime.Now:yyyyMMdd}_{payment.PaymentId.ToString().Substring(0, 6)}.pdf");
    }

    [HttpGet("recent")]
    [Authorize]
    public async Task<IActionResult> GetRecentPayments()
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("ClaimsProcessor");

        var policy = await _policyRepository.GetByMemberIdAsync(memberId, HttpContext.RequestAborted);
        if (policy == null && !isAdmin)
            return Ok(new List<object>());

        IEnumerable<PremiumPayment> payments;
        if (isAdmin)
        {
            payments = await _paymentRepository.GetPendingPaymentsAsync(HttpContext.RequestAborted);
            payments = payments.OrderByDescending(p => p.CreatedAt).Take(10);
        }
        else
        {
            payments = await _paymentRepository.GetByPolicyIdAsync(policy!.PolicyId, HttpContext.RequestAborted);
        }

        var result = payments.Select(p => new
        {
            p.PaymentId,
            p.Amount,
            p.PaymentDate,
            p.DueDate,
            p.Status,
            p.PaymentMethod,
            p.TransactionId,
            policyNumber = p.Policy?.PolicyNumber
        });

        return Ok(result);
    }
}