using CMS.Application.DTOs.Member;
using CMS.Application.DTOs.Plan;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Domain.Entities;
using CMS.Domain.ValueObjects;

namespace CMS.Application.Services;

public sealed class MemberService : IMemberService
{
    private readonly IMemberRepository _memberRepository;
    private readonly IFileStorageService _fileStorageService;

    public MemberService(
        IMemberRepository memberRepository,
        IFileStorageService fileStorageService)
    {
        _memberRepository = memberRepository;
        _fileStorageService = fileStorageService;
    }

    public async Task<Guid> RegisterMemberAsync(RegisterMemberRequest request, CancellationToken cancellationToken)
    {
        var address = new Address(
            request.Street,
            request.City,
            request.State,
            request.Country,
            request.PostalCode
        );

        // Password will be set separately by AuthService
        var member = new Member(
            request.FullName,
            request.Email,
            request.DateOfBirth,
            address
        );

        await _memberRepository.AddAsync(member, cancellationToken);
        return member.MemberId;
    }

    public async Task AssignPlanAsync(Guid memberId, AssignPlanRequest request, CancellationToken cancellationToken)
    {
        // Implementation will be added later
        await Task.CompletedTask;
    }

    public async Task UpdateProfileAsync(Guid memberId, UpdateMemberProfileRequest request, CancellationToken cancellationToken)
    {
        var member = await _memberRepository.GetByIdAsync(memberId, cancellationToken);
        if (member == null)
        {
            throw new InvalidOperationException("Member not found.");
        }

        var address = new Address(
            request.Street,
            request.City,
            request.State,
            request.Country,
            request.PostalCode
        );

        member.UpdateAddress(address, request.ContactNumber);
        await _memberRepository.UpdateAsync(member, cancellationToken);
    }

    public async Task UpdateActivePlanAsync(Guid memberId, UpdatePlanRequest request, CancellationToken cancellationToken)
    {
        // Implementation will be added later
        await Task.CompletedTask;
    }

    public async Task<MemberDashboardResponse> GetMyDashboardAsync(Guid memberId, CancellationToken cancellationToken)
    {
        var member = await _memberRepository.GetByIdWithActivePlanAsync(memberId, cancellationToken);
        if (member == null)
        {
            throw new InvalidOperationException("Member not found.");
        }

        return new MemberDashboardResponse
        {
            FullName = member.FullName,
            Email = member.Email,
            ActivePlan = member.ActivePlan != null ? new ActivePlanDto
            {
                Id = member.ActivePlan.PlanId,
                Name = member.ActivePlan.Name,
                InsuredAmount = member.ActivePlan.InsuredAmount,
                StartDate = member.ActivePlan.StartDate,
                EndDate = member.ActivePlan.EndDate
            } : null,
            ActivePolicyId = null,
            ActivePolicyNumber = null
        };
    }

    // ✅ NEW: Upload Profile Photo
    public async Task<string> UploadProfilePhotoAsync(
        Guid memberId,
        Stream fileStream,
        string fileName,
        CancellationToken cancellationToken)
    {
        var member = await _memberRepository.GetByIdAsync(memberId, cancellationToken);
        if (member == null)
        {
            throw new InvalidOperationException("Member not found.");
        }

        // Validate file
        var extension = Path.GetExtension(fileName).ToLower();
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        if (!allowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException("Invalid file format. Allowed: JPG, PNG, GIF, WEBP");
        }

        // If member already has a photo, delete it first
        if (!string.IsNullOrEmpty(member.ProfilePhotoUrl))
        {
            await _fileStorageService.DeleteProfilePhotoAsync(member.ProfilePhotoUrl, cancellationToken);
        }

        // Upload new photo
        var photoUrl = await _fileStorageService.UploadProfilePhotoAsync(
            memberId,
            fileStream,
            fileName,
            cancellationToken);

        // Update member
        member.UpdateProfilePhoto(photoUrl);
        await _memberRepository.UpdateAsync(member, cancellationToken);

        return photoUrl;
    }

    // ✅ NEW: Remove Profile Photo
    public async Task RemoveProfilePhotoAsync(Guid memberId, CancellationToken cancellationToken)
    {
        var member = await _memberRepository.GetByIdAsync(memberId, cancellationToken);
        if (member == null)
        {
            throw new InvalidOperationException("Member not found.");
        }

        if (!string.IsNullOrEmpty(member.ProfilePhotoUrl))
        {
            await _fileStorageService.DeleteProfilePhotoAsync(member.ProfilePhotoUrl, cancellationToken);
        }

        member.RemoveProfilePhoto();
        await _memberRepository.UpdateAsync(member, cancellationToken);
    }

    // ✅ NEW: Get Profile
    public async Task<ProfileResponse> GetProfileAsync(Guid memberId, CancellationToken cancellationToken)
    {
        var member = await _memberRepository.GetByIdAsync(memberId, cancellationToken);
        if (member == null)
        {
            throw new InvalidOperationException("Member not found.");
        }

        return new ProfileResponse
        {
            MemberId = member.MemberId,
            FullName = member.FullName,
            Email = member.Email,
            DateOfBirth = member.DateOfBirth,
            PhoneNumber = member.PhoneNumber ?? member.ContactNumber,
            ProfilePhotoUrl = member.ProfilePhotoUrl,
            Address = new AddressDto
            {
                Street = member.Address.Street,
                City = member.Address.City,
                State = member.Address.State,
                Country = member.Address.Country,
                PostalCode = member.Address.PostalCode
            }
        };
    }
}