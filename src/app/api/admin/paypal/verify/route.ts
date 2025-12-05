import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

const PLAN_IDS: Record<string, string> = {
  BASIC: process.env.PAYPAL_PLAN_BASIC || "",
  PLUS: process.env.PAYPAL_PLAN_PLUS || "",
  PREMIUM: process.env.PAYPAL_PLAN_PREMIUM || "",
};

export async function GET() {
  const session = await auth();

  if (!session?.user || (session.user.role ?? 0) < ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paypalMode = process.env.PAYPAL_MODE || "sandbox";
  const baseUrl = paypalMode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

  const results: Record<string, any> = {
    mode: paypalMode,
    apiUrl: baseUrl,
    clientIdSet: !!process.env.PAYPAL_CLIENT_ID,
    secretSet: !!process.env.PAYPAL_CLIENT_SECRET,
    publicClientIdSet: !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    plans: {},
  };

  // Get access token
  try {
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    const authData = await authResponse.json();

    if (!authData.access_token) {
      results.authError = "Failed to get access token";
      results.authDetails = authData;
      return NextResponse.json(results);
    }

    results.authenticated = true;

    // Check each plan
    for (const [tier, planId] of Object.entries(PLAN_IDS)) {
      if (!planId) {
        results.plans[tier] = { configured: false, error: "Plan ID not set in environment" };
        continue;
      }

      try {
        const planResponse = await fetch(
          `${baseUrl}/v1/billing/plans/${planId}`,
          {
            headers: {
              Authorization: `Bearer ${authData.access_token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const planData = await planResponse.json();

        if (planResponse.ok) {
          results.plans[tier] = {
            configured: true,
            planId,
            exists: true,
            name: planData.name,
            status: planData.status,
            description: planData.description,
          };
        } else {
          results.plans[tier] = {
            configured: true,
            planId,
            exists: false,
            error: planData.message || "Plan not found",
            details: planData.details,
          };
        }
      } catch (err: any) {
        results.plans[tier] = {
          configured: true,
          planId,
          exists: false,
          error: err.message,
        };
      }
    }
  } catch (err: any) {
    results.authError = err.message;
  }

  return NextResponse.json(results);
}

