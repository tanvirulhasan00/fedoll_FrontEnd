import type { ActionFunctionArgs } from "react-router";
import { testBkashCredentials } from "~/services/bkashService";
import type { BkashSettings } from "~/firebase/paymentSettings";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json(
      { error: "Method not allowed. Use POST." },
      { status: 405 }
    );
  }

  try {
    const body = await request.json();
    const config = body?.config as BkashSettings;

    if (!config) {
      return Response.json(
        { error: "Please provide bKash configuration to test." },
        { status: 400 }
      );
    }

    if (!config.appKey || !config.appSecret || !config.username || !config.password) {
      return Response.json(
        {
          success: false,
          message: "Please fill in all 4 bKash credential fields: App Key, App Secret, Username, and Password.",
        },
        { status: 400 }
      );
    }

    const result = await testBkashCredentials(config);
    return Response.json(result);
  } catch (error: any) {
    console.error("bKash test-connection API error:", error);
    return Response.json(
      {
        success: false,
        message: error?.message || "Internal server error while testing bKash credentials.",
      },
      { status: 500 }
    );
  }
}

