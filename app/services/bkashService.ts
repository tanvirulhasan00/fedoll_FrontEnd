import type { BkashSettings } from "~/firebase/paymentSettings";

export interface BkashTokenResponse {
  statusCode: string;
  statusMessage: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
}

export interface BkashCreatePaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  bkashURL: string;
  callbackURL: string;
  amount: string;
  intent: string;
  currency: string;
  paymentCreateTime: string;
  transactionStatus: string;
  merchantInvoiceNumber: string;
}

export interface BkashExecutePaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  trxID?: string;
  transactionStatus?: string;
  amount?: string;
  currency?: string;
  intent?: string;
  paymentExecuteTime?: string;
  merchantInvoiceNumber?: string;
  payerType?: string;
  payerReference?: string;
  customerMsisdn?: string;
}

// In-memory token cache to prevent redundant grant calls during active checkout flows
interface CachedToken {
  token: string;
  expiresAt: number;
}
let tokenCache: Record<string, CachedToken> = {};

/**
 * Get base URL for bKash tokenized API depending on mode.
 */
export const getBkashBaseUrl = (isSandbox: boolean): string => {
  return isSandbox
    ? "https://tokenized.sandbox.bka.sh/v1.2.0-beta"
    : "https://tokenized.pay.bka.sh/v1.2.0-beta";
};

/**
 * Grant a new bKash Bearer ID Token or return cached valid token.
 */
export const grantBkashToken = async (
  config: BkashSettings
): Promise<string> => {
  const cacheKey = `${config.isSandbox ? "sandbox" : "live"}_${config.appKey}`;
  const cached = tokenCache[cacheKey];
  const now = Date.now();

  // If token is still valid for at least 5 more minutes, reuse it
  if (cached && cached.expiresAt > now + 300 * 1000) {
    return cached.token;
  }

  const baseUrl = getBkashBaseUrl(config.isSandbox);
  const url = `${baseUrl}/tokenized/checkout/token/grant`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      username: config.username,
      password: config.password,
    },
    body: JSON.stringify({
      app_key: config.appKey,
      app_secret: config.appSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `bKash token grant HTTP error (${response.status}): ${errorText || response.statusText}`
    );
  }

  const data = (await response.json()) as BkashTokenResponse;

  if (data.statusCode !== "0000" || !data.id_token) {
    throw new Error(
      `bKash token grant failed [${data.statusCode}]: ${data.statusMessage || "Invalid bKash credentials"}`
    );
  }

  // Cache token (expires_in is in seconds, e.g. 3600)
  const expiresInMs = (data.expires_in || 3600) * 1000;
  tokenCache[cacheKey] = {
    token: data.id_token,
    expiresAt: now + expiresInMs,
  };

  return data.id_token;
};

/**
 * Create a new payment session on bKash.
 * Returns the paymentID and bkashURL for customer redirect.
 */
export const createBkashPayment = async (params: {
  config: BkashSettings;
  orderNumber: string;
  amount: number;
  callbackUrl: string;
  payerReference?: string;
}): Promise<BkashCreatePaymentResponse> => {
  const { config, orderNumber, amount, callbackUrl, payerReference } = params;

  if (!config.enabled) {
    throw new Error("bKash payment gateway is currently disabled by store administrator.");
  }

  const idToken = await grantBkashToken(config);
  const baseUrl = getBkashBaseUrl(config.isSandbox);
  const url = `${baseUrl}/tokenized/checkout/create`;

  const payload = {
    mode: "0011",
    payerReference: payerReference || orderNumber,
    callbackURL: callbackUrl,
    amount: amount.toFixed(2),
    currency: "BDT",
    intent: "sale",
    merchantInvoiceNumber: orderNumber,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: idToken,
      "x-app-key": config.appKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `bKash create payment HTTP error (${response.status}): ${errorText || response.statusText}`
    );
  }

  const data = (await response.json()) as BkashCreatePaymentResponse;

  if (data.statusCode !== "0000" || !data.bkashURL) {
    throw new Error(
      `bKash create payment failed [${data.statusCode}]: ${data.statusMessage || "Could not generate bKash checkout link"}`
    );
  }

  return data;
};

/**
 * Execute payment when bKash redirects back with paymentID and status=success.
 * Returns completed transaction information including TrxID.
 */
export const executeBkashPayment = async (params: {
  config: BkashSettings;
  paymentId: string;
}): Promise<BkashExecutePaymentResponse> => {
  const { config, paymentId } = params;

  const idToken = await grantBkashToken(config);
  const baseUrl = getBkashBaseUrl(config.isSandbox);
  const url = `${baseUrl}/tokenized/checkout/execute`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: idToken,
      "x-app-key": config.appKey,
    },
    body: JSON.stringify({
      paymentID: paymentId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `bKash execute payment HTTP error (${response.status}): ${errorText || response.statusText}`
    );
  }

  const data = (await response.json()) as BkashExecutePaymentResponse;

  if (data.statusCode !== "0000" || data.transactionStatus !== "Completed") {
    throw new Error(
      `bKash payment execution failed [${data.statusCode}]: ${data.statusMessage || "Transaction was not completed"}`
    );
  }

  return data;
};

/**
 * Query bKash payment status.
 */
export const queryBkashPayment = async (params: {
  config: BkashSettings;
  paymentId: string;
}): Promise<any> => {
  const { config, paymentId } = params;

  const idToken = await grantBkashToken(config);
  const baseUrl = getBkashBaseUrl(config.isSandbox);
  const url = `${baseUrl}/tokenized/checkout/payment/status`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: idToken,
      "x-app-key": config.appKey,
    },
    body: JSON.stringify({
      paymentID: paymentId,
    }),
  });

  if (!response.ok) {
    throw new Error(`bKash query payment HTTP error (${response.status})`);
  }

  return await response.json();
};

/**
 * Admin: Test connection with bKash API without initiating a customer transaction.
 */
export const testBkashCredentials = async (
  config: BkashSettings
): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    // Clear cache to force a real network check
    const cacheKey = `${config.isSandbox ? "sandbox" : "live"}_${config.appKey}`;
    delete tokenCache[cacheKey];

    const baseUrl = getBkashBaseUrl(config.isSandbox);
    const url = `${baseUrl}/tokenized/checkout/token/grant`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        username: config.username,
        password: config.password,
      },
      body: JSON.stringify({
        app_key: config.appKey,
        app_secret: config.appSecret,
      }),
    });

    const data = (await response.json()) as BkashTokenResponse;

    if (data.statusCode === "0000" && data.id_token) {
      return {
        success: true,
        message: `Successfully connected to bKash ${config.isSandbox ? "Sandbox" : "Live"} API! Token granted.`,
        details: {
          tokenType: data.token_type,
          expiresIn: data.expires_in,
        },
      };
    } else {
      return {
        success: false,
        message: `bKash API rejected credentials [${data.statusCode}]: ${data.statusMessage || "Invalid username, password, app_key, or app_secret."}`,
        details: data,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to reach bKash API server. Please check internet connection.",
    };
  }
};

