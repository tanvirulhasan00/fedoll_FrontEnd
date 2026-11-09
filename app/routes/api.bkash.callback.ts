import { redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { fetchPaymentSettings } from "~/firebase/paymentSettings";
import { executeBkashPayment } from "~/services/bkashService";
import {
  findOrderByPaymentId,
  getOrderById,
  updateOrderPaymentSuccess,
  updateOrderPaymentFailed,
} from "~/firebase/orders";
import {
  recordBkashPaymentSuccess,
  recordBkashPaymentFailed,
  normalizePaymentDate,
} from "~/firebase/payments";

async function handleBkashCallback(request: Request) {
  const url = new URL(request.url);
  const paymentID = url.searchParams.get("paymentID") || "";
  const status = (url.searchParams.get("status") || "").toLowerCase();
  const orderIdParam = url.searchParams.get("orderId") || "";

  // 1. Resolve order
  let order = orderIdParam ? await getOrderById(orderIdParam) : null;
  if (!order && paymentID) {
    order = await findOrderByPaymentId(paymentID);
  }

  const resolvedOrderId = order?.id || orderIdParam;

  // 2. Handle Cancelled or Failed status
  if (status === "cancel" || status === "cancelled") {
    const cancelMsg = "Customer cancelled the bKash payment window before completing.";
    if (resolvedOrderId) {
      await updateOrderPaymentFailed(resolvedOrderId, cancelMsg);
    }
    if (order) {
      await recordBkashPaymentFailed(order, paymentID, cancelMsg, true);
    }
    return redirect(`/checkout?paymentStatus=cancelled&orderId=${encodeURIComponent(resolvedOrderId)}`);
  }

  if (status === "failure" || status === "failed") {
    const failMsg = "bKash transaction declined or failed (e.g. insufficient funds or incorrect OTP/PIN).";
    if (resolvedOrderId) {
      await updateOrderPaymentFailed(resolvedOrderId, failMsg);
    }
    if (order) {
      await recordBkashPaymentFailed(order, paymentID, failMsg, false);
    }
    return redirect(`/checkout?paymentStatus=failed&orderId=${encodeURIComponent(resolvedOrderId)}`);
  }

  // 3. Handle Success status: Execute Payment
  if (status === "success" && paymentID) {
    try {
      const settings = await fetchPaymentSettings();
      const bkashConfig = settings.bkash;

      const executeRes = await executeBkashPayment({
        config: bkashConfig,
        paymentId: paymentID,
      });

      if (executeRes.statusCode === "0000" && executeRes.trxID) {
        const paymentDetailsPayload = {
          gateway: "bkash" as const,
          paymentId: executeRes.paymentID || paymentID,
          trxID: executeRes.trxID,
          transactionStatus: executeRes.transactionStatus || "Completed",
          amount: executeRes.amount ? parseFloat(executeRes.amount) : undefined,
          currency: executeRes.currency || "BDT",
          customerMsisdn: executeRes.customerMsisdn,
          paymentExecuteTime: normalizePaymentDate(executeRes.paymentExecuteTime),
          merchantInvoiceNumber: executeRes.merchantInvoiceNumber || order?.orderNumber,
          isSandbox: bkashConfig.isSandbox,
        };

        if (resolvedOrderId) {
          const updatedOrder = await updateOrderPaymentSuccess(resolvedOrderId, paymentDetailsPayload);
          if (updatedOrder) {
            await recordBkashPaymentSuccess(updatedOrder, paymentDetailsPayload);
          } else if (order) {
            await recordBkashPaymentSuccess(order, paymentDetailsPayload);
          }
        }

        return redirect(
          `/checkout?orderId=${encodeURIComponent(resolvedOrderId)}&paymentStatus=success&trxID=${encodeURIComponent(executeRes.trxID)}`
        );
      } else {
        const errorMsg = executeRes.statusMessage || "bKash transaction was not completed.";
        if (resolvedOrderId) {
          await updateOrderPaymentFailed(resolvedOrderId, errorMsg);
        }
        if (order) {
          await recordBkashPaymentFailed(order, paymentID, errorMsg, false);
        }
        return redirect(
          `/checkout?paymentStatus=failed&orderId=${encodeURIComponent(resolvedOrderId)}&reason=${encodeURIComponent(errorMsg)}`
        );
      }
    } catch (err: any) {
      console.error("Error executing bKash payment callback:", err);
      const errMsg = err?.message || "Execution exception occurred.";
      if (resolvedOrderId) {
        await updateOrderPaymentFailed(resolvedOrderId, errMsg);
      }
      if (order) {
        await recordBkashPaymentFailed(order, paymentID, errMsg, false);
      }
      return redirect(
        `/checkout?paymentStatus=failed&orderId=${encodeURIComponent(resolvedOrderId)}&reason=${encodeURIComponent(errMsg)}`
      );
    }
  }

  // Fallback if status unrecognized
  return redirect(`/checkout?paymentStatus=unknown&orderId=${encodeURIComponent(resolvedOrderId)}`);
}

export async function loader({ request }: LoaderFunctionArgs) {
  return handleBkashCallback(request);
}

export async function action({ request }: ActionFunctionArgs) {
  return handleBkashCallback(request);
}

