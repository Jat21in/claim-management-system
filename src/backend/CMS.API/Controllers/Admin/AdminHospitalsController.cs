using CMS.API.Attributes;
using CMS.Domain.Entities;
using CMS.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CMS.API.Controllers.Admin;

[AuthorizeAdmin]
[ApiController]
[Route("api/admin/hospitals")]
public sealed class AdminHospitalsController : ControllerBase
{
    private readonly CmsDbContext _dbContext;

    public AdminHospitalsController(CmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllHospitals()
    {
        var hospitals = await _dbContext.NetworkHospitals
            .OrderByDescending(h => h.IsActive)
            .ThenBy(h => h.HospitalName)
            .ToListAsync(HttpContext.RequestAborted);

        return Ok(hospitals.Select(h => new
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
            h.EmpanelmentDate,
            h.EmpanelmentEndDate,
            h.CashlessLimit,
            h.IsActive,
            Specializations = h.Specializations,
            h.ConsultationFee,
            RoomRates = h.RoomRates
        }));
    }

    [HttpGet("{hospitalId:guid}")]
    public async Task<IActionResult> GetHospitalById(Guid hospitalId)
    {
        var hospital = await _dbContext.NetworkHospitals
            .FirstOrDefaultAsync(h => h.HospitalId == hospitalId, HttpContext.RequestAborted);

        if (hospital == null)
            return NotFound(new { error = "Hospital not found" });

        return Ok(new
        {
            hospital.HospitalId,
            hospital.HospitalName,
            hospital.RegistrationNumber,
            hospital.Address,
            hospital.City,
            hospital.State,
            hospital.PinCode,
            hospital.ContactNumber,
            hospital.Email,
            hospital.EmpanelmentDate,
            hospital.EmpanelmentEndDate,
            hospital.CashlessLimit,
            hospital.IsActive,
            Specializations = hospital.Specializations,
            hospital.ConsultationFee,
            RoomRates = hospital.RoomRates
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateHospital([FromBody] CreateHospitalRequest request)
    {
        var hospital = new NetworkHospital(
            hospitalName: request.HospitalName,
            registrationNumber: request.RegistrationNumber,
            address: request.Address,
            city: request.City,
            state: request.State,
            pinCode: request.PinCode,
            cashlessLimit: request.CashlessLimit);

        // Set additional properties
        hospital.UpdateContact(request.ContactNumber, request.Email);
        hospital.UpdateConsultationFee(request.ConsultationFee);
        hospital.SetSpecializations(request.Specializations);
        hospital.SetRoomRates(request.RoomRates);

        _dbContext.NetworkHospitals.Add(hospital);
        await _dbContext.SaveChangesAsync(HttpContext.RequestAborted);

        return Ok(new { message = "Hospital created successfully", hospitalId = hospital.HospitalId });
    }

    [HttpPut("{hospitalId:guid}")]
    public async Task<IActionResult> UpdateHospital(Guid hospitalId, [FromBody] UpdateHospitalRequest request)
    {
        var hospital = await _dbContext.NetworkHospitals
            .FirstOrDefaultAsync(h => h.HospitalId == hospitalId, HttpContext.RequestAborted);

        if (hospital == null)
            return NotFound(new { error = "Hospital not found" });

        hospital.UpdateDetails(
            hospitalName: request.HospitalName,
            registrationNumber: request.RegistrationNumber,
            address: request.Address,
            city: request.City,
            state: request.State,
            pinCode: request.PinCode,
            cashlessLimit: request.CashlessLimit);

        hospital.UpdateContact(request.ContactNumber, request.Email);
        hospital.UpdateConsultationFee(request.ConsultationFee);
        hospital.SetSpecializations(request.Specializations);
        hospital.SetRoomRates(request.RoomRates);

        await _dbContext.SaveChangesAsync(HttpContext.RequestAborted);

        return Ok(new { message = "Hospital updated successfully" });
    }

    [HttpDelete("{hospitalId:guid}")]
    public async Task<IActionResult> DeleteHospital(Guid hospitalId)
    {
        var hospital = await _dbContext.NetworkHospitals
            .FirstOrDefaultAsync(h => h.HospitalId == hospitalId, HttpContext.RequestAborted);

        if (hospital == null)
            return NotFound(new { error = "Hospital not found" });

        hospital.Deactivate();
        await _dbContext.SaveChangesAsync(HttpContext.RequestAborted);

        return Ok(new { message = "Hospital deactivated successfully" });
    }
}

public class CreateHospitalRequest
{
    public string HospitalName { get; set; } = string.Empty;
    public string RegistrationNumber { get; set; } = string.Empty;
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
}

public class UpdateHospitalRequest : CreateHospitalRequest { }