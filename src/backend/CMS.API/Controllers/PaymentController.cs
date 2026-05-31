using CMS.Application.DTOs.Payment;
using CMS.Application.Interfaces.Services;
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

    public PaymentController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
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
}
