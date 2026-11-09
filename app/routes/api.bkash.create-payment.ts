import type { ActionFunctionArgs } from "react-router";
import { fetchPaymentSettings } from "~/firebase/paymentSettings";
import { createBkashPayment } from "~/services/bkashService";
import { updateOrderBkashPaymentId, getOrderById } from "~/firebase/orders";
import { recordBkashPaymentInitiated } from "~/firebase/payments";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json(
      { error: "Method not allowed. Use POST." },
      { status: 405 }
    );
  }

  try {
    const body = await request.json();
    const { orderId, orderNumber, amount, payerReference } = body || {};

    if (!orderId || !orderNumber || !amount) {
      return Response.json(
        { error: "Missing required fields: orderId, orderNumber, or amount." },
        { status: 400 }
      );
    }

    // 1. Fetch current live payment settings from Firestore
    const settings = await fetchPaymentSettings();
    const bkashConfig = settings.bkash;

    if (!bkashConfig.enabled) {
      return Response.json(
        { error: "bKash payment gateway is currently disabled by store administrator." },
        { status: 400 }
      );
    }

    if (!bkashConfig.appKey || !bkashConfig.appSecret || !bkashConfig.username || !bkashConfig.password) {
      return Response.json(
        { error: "bKash credentials are not configured in Store Admin Payment Settings." },
        { status: 500 }
      );
    }

    // 2. Build full callback URL pointing to /api/bkash/callback
    const origin = new URL(request.url).origin;
    const callbackUrl = `${origin}/api/bkash/callback?orderId=${encodeURIComponent(orderId)}`;

    // 3. Call bKash Create Payment
    const parsedAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    const bkashRes = await createBkashPayment({
      config: bkashConfig,
      orderNumber,
      amount: parsedAmount,
      callbackUrl,
      payerReference: payerReference || orderNumber,
    });

    // 4. Link paymentID to order in Firestore & record in payments collection
    if (bkashRes.paymentID) {
      await updateOrderBkashPaymentId(orderId, bkashRes.paymentID);
      const order = await getOrderById(orderId);
      if (order) {
        await recordBkashPaymentInitiated(order, bkashRes.paymentID, bkashConfig.isSandbox);
      }
    }

    return Response.json({
      success: true,
      paymentID: bkashRes.paymentID,
      bkashURL: bkashRes.bkashURL,
      isSandbox: bkashConfig.isSandbox,
    });
  } catch (error: any) {
    console.error("bKash create-payment API error:", error);
    return Response.json(
      {
        error:
          error?.message ||
          "Failed to initiate bKash payment session. Please check credentials or try Cash on Delivery.",
      },
      { status: 500 }
    );
  }
}

