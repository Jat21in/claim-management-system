using CMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CMS.Infrastructure.Data.Seed;

public static class PlanSeeder
{
    public static async Task SeedAsync(CmsDbContext context)
    {
        // ✅ Prevent duplicate seeding
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
                isFeatured: false
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
                isFeatured: true
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
                isFeatured: true
            )
        };

        context.Plans.AddRange(plans);
        await context.SaveChangesAsync();
    }
}