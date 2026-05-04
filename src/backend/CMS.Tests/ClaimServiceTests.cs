using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;
using NSubstitute;
using CMS.Application.DTOs.Claim;
using CMS.Application.Interfaces.Repositories;
using CMS.Domain.Entities;

namespace CMS.Tests;

public class ClaimServiceTests
{
    [Fact]
    public async Task SubmitClaim_ShouldThrow_When_NoActivePlan()
    {
        // Arrange
        var memberRepo = Substitute.For<IMemberRepository>();
        var claimRepo = Substitute.For<IClaimRepository>();

        memberRepo
            .GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((Member?)null);

        var service = new ClaimService(
            memberRepo,
            claimRepo);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SubmitClaimAsync(
                Guid.NewGuid(),
                new SubmitClaimRequest
                {
                    ClaimDate = DateTime.Today,
                    Amount = 5000,
                    Description = "Test"
                },
                CancellationToken.None));
    }
}