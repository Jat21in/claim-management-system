using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CMS.Infrastructure.Data;
// using CMS.Application.DTOs.Hospital; // not present - DTO is defined locally in this controller

namespace CMS.API.Controllers;

[ApiController]
[Route("api/v1/hospitals")]
public class HospitalController : ControllerBase
{
    private readonly CmsDbContext _dbContext;

    public HospitalController(CmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("network")]
    public async Task<IActionResult> GetNetworkHospitals([FromQuery] string? city, [FromQuery] string? specialization)
    {
        var query = _dbContext.NetworkHospitals.AsQueryable();

        if (!string.IsNullOrEmpty(city))
        {
            query = query.Where(h => h.City == city);
        }

        if (!string.IsNullOrEmpty(specialization))
        {
            // Specializations is stored as a string column via conversion in the DbContext
            // Use EF.Property<string> to access the underlying column value so EF.Functions.Like can be used
            query = query.Where(h => EF.Functions.Like(EF.Property<string>(h, "Specializations"), $"%{specialization}%"));
        }

        var hospitals = await query
            .Select(h => new NetworkHospitalResponse
            {
                HospitalId = h.HospitalId,
                HospitalName = h.HospitalName,
                Address = h.Address,
                City = h.City,
                State = h.State,
                PinCode = h.PinCode,
                ContactNumber = h.ContactNumber,
                Email = h.Email,
                CashlessLimit = h.CashlessLimit,
                ConsultationFee = h.ConsultationFee,
                Specializations = h.Specializations,
                RoomRates = h.RoomRates,
                IsCashlessAvailable = h.IsActive
            })
            .ToListAsync();

        return Ok(hospitals);
    }

    [HttpGet("cities")]
    public async Task<IActionResult> GetCities()
    {
        var cities = await _dbContext.NetworkHospitals
            .Where(h => h.IsActive)
            .Select(h => h.City)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();

        return Ok(cities);
    }

    [HttpGet("specializations")]
    public async Task<IActionResult> GetSpecializations()
    {
        // Get all distinct specializations from JSON array
        var hospitals = await _dbContext.NetworkHospitals
            .Where(h => h.IsActive)
            .ToListAsync();

        var allSpecializations = hospitals
            .SelectMany(h => h.Specializations ?? Array.Empty<string>())
            .Distinct()
            .OrderBy(s => s)
            .ToList();

        return Ok(allSpecializations);
    }

    [HttpGet("network/{hospitalId:guid}")]
    public async Task<IActionResult> GetHospitalById(Guid hospitalId)
    {
        var hospital = await _dbContext.NetworkHospitals
            .Where(h => h.HospitalId == hospitalId)
            .Select(h => new NetworkHospitalResponse
            {
                HospitalId = h.HospitalId,
                HospitalName = h.HospitalName,
                Address = h.Address,
                City = h.City,
                State = h.State,
                PinCode = h.PinCode,
                ContactNumber = h.ContactNumber,
                Email = h.Email,
                CashlessLimit = h.CashlessLimit,
                ConsultationFee = h.ConsultationFee,
                Specializations = h.Specializations,
                RoomRates = h.RoomRates,
                IsCashlessAvailable = h.IsActive
            })
            .FirstOrDefaultAsync();

        if (hospital == null)
        {
            return NotFound(new { error = "Hospital not found" });
        }

        return Ok(hospital);
    }
}

public class NetworkHospitalResponse
{
    public Guid HospitalId { get; set; }
    public string HospitalName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PinCode { get; set; } = string.Empty;
    public string ContactNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public decimal CashlessLimit { get; set; }
    public decimal ConsultationFee { get; set; }
    public string[] Specializations { get; set; } = Array.Empty<string>();
    public Dictionary<string, decimal> RoomRates { get; set; } = new();
    public bool IsCashlessAvailable { get; set; }
}