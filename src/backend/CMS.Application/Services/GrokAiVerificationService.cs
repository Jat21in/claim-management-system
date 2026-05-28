using System.Text;
using System.Text.Json;
using CMS.Application.DTOs.AI;
using CMS.Application.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CMS.Application.Services;

public sealed class GrokAiVerificationService : IAiVerificationService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GrokAiVerificationService> _logger;
    private readonly string _apiKey;
    private readonly string _baseUrl;
    private readonly string _model;
    private readonly bool _useMock;

    public GrokAiVerificationService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<GrokAiVerificationService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;

        // Read Groq settings (not Grok)
        _apiKey = configuration["AI:ApiKey"] ?? throw new InvalidOperationException("AI API key missing");
        _baseUrl = configuration["AI:BaseUrl"] ?? "https://api.groq.com/openai/v1";
        _model = configuration["AI:Model"] ?? "llama-3.3-70b-versatile";
        _useMock = configuration.GetValue<bool>("AI:UseMockInDevelopment", false);

        // Required headers for Groq
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "CMS-Claim-Verification/1.0");
        _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        _httpClient.Timeout = TimeSpan.FromSeconds(45); // Groq can be slower
    }

    public async Task<AiVerificationResponse> VerifyClaimAsync(
        AiVerificationRequest request,
        CancellationToken cancellationToken)
    {
        // If mock mode is forced in config, use mock
        if (_useMock)
        {
            _logger.LogInformation("🔧 Using MOCK AI (UseMockInDevelopment=true)");
            return GetMockVerificationResponse(request);
        }

        // Otherwise call real Groq API
        try
        {
            _logger.LogInformation("🌐 Calling REAL Groq API for claim {ClaimId}", request.ClaimId);

            var prompt = BuildPrompt(request);
            var groqRequest = new
            {
                model = _model,
                messages = new[]
                {
                    new { role = "system", content = GetSystemPrompt() },
                    new { role = "user", content = prompt }
                },
                temperature = 0.2,   // Lower = more deterministic
                max_tokens = 800,
                response_format = new { type = "json_object" }  // Force JSON output
            };

            var jsonContent = JsonSerializer.Serialize(groqRequest);
            var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);

            var response = await _httpClient.PostAsync(
                $"{_baseUrl}/chat/completions",
                httpContent,
                cancellationToken);

            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Groq API error: {StatusCode} - {Response}", response.StatusCode, responseBody);
                return GetFallbackResponse(request);
            }

            return ParseGroqResponse(responseBody, request);
        }
        catch (TaskCanceledException)
        {
            _logger.LogWarning("Groq API timeout for claim {ClaimId}", request.ClaimId);
            return GetFallbackResponse(request);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Groq API exception for claim {ClaimId}", request.ClaimId);
            return GetFallbackResponse(request);
        }
    }

    private string GetSystemPrompt()
    {
        return @"You are an AI insurance claim verifier. Analyze the claim and return ONLY valid JSON (no extra text) with these fields:
        - confidenceScore (integer 0-100)
        - decision (string: 'Approved', 'Rejected', or 'ManualReview')
        - reasoning (string, explain why)
        - riskFactors (array of strings, empty if none)
        - validationPassed (array of strings, list what checks passed)

        Rules:
        - Auto-approve if confidenceScore > 90
        - Reject if confidenceScore < 30
        - ManualReview otherwise
        - Consider: amount vs coverage, claim date within plan validity, description quality, member claim history, any red flags (fraud keywords, excessive amount).";
    }

    private string BuildPrompt(AiVerificationRequest request)
    {
        return $@"
        CLAIM DETAILS:
        - Claim ID: {request.ClaimId}
        - Amount: ₹{request.ClaimAmount:N2}
        - Date: {request.ClaimDate:yyyy-MM-dd}
        - Description: ""{request.Description}""

        PLAN CONTEXT:
        - Plan Name: {request.PlanContext.PlanName}
        - Coverage Limit: ₹{request.PlanContext.InsuredAmount:N2}
        - Plan Start: {request.PlanContext.StartDate:yyyy-MM-dd}
        - Plan End: {request.PlanContext.EndDate:yyyy-MM-dd}

        MEMBER HISTORY:
        - Total Claims Submitted: {request.MemberHistory.TotalClaimsSubmitted}
        - Previously Approved: {request.MemberHistory.ApprovedClaims}
        - Previously Rejected: {request.MemberHistory.RejectedClaims}
        - Total Claimed Amount: ₹{request.MemberHistory.TotalClaimedAmount:N2}
        - Member Since: {request.MemberHistory.MemberSince:yyyy-MM-dd}

        Analyze this claim and return a JSON response.";
    }

    private AiVerificationResponse ParseGroqResponse(string jsonResponse, AiVerificationRequest request)
    {
        try
        {
            using var doc = JsonDocument.Parse(jsonResponse);
            var content = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            if (string.IsNullOrEmpty(content))
                return GetFallbackResponse(request);

            // Extract JSON if wrapped
            var jsonStart = content.IndexOf('{');
            var jsonEnd = content.LastIndexOf('}');
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                content = content.Substring(jsonStart, jsonEnd - jsonStart + 1);
            }

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var parsed = JsonSerializer.Deserialize<AiVerificationResponse>(content, options);

            if (parsed != null)
            {
                // Ensure required fields
                parsed.VerifiedAt = DateTime.UtcNow;
                parsed.AiModel = _model;
                return parsed;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse Groq response: {Response}", jsonResponse);
        }

        return GetFallbackResponse(request);
    }

    // Keep your existing GetMockVerificationResponse and GetFallbackResponse exactly as they are
    // (I'll include them below for completeness, but you already have them)

    private AiVerificationResponse GetMockVerificationResponse(AiVerificationRequest request)
    {
        _logger.LogInformation("🎯 STRICT MEDICAL AI evaluating claim for ₹{Amount}", request.ClaimAmount);

        if (string.IsNullOrWhiteSpace(request.Description))
        {
            return new AiVerificationResponse
            {
                ConfidenceScore = 0,
                Decision = "Rejected",
                Reasoning = "❌ REJECTED: Description is missing",
                RiskFactors = new List<string> { "Empty or missing description" },
                ValidationPassed = new List<string>(),
                VerifiedAt = DateTime.UtcNow,
                AiModel = "Strict-Medical-AI"
            };
        }

        var description = request.Description.ToLower();

        // ✅ STRICT MEDICAL KEYWORDS (must exist)
        var medicalKeywords = new[]
        {
        "fever","hospital","treatment","doctor","medicine",
        "surgery","infection","diagnosis","consultation",
        "therapy","operation","prescription","clinic",
        "blood test","scan","x-ray","icu","emergency"
    };

        // ❌ NON-MEDICAL BLACKLIST (instant reject)
        var blacklistKeywords = new[]
        {
        "laptop","mobile","gym","supplement","shopping",
        "electronics","travel","vacation","hotel",
        "food","restaurant","bike","car","gaming"
    };

        bool hasMedicalKeyword = medicalKeywords.Any(k => description.Contains(k));
        bool hasBlacklisted = blacklistKeywords.Any(k => description.Contains(k));

        // ✅ HARD REJECTION (non-medical)
        if (hasBlacklisted)
        {
            _logger.LogWarning("🚨 NON-MEDICAL CLAIM DETECTED");

            return new AiVerificationResponse
            {
                ConfidenceScore = 5,
                Decision = "Rejected",
                Reasoning = "❌ REJECTED: Non-medical expense detected",
                RiskFactors = new List<string> { "Irrelevant claim type (non-medical expense)" },
                ValidationPassed = new List<string>(),
                VerifiedAt = DateTime.UtcNow,
                AiModel = "Strict-Medical-AI"
            };
        }

        // ✅ MUST HAVE MEDICAL CONTEXT
        if (!hasMedicalKeyword)
        {
            return new AiVerificationResponse
            {
                ConfidenceScore = 15,
                Decision = "Rejected",
                Reasoning = "❌ REJECTED: No valid medical context found",
                RiskFactors = new List<string> { "Missing medical keywords" },
                ValidationPassed = new List<string>(),
                VerifiedAt = DateTime.UtcNow,
                AiModel = "Strict-Medical-AI"
            };
        }

        // ✅ START LOW (strict scoring)
        double score = 20;
        var passedChecks = new List<string>();
        var risks = new List<string>();

        // ✅ MEDICAL CONTEXT PASSED
        passedChecks.Add("Medical context verified");
        score += 25;

        // ✅ COVERAGE CHECK
        if (request.ClaimAmount <= request.PlanContext.InsuredAmount)
        {
            passedChecks.Add("Amount within coverage");
            score += 20;

            if (request.ClaimAmount <= request.PlanContext.InsuredAmount * 0.3m)
            {
                passedChecks.Add("Amount is reasonable");
                score += 10;
            }
            else
            {
                risks.Add("High claim amount");
                score -= 10;
            }
        }
        else
        {
            risks.Add("Exceeds coverage");
            score -= 40;
        }

        // ✅ VALIDITY CHECK
        if (request.ClaimDate >= request.PlanContext.StartDate &&
            request.ClaimDate <= request.PlanContext.EndDate)
        {
            passedChecks.Add("Within policy validity");
            score += 20;
        }
        else
        {
            risks.Add("Outside policy duration");
            score -= 50;
        }

        // ✅ DESCRIPTION QUALITY
        if (description.Length > 40)
        {
            passedChecks.Add("Detailed description");
            score += 10;
        }
        else
        {
            risks.Add("Weak description");
            score -= 10;
        }

        // ✅ CLAIM HISTORY CHECK
        if (request.MemberHistory.TotalClaimsSubmitted <= 5)
        {
            passedChecks.Add("Normal claim frequency");
            score += 10;
        }
        else
        {
            risks.Add("Too many claims");
            score -= 20;
        }

        // ✅ FINAL CLAMP
        score = Math.Max(0, Math.Min(100, score));

        string decision;
        if (score >= 85)
            decision = "Approved";
        else if (score <= 25)
            decision = "Rejected";
        else
            decision = "ManualReview";

        var reasoning = decision switch
        {
            "Approved" => $"✅ APPROVED: {passedChecks.Count} checks passed. Score: {score:F0}%",
            "Rejected" => $"❌ REJECTED: {string.Join(", ", risks)}. Score: {score:F0}%",
            _ => $"⚠️ MANUAL REVIEW: {passedChecks.Count} passed, {risks.Count} risks. Score: {score:F0}%"
        };

        return new AiVerificationResponse
        {
            ConfidenceScore = Math.Round(score, 2),
            Decision = decision,
            Reasoning = reasoning,
            RiskFactors = risks,
            ValidationPassed = passedChecks,
            VerifiedAt = DateTime.UtcNow,
            AiModel = "Strict-Medical-AI"
        };
    }
    private AiVerificationResponse GetFallbackResponse(AiVerificationRequest request)
    {
        return new AiVerificationResponse
        {
            ConfidenceScore = 50,
            Decision = "ManualReview",
            Reasoning = "AI verification temporarily unavailable. Manual review required.",
            RiskFactors = new List<string> { "AI service unavailable" },
            ValidationPassed = new List<string>(),
            VerifiedAt = DateTime.UtcNow,
            AiModel = "Fallback"
        };
    }
}




