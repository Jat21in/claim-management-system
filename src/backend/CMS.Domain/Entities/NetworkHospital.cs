namespace CMS.Domain.Entities;

public sealed class NetworkHospital
{
    public Guid HospitalId { get; private set; }
    public string HospitalName { get; private set; } = null!;
    public string RegistrationNumber { get; private set; } = null!;
    public string Address { get; private set; } = null!;
    public string City { get; private set; } = null!;
    public string State { get; private set; } = null!;
    public string PinCode { get; private set; } = null!;
    public string ContactNumber { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public DateTime EmpanelmentDate { get; private set; }
    public DateTime? EmpanelmentEndDate { get; private set; }
    public decimal CashlessLimit { get; private set; }
    public bool IsActive { get; private set; }
    public string[] Specializations { get; private set; } = Array.Empty<string>();
    public decimal ConsultationFee { get; private set; }
    public Dictionary<string, decimal> RoomRates { get; private set; } = new();

    private NetworkHospital() { }

    public NetworkHospital(
        string hospitalName,
        string registrationNumber,
        string address,
        string city,
        string state,
        string pinCode,
        decimal cashlessLimit)
    {
        HospitalId = Guid.NewGuid();
        HospitalName = hospitalName;
        RegistrationNumber = registrationNumber;
        Address = address;
        City = city;
        State = state;
        PinCode = pinCode;
        EmpanelmentDate = DateTime.UtcNow;
        CashlessLimit = cashlessLimit;
        IsActive = true;
    }
}
