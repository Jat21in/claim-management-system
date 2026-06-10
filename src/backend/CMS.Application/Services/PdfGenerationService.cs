using CMS.Application.Interfaces.Services;
using CMS.Domain.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace CMS.Application.Services;

public sealed class PdfGenerationService : IPdfGenerationService
{
    public PdfGenerationService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<byte[]> GeneratePolicyCertificateAsync(Policy policy, Member member, Plan plan, CancellationToken cancellationToken)
    {
        return await Task.Run(() =>
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontFamily("Arial"));

                    page.Header()
                        .AlignCenter()
                        .Column(col =>
                        {
                            col.Item().Text("CLAIMCORE INSURANCE").FontSize(24).Bold().FontColor(Colors.Blue.Darken2);
                            col.Item().Text("HEALTH INSURANCE POLICY CERTIFICATE").FontSize(16).SemiBold();
                            col.Item().PaddingTop(10).LineHorizontal(1);
                        });

                    page.Content()
                        .Column(col =>
                        {
                            col.Item().PaddingTop(20).Row(row =>
                            {
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Policy Number:").Bold();
                                    inner.Item().Text(policy.PolicyNumber);
                                });
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Issue Date:").Bold();
                                    inner.Item().Text(DateTime.UtcNow.ToString("dd MMM yyyy"));
                                });
                            });

                            col.Item().PaddingTop(15).Row(row =>
                            {
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Insured Name:").Bold();
                                    inner.Item().Text(member.FullName);
                                });
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Date of Birth:").Bold();
                                    inner.Item().Text(member.DateOfBirth.ToString("dd MMM yyyy"));
                                });
                            });

                            col.Item().PaddingTop(15).Row(row =>
                            {
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Plan Name:").Bold();
                                    inner.Item().Text(plan.Name);
                                });
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Coverage Amount:").Bold();
                                    inner.Item().Text($"₹{plan.InsuredAmount:N0}");
                                });
                            });

                            col.Item().PaddingTop(15).Row(row =>
                            {
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Policy Start Date:").Bold();
                                    inner.Item().Text(policy.StartDate.ToString("dd MMM yyyy"));
                                });
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Policy End Date:").Bold();
                                    inner.Item().Text(policy.EndDate.ToString("dd MMM yyyy"));
                                });
                            });

                            col.Item().PaddingTop(15).Row(row =>
                            {
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Annual Premium:").Bold();
                                    inner.Item().Text($"₹{policy.AnnualPremium:N0}");
                                });
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Status:").Bold();
                                    inner.Item().Text(policy.Status.ToString()).FontColor(Colors.Green.Medium);
                                });
                            });

                            if (policy.Dependents.Any())
                            {
                                col.Item().PaddingTop(20).Text("Covered Dependents:").Bold();
                                col.Item().PaddingTop(5).Table(table =>
                                {
                                    table.ColumnsDefinition(columns =>
                                    {
                                        columns.RelativeColumn();
                                        columns.RelativeColumn();
                                        columns.RelativeColumn();
                                    });

                                    table.Header(header =>
                                    {
                                        header.Cell().Text("Name").Bold();
                                        header.Cell().Text("Relationship").Bold();
                                        header.Cell().Text("Date of Birth").Bold();
                                    });

                                    foreach (var dependent in policy.Dependents)
                                    {
                                        table.Cell().Text(dependent.FullName);
                                        table.Cell().Text(dependent.Relationship);
                                        table.Cell().Text(dependent.DateOfBirth.ToString("dd MMM yyyy"));
                                    }
                                });
                            }

                            col.Item().PaddingTop(20).LineHorizontal(0.5f);
                            col.Item().PaddingTop(10).AlignCenter().Text(
                                "This policy is subject to terms and conditions as mentioned in the policy document.\n" +
                                "For claims, please contact our 24x7 customer support."
                            ).FontSize(9).FontColor(Colors.Grey.Darken1);
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(x =>
                        {
                            x.Span("Page ");
                            x.CurrentPageNumber();
                            x.Span(" of ");
                            x.TotalPages();
                        });
                });
            });

            return document.GeneratePdf();
        }, cancellationToken);
    }

    public async Task<byte[]> GeneratePaymentReceiptAsync(PremiumPayment payment, Policy policy, Member member, CancellationToken cancellationToken)
    {
        return await Task.Run(() =>
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontFamily("Arial"));

                    page.Header()
                        .AlignCenter()
                        .Column(col =>
                        {
                            col.Item().Text("CLAIMCORE INSURANCE").FontSize(22).Bold().FontColor(Colors.Blue.Darken2);
                            col.Item().Text("PAYMENT RECEIPT").FontSize(16).SemiBold();
                            col.Item().PaddingTop(10).LineHorizontal(1);
                        });

                    page.Content()
                        .Column(col =>
                        {
                            col.Item().PaddingTop(20).Row(row =>
                            {
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Receipt No:").Bold();
                                    inner.Item().Text(payment.TransactionId ?? payment.PaymentId.ToString().Substring(0, 8));
                                });
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Date:").Bold();
                                    inner.Item().Text(payment.PaymentDate.ToString("dd MMM yyyy HH:mm"));
                                });
                            });

                            col.Item().PaddingTop(15).Row(row =>
                            {
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Received From:").Bold();
                                    inner.Item().Text(member.FullName);
                                    inner.Item().Text(member.Email);
                                });
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Policy Number:").Bold();
                                    inner.Item().Text(policy.PolicyNumber);
                                });
                            });

                            col.Item().PaddingTop(20).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(15)
                                .Column(inner =>
                                {
                                    inner.Item().Row(row =>
                                    {
                                        row.RelativeItem().Text("Description").Bold();
                                        row.RelativeItem().AlignRight().Text("Amount (₹)").Bold();
                                    });

                                    inner.Item().PaddingTop(10).LineHorizontal(0.5f);

                                    inner.Item().Row(row =>
                                    {
                                        row.RelativeItem().Text("Premium Payment");
                                        row.RelativeItem().AlignRight().Text($"₹{payment.Amount:N2}");
                                    });

                                    inner.Item().PaddingTop(20).Row(row =>
                                    {
                                        row.RelativeItem().Text("Total").Bold();
                                        row.RelativeItem().AlignRight().Text($"₹{payment.Amount:N2}").Bold();
                                    });
                                });

                            col.Item().PaddingTop(15).Row(row =>
                            {
                                row.RelativeItem().Text("Payment Method:").Bold();
                                row.RelativeItem().Text(payment.PaymentMethod ?? "N/A");
                            });

                            col.Item().PaddingTop(15).Row(row =>
                            {
                                row.RelativeItem().Text("Transaction ID:").Bold();
                                row.RelativeItem().Text(payment.TransactionId ?? "N/A");
                            });

                            col.Item().PaddingTop(20).LineHorizontal(0.5f);
                            col.Item().PaddingTop(10).AlignCenter().Text(
                                "Thank you for your payment. This is a system-generated receipt."
                            ).FontSize(9).FontColor(Colors.Grey.Darken1);
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(x =>
                        {
                            x.Span("Page ");
                            x.CurrentPageNumber();
                            x.Span(" of ");
                            x.TotalPages();
                        });
                });
            });

            return document.GeneratePdf();
        }, cancellationToken);
    }

    public async Task<byte[]> GenerateClaimSettlementLetterAsync(Claim claim, Member member, Policy policy, CancellationToken cancellationToken)
    {
        return await Task.Run(() =>
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontFamily("Arial"));

                    page.Header()
                        .AlignCenter()
                        .Column(col =>
                        {
                            col.Item().Text("CLAIMCORE INSURANCE").FontSize(22).Bold().FontColor(Colors.Blue.Darken2);
                            col.Item().Text("CLAIM SETTLEMENT LETTER").FontSize(16).SemiBold();
                            col.Item().PaddingTop(10).LineHorizontal(1);
                        });

                    page.Content()
                        .Column(col =>
                        {
                            col.Item().PaddingTop(20).Row(row =>
                            {
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Claim Number:").Bold();
                                    inner.Item().Text(claim.ClaimId.ToString().Substring(0, 8).ToUpper());
                                });
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Settlement Date:").Bold();
                                    inner.Item().Text(DateTime.UtcNow.ToString("dd MMM yyyy"));
                                });
                            });

                            col.Item().PaddingTop(15).Row(row =>
                            {
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Claimant Name:").Bold();
                                    inner.Item().Text(member.FullName);
                                });
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Policy Number:").Bold();
                                    inner.Item().Text(policy.PolicyNumber);
                                });
                            });

                            col.Item().PaddingTop(15).Text("Dear Policyholder,").FontSize(11);

                            col.Item().PaddingTop(10).Text(
                                $"We are pleased to inform you that your claim has been approved and settled. " +
                                $"The details of the settlement are as follows:"
                            ).FontSize(11);

                            col.Item().PaddingTop(15).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(15)
                                .Column(inner =>
                                {
                                    inner.Item().Row(row =>
                                    {
                                        row.RelativeItem().Text("Claim Date:").Bold();
                                        row.RelativeItem().Text(claim.ClaimDate.ToString("dd MMM yyyy"));
                                    });

                                    inner.Item().PaddingTop(8).Row(row =>
                                    {
                                        row.RelativeItem().Text("Claim Amount:").Bold();
                                        row.RelativeItem().Text($"₹{claim.ClaimAmount.Amount:N2}");
                                    });

                                    inner.Item().PaddingTop(8).Row(row =>
                                    {
                                        row.RelativeItem().Text("Settled Amount:").Bold();
                                        row.RelativeItem().Text($"₹{claim.ClaimAmount.Amount:N2}").FontColor(Colors.Green.Medium);
                                    });

                                    inner.Item().PaddingTop(8).Row(row =>
                                    {
                                        row.RelativeItem().Text("Payment Mode:").Bold();
                                        row.RelativeItem().Text(claim.PaymentMode ?? "NEFT");
                                    });

                                    inner.Item().PaddingTop(8).Row(row =>
                                    {
                                        row.RelativeItem().Text("Reference Number:").Bold();
                                        row.RelativeItem().Text(claim.PaymentReferenceNumber ?? "N/A");
                                    });

                                    if (!string.IsNullOrEmpty(claim.Description))
                                    {
                                        inner.Item().PaddingTop(8).Row(row =>
                                        {
                                            row.RelativeItem().Text("Description:").Bold();
                                            row.RelativeItem().Text(claim.Description);
                                        });
                                    }
                                });

                            col.Item().PaddingTop(15).Text(
                                "The settled amount has been credited to your registered bank account. " +
                                "It will reflect within 2-3 business days."
                            ).FontSize(11);

                            col.Item().PaddingTop(20).LineHorizontal(0.5f);
                            col.Item().PaddingTop(10).AlignCenter().Text(
                                "This is a computer-generated document and does not require a signature."
                            ).FontSize(9).FontColor(Colors.Grey.Darken1);
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(x =>
                        {
                            x.Span("Page ");
                            x.CurrentPageNumber();
                            x.Span(" of ");
                            x.TotalPages();
                        });
                });
            });

            return document.GeneratePdf();
        }, cancellationToken);
    }

    public async Task<byte[]> GenerateGstInvoiceAsync(PremiumPayment payment, Policy policy, Member member, CancellationToken cancellationToken)
    {
        const decimal GST_RATE = 0.18m;
        decimal gstAmount = payment.Amount * GST_RATE / (1 + GST_RATE);
        decimal taxableValue = payment.Amount - gstAmount;

        return await Task.Run(() =>
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontFamily("Arial"));

                    page.Header()
                        .AlignCenter()
                        .Column(col =>
                        {
                            col.Item().Text("TAX INVOICE").FontSize(24).Bold().FontColor(Colors.Blue.Darken2);
                            col.Item().Text("ClaimCore Insurance Services").FontSize(14);
                            col.Item().Text("GSTIN: 27AAACC1234E1Z5").FontSize(10).FontColor(Colors.Grey.Darken1);
                            col.Item().PaddingTop(10).LineHorizontal(1);
                        });

                    page.Content()
                        .Column(col =>
                        {
                            col.Item().PaddingTop(15).Row(row =>
                            {
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Invoice No:").Bold();
                                    inner.Item().Text($"INV-{DateTime.Now:yyyyMMdd}-{payment.PaymentId.ToString().Substring(0, 6)}");
                                });
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Invoice Date:").Bold();
                                    inner.Item().Text(payment.PaymentDate.ToString("dd MMM yyyy"));
                                });
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("GSTIN:").Bold();
                                    inner.Item().Text("27AAACC1234E1Z5");
                                });
                            });

                            col.Item().PaddingTop(15).Row(row =>
                            {
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Billed To:").Bold();
                                    inner.Item().Text(member.FullName);
                                    inner.Item().Text(member.Email);
                                    if (member.Address != null)
                                    {
                                        inner.Item().Text($"{member.Address.Street}, {member.Address.City}");
                                        inner.Item().Text($"{member.Address.State} - {member.Address.PostalCode}");
                                    }
                                });
                                row.RelativeItem().Column(inner =>
                                {
                                    inner.Item().Text("Policy Number:").Bold();
                                    inner.Item().Text(policy.PolicyNumber);
                                });
                            });

                            col.Item().PaddingTop(20).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(15)
                                .Column(inner =>
                                {
                                    inner.Item().Row(row =>
                                    {
                                        row.RelativeItem(3).Text("Description").Bold();
                                        row.RelativeItem(2).AlignRight().Text("Amount (₹)").Bold();
                                    });

                                    inner.Item().PaddingTop(10).LineHorizontal(0.5f);

                                    inner.Item().Row(row =>
                                    {
                                        row.RelativeItem(3).Text("Insurance Premium - Health Policy");
                                        row.RelativeItem(2).AlignRight().Text($"₹{taxableValue:N2}");
                                    });

                                    inner.Item().PaddingTop(15).LineHorizontal(0.5f);

                                    inner.Item().Row(row =>
                                    {
                                        row.RelativeItem(3).Text("Subtotal").Bold();
                                        row.RelativeItem(2).AlignRight().Text($"₹{taxableValue:N2}").Bold();
                                    });

                                    inner.Item().Row(row =>
                                    {
                                        row.RelativeItem(3).Text("CGST (9%)");
                                        row.RelativeItem(2).AlignRight().Text($"₹{gstAmount / 2:N2}");
                                    });

                                    inner.Item().Row(row =>
                                    {
                                        row.RelativeItem(3).Text("SGST (9%)");
                                        row.RelativeItem(2).AlignRight().Text($"₹{gstAmount / 2:N2}");
                                    });

                                    inner.Item().PaddingTop(10).LineHorizontal(0.5f);

                                    inner.Item().Row(row =>
                                    {
                                        row.RelativeItem(3).Text("Total").Bold().FontColor(Colors.Blue.Darken2);
                                        row.RelativeItem(2).AlignRight().Text($"₹{payment.Amount:N2}").Bold().FontColor(Colors.Blue.Darken2);
                                    });
                                });

                            col.Item().PaddingTop(15).Row(row =>
                            {
                                row.RelativeItem().Text("Amount in words:").Bold();
                                row.RelativeItem().Text(NumberToWords((long)payment.Amount));
                            });

                            col.Item().PaddingTop(20).LineHorizontal(0.5f);
                            col.Item().PaddingTop(10).AlignCenter().Text(
                                "This is a computer-generated invoice and does not require a physical signature.\n" +
                                "Terms: Payment due within 15 days"
                            ).FontSize(9).FontColor(Colors.Grey.Darken1);
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(x =>
                        {
                            x.Span("Page ");
                            x.CurrentPageNumber();
                            x.Span(" of ");
                            x.TotalPages();
                        });
                });
            });

            return document.GeneratePdf();
        }, cancellationToken);
    }

    private string NumberToWords(long number)
    {
        if (number == 0) return "Zero";
        var words = "";
        if (number / 10000000 > 0)
        {
            words += NumberToWords(number / 10000000) + " Crore ";
            number %= 10000000;
        }
        if (number / 100000 > 0)
        {
            words += NumberToWords(number / 100000) + " Lakh ";
            number %= 100000;
        }
        if (number / 1000 > 0)
        {
            words += NumberToWords(number / 1000) + " Thousand ";
            number %= 1000;
        }
        if (number / 100 > 0)
        {
            words += NumberToWords(number / 100) + " Hundred ";
            number %= 100;
        }
        if (number > 0)
        {
            var units = new[] { "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen" };
            var tens = new[] { "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety" };
            if (number < 20) words += units[number];
            else
            {
                words += tens[number / 10];
                if (number % 10 > 0) words += "-" + units[number % 10];
            }
        }
        return words.Trim() + " Rupees Only";
    }
}