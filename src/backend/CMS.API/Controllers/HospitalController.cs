using CMS.Application.Interfaces.Repositories;
using CMS.Domain.Entities;
using CMS.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CMS.API.Controllers;

[ApiController]
[Route("api/v1/hospitals")]
public sealed class HospitalController : ControllerBase
{
    private readonly CmsDbContext _dbContext;

    public HospitalController(CmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// Get all network hospitals (No authentication required)
    /// </summary>
    [HttpGet("network")]
    [AllowAnonymous]
    public async Task<IActionResult> GetNetworkHospitals(
        [FromQuery] string? city = null,
        [FromQuery] string? specialization = null,
        [FromQuery] bool? isCashless = null)
    {
        var query = _dbContext.NetworkHospitals
            .Where(h => h.IsActive)
            .AsQueryable();

        if (!string.IsNullOrEmpty(city))
            query = query.Where(h => h.City.Contains(city));

        if (!string.IsNullOrEmpty(specialization))
            query = query.Where(h => h.Specializations.Contains(specialization));

        var hospitals = await query
            .Select(h => new
            {
                h.HospitalId,
                h.HospitalName,
                h.Address,
                h.City,
                h.State,
                h.PinCode,
                h.ContactNumber,
                h.Email,
                h.CashlessLimit,
                h.ConsultationFee,
                Specializations = h.Specializations,
                IsCashlessAvailable = h.CashlessLimit > 0,
                RoomRates = h.RoomRates
            })
            .ToListAsync();

        return Ok(hospitals);
    }

    /// <summary>
    /// Get hospital by ID
    /// </summary>
    [HttpGet("network/{hospitalId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetHospitalById(Guid hospitalId)
    {
        var hospital = await _dbContext.NetworkHospitals
            .Where(h => h.HospitalId == hospitalId && h.IsActive)
            .Select(h => new
            {
                h.HospitalId,
                h.HospitalName,
                h.RegistrationNumber,
                h.Address,
                h.City,
                h.State,
                h.PinCode,
                h.ContactNumber,
                h.Email,
                h.CashlessLimit,
                h.ConsultationFee,
                Specializations = h.Specializations,
                RoomRates = h.RoomRates
            })
            .FirstOrDefaultAsync();

        if (hospital == null)
            return NotFound(new { error = "Hospital not found" });

        return Ok(hospital);
    }
}
