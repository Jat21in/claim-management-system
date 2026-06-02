using CMS.API.Attributes;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Domain.Entities;
using CMS.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CMS.API.Controllers.Admin;

[AuthorizeAdmin]
[ApiController]
[Route("api/admin/kyc")]
public sealed class AdminKycController : ControllerBase
{
    private readonly IKycService _kycService;
    private readonly IMemberRepository _memberRepository;
    private readonly IKycRepository _kycRepository;

    public AdminKycController(
        IKycService kycService,
        IMemberRepository memberRepository,
        IKycRepository kycRepository)
    {
        _kycService = kycService;
        _memberRepository = memberRepository;
        _kycRepository = kycRepository;
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingKycRequests()
    {
        var pending = await _kycService.GetPendingKycRequestsAsync(HttpContext.RequestAborted);
        return Ok(pending);
    }

    // ✅ NEW: Get ALL KYC requests (with filters)
    [HttpGet("all")]
    public async Task<IActionResult> GetAllKycRequests(
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var allMembers = await _memberRepository.GetAllAsync(HttpContext.RequestAborted);
        var result = new List<object>();

        foreach (var member in allMembers)
        {
            var documents = await _kycRepository.GetByMemberIdAsync(member.MemberId, HttpContext.RequestAborted);

            // Apply status filter
            if (!string.IsNullOrEmpty(status))
            {
                var statusEnum = status.ToLower() switch
                {
                    "pending" => MemberStatus.Pending,
                    "verified" => MemberStatus.Verified,
                    "rejected" => MemberStatus.Rejected,
                    _ => (MemberStatus?)null
                };

                if (statusEnum.HasValue && member.Status != statusEnum.Value)
                    continue;
            }

            // Apply search filter
            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                if (!member.FullName.ToLower().Contains(searchLower) &&
                    !member.Email.ToLower().Contains(searchLower) &&
                    !documents.Any(d => d.DocumentNumber.Contains(searchLower)))
                    continue;
            }

            result.Add(new
            {
                memberId = member.MemberId,
                fullName = member.FullName,
                email = member.Email,
                status = member.Status.ToString(),
                submittedAt = member.KycSubmittedAt,
                verifiedAt = member.KycVerifiedAt,
                rejectionReason = member.RejectionReason,
                documents = documents.Select(d => new
                {
                    d.DocumentId,
                    d.DocumentType,
                    d.DocumentNumber,
                    d.FileUrl,
                    d.FileName,
                    d.IsVerified,
                    d.UploadedAt
                }),
                claimsCount = member.Claims?.Count ?? 0
            });
        }

        // Apply pagination
        var totalCount = result.Count;
        var pagedResult = result.Skip((page - 1) * pageSize).Take(pageSize);

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
            items = pagedResult
        });
    }

    // ✅ NEW: Get KYC statistics
    [HttpGet("stats")]
    public async Task<IActionResult> GetKycStats()
    {
        var allMembers = await _memberRepository.GetAllAsync(HttpContext.RequestAborted);

        var stats = new
        {
            pending = allMembers.Count(m => m.Status == MemberStatus.Pending && m.KycSubmittedAt.HasValue),
            verified = allMembers.Count(m => m.Status == MemberStatus.Verified),
            rejected = allMembers.Count(m => m.Status == MemberStatus.Rejected),
            total = allMembers.Count(),
            todaySubmitted = allMembers.Count(m => m.KycSubmittedAt.HasValue && m.KycSubmittedAt.Value.Date == DateTime.UtcNow.Date),
            averageProcessingTime = CalculateAverageProcessingTime(allMembers)
        };

        return Ok(stats);
    }

    private string CalculateAverageProcessingTime(IEnumerable<Member> members)
    {
        var verifiedMembers = members.Where(m => m.Status == MemberStatus.Verified && m.KycSubmittedAt.HasValue && m.KycVerifiedAt.HasValue);
        if (!verifiedMembers.Any())
            return "0 days";

        var avgHours = verifiedMembers.Average(m => (m.KycVerifiedAt.Value - m.KycSubmittedAt.Value).TotalHours);

        if (avgHours < 24)
            return $"{Math.Round(avgHours, 1)} hours";
        else
            return $"{Math.Round(avgHours / 24, 1)} days";
    }

    [HttpPost("{memberId:guid}/approve")]
    public async Task<IActionResult> ApproveKyc(Guid memberId)
    {
        var adminId = Guid.Parse(User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)!);

        await _kycService.ApproveKycAsync(adminId, memberId, HttpContext.RequestAborted);

        return Ok(new { message = "KYC approved successfully" });
    }

    [HttpPost("{memberId:guid}/reject")]
    public async Task<IActionResult> RejectKyc(Guid memberId, [FromBody] RejectionRequest request)
    {
        var adminId = Guid.Parse(User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)!);

        await _kycService.RejectKycAsync(adminId, memberId, request.Reason, HttpContext.RequestAborted);

        return Ok(new { message = "KYC rejected" });
    }
}

public class RejectionRequest
{
    public string Reason { get; set; } = string.Empty;
}
