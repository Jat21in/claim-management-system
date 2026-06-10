using CMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace CMS.Infrastructure.Data.Seed;

public static class PlanSeeder
{
    public static async Task SeedAsync(CmsDbContext context)
    {
        // Prevent duplicate seeding
        if (await context.Plans.AnyAsync())
            return;

        var plans = new List<Plan>
        {
            new Plan(
                code: "BASIC",
                name: "Essential Care Plan",
                description:
                    "A cost‑effective healthcare plan designed for individuals seeking reliable medical coverage for essential needs with trusted provider access.",
                insuredAmount: 300000m,
                durationInMonths: 12,
                featuresJson: """
                [
                  "Outpatient Doctor Consultations",
                  "Standard Hospitalization Coverage",
                  "Diagnostic Tests (Basic)",
                  "Cashless Claims at Network Hospitals",
                  "Email & Ticket-Based Support"
                ]
                """,
                isFeatured: false,
                basePremiumAnnual: 25000m,  // Fixed: Was 1500m
                dependentLoadingPercentage: 15m,
                maxDependentsAllowed: 2,
                maxNomineesAllowed: 2,
                requiredKycDocumentsJson: JsonSerializer.Serialize(new[] { "Aadhaar", "PAN" })
            ),

            new Plan(
                code: "PREMIUM",
                name: "Advanced Care Plus Plan",
                description:
                    "A comprehensive healthcare solution offering enhanced coverage, elevated claim limits, and priority services for professionals and families.",
                insuredAmount: 750000m,
                durationInMonths: 24,
                featuresJson: """
                [
                  "Unlimited Doctor Consultations",
                  "Inpatient & Day-Care Hospitalization",
                  "Prescription Medicines Coverage",
                  "Emergency Medical Care",
                  "Annual Health Check-ups",
                  "Priority Claims & Customer Support"
                ]
                """,
                isFeatured: true,
                basePremiumAnnual: 65000m,  // Fixed: Was 3750m
                dependentLoadingPercentage: 25m,
                maxDependentsAllowed: 5,
                maxNomineesAllowed: 4,
                requiredKycDocumentsJson: JsonSerializer.Serialize(new[] { "Aadhaar", "PAN", "PassportPhoto" })
            ),

            new Plan(
                code: "FAMILY",
                name: "Elite Family Protection Plan",
                description:
                    "An all‑inclusive, enterprise‑grade family healthcare plan delivering maximum protection, superior benefits, and long‑term medical security for your loved ones.",
                insuredAmount: 1000000m,
                durationInMonths: 24,
                featuresJson: """
                [
                  "Complete Family Coverage (Spouse, Children, Dependents)",
                  "High-Value Hospitalization & ICU Cover",
                  "Maternity & Newborn Care",
                  "Child Vaccinations & Pediatric Care",
                  "Specialist & Preventive Consultations",
                  "24x7 Dedicated Health Assistance",
                  "Fast-Track Claims Settlement"
                ]
                """,
                isFeatured: true,
                basePremiumAnnual: 85000m,  // Fixed: Was 5000m
                dependentLoadingPercentage: 20m,
                maxDependentsAllowed: 6,
                maxNomineesAllowed: 5,
                requiredKycDocumentsJson: JsonSerializer.Serialize(new[] { "Aadhaar", "PAN", "PassportPhoto" })
            ),

            // ✅ Add Health Pro Plus plan (missing from seeder)
            new Plan(
                code: "HEALTH_PRO_2026",
                name: "Health Pro Plus",
                description: "Comprehensive health coverage with maternity and OPD benefits",
                insuredAmount: 500000m,
                durationInMonths: 12,
                featuresJson: """
                [
                  "Unlimited Doctor Consultations",
                  "Maternity Coverage",
                  "Preventive Health Checkups",
                  "No Claim Bonus"
                ]
                """,
                isFeatured: true,
                basePremiumAnnual: 45000m,
                dependentLoadingPercentage: 25m,
                maxDependentsAllowed: 4,
                maxNomineesAllowed: 3,
                requiredKycDocumentsJson: JsonSerializer.Serialize(new[] { "Aadhaar", "PAN", "PassportPhoto" })
            )
        };

        context.Plans.AddRange(plans);
        await context.SaveChangesAsync();
    }
}