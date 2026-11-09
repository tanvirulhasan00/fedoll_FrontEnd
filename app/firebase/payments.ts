import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase.config";
import { sanitizeForFirestore } from "./firestore";
import type { Order, BkashPaymentDetails } from "./orders";

export type PaymentGatewayType = "bkash" | "cod" | "card" | "nagad" | "other";
export type PaymentRecordStatus = "COMPLETED" | "PENDING" | "FAILED" | "CANCELLED";

export interface PaymentCustomerDetails {
  name: string;
  phone: string;
  email: string;
  customerMsisdn?: string; // Paying bKash wallet number
  streetAddress?: string;
  city?: string;
  district?: string;
  notes?: string;
  userId?: string;
}

export interface PaymentRecord {
  id: string; // Firestore document ID
  paymentId?: string; // Gateway payment ID, e.g. bKash paymentID
  trxId?: string; // Gateway transaction ID, e.g. bKash trxID
  orderId: string; // Firestore order document ID
  orderNumber: string; // e.g. "FD-20261109-1234"
  gateway: PaymentGatewayType; // "bkash" | "cod"
  methodTitle: string; // "bKash Online Payment" | "Cash on Delivery"
  amount: number;
  currency: string; // "BDT"
  status: PaymentRecordStatus; // "COMPLETED" | "PENDING" | "FAILED" | "CANCELLED"
  isSandbox: boolean;
  customer: PaymentCustomerDetails;
  itemsCount?: number;
  paymentExecuteTime?: string;
  failureReason?: string;
  merchantInvoiceNumber?: string;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  rawResponse?: Record<string, any>;
}

/**
 * Safely parses any date representation (bKash colon millisecond format, Firestore Timestamp, ISO string, Unix ms)
 */
export const parsePaymentDate = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;

  // Firestore Timestamp with toDate()
  if (typeof val === "object" && typeof val.toDate === "function") {
    try {
      const d = val.toDate();
      if (!isNaN(d.getTime())) return d;
    } catch {}
  }

  // Firestore Timestamp object: { seconds, nanoseconds } or { _seconds }
  if (typeof val === "object" && ("seconds" in val || "_seconds" in val)) {
    const s = val.seconds ?? val._seconds;
    if (typeof s === "number") {
      const d = new Date(s * 1000);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Unix timestamp (milliseconds)
  if (typeof val === "number" && !isNaN(val)) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }

  // String formats
  if (typeof val === "string") {
    let s = val.trim();
    if (!s) return null;

    // 1. Direct standard parse
    let d = new Date(s);
    if (!isNaN(d.getTime())) return d;

    // 2. bKash PGW format: "2026-11-09T22:45:00:000 GMT+0600"
    // Fix colon before milliseconds: "22:45:00:000" -> "22:45:00.000"
    s = s.replace(/(\d{2}:\d{2}:\d{2}):(\d{3})/, "$1.$2");

    // Fix GMT offset: " GMT+0600" -> "+06:00"
    s = s.replace(/\s*GMT([+-]\d{2})(\d{2})?/, (_, signHour, min) => `${signHour}:${min || "00"}`);

    d = new Date(s);
    if (!isNaN(d.getTime())) return d;

    // 3. Compact format: YYYYMMDDHHmmss -> "20261109224500"
    if (/^\d{14}$/.test(s)) {
      const yr = s.substring(0, 4);
      const mo = s.substring(4, 6);
      const dy = s.substring(6, 8);
      const hr = s.substring(8, 10);
      const mi = s.substring(10, 12);
      const se = s.substring(12, 14);
      d = new Date(`${yr}-${mo}-${dy}T${hr}:${mi}:${se}`);
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
};

/**
 * Normalizes paymentExecuteTime into standard ISO 8601 string
 */
export const normalizePaymentDate = (val: any): string => {
  const d = parsePaymentDate(val);
  return d ? d.toISOString() : new Date().toISOString();
};

/**
 * Formats payment timestamps into clean human-readable date & time strings
 */
export const formatPaymentTimestamp = (val: any, fallback = "Just now"): string => {
  const d = parsePaymentDate(val);
  if (!d) return fallback;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};


const LOCAL_PAYMENTS_KEY = "fedoll_payments_ledger_v1";

const getLocalPayments = (): PaymentRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_PAYMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalPayment = (record: PaymentRecord) => {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalPayments();
    const updated = [record, ...existing.filter((p) => p.id !== record.id && p.orderId !== record.orderId)];
    localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to cache payment locally:", err);
  }
};

/**
 * Fetch all payments from the Firestore 'payments' table, ordered by creation date
 */
export const fetchPaymentsFromFirestore = async (): Promise<PaymentRecord[]> => {
  const localList = getLocalPayments();

  try {
    const paymentsCol = collection(db, "payments");
    const q = query(paymentsCol, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const remoteList: PaymentRecord[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<PaymentRecord, "id">),
      }));

      // Merge remote list into local cache
      if (typeof window !== "undefined") {
        const remoteIds = new Set(remoteList.map((r) => r.id));
        const merged = [...remoteList, ...localList.filter((l) => !remoteIds.has(l.id))];
        localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(merged));
      }

      return remoteList;
    }
  } catch (err) {
    console.warn("Could not query payments collection with orderBy; trying fallback query:", err);
    try {
      const snapFallback = await getDocs(collection(db, "payments"));
      if (!snapFallback.empty) {
        const list = snapFallback.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PaymentRecord, "id">),
        }));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return list;
      }
    } catch (fallbackErr) {
      console.warn("Could not fetch payments from Firestore:", fallbackErr);
    }
  }

  // Fallback to local storage if Firestore is unreachable
  return localList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Subscribe to real-time payment updates from the 'payments' collection
 */
export const subscribeToPayments = (
  callback: (payments: PaymentRecord[]) => void
): (() => void) => {
  try {
    const paymentsCol = collection(db, "payments");
    const q = query(paymentsCol, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const payments: PaymentRecord[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PaymentRecord, "id">),
        }));
        callback(payments);
      },
      (error) => {
        console.warn("Payments realtime listener error, falling back to manual fetch:", error);
        fetchPaymentsFromFirestore().then(callback);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Failed to attach payments onSnapshot listener:", err);
    fetchPaymentsFromFirestore().then(callback);
    return () => {};
  }
};

/**
 * Find existing payment by orderId or paymentId
 */
export const findPaymentByOrderId = async (orderId: string): Promise<PaymentRecord | null> => {
  try {
    const q = query(collection(db, "payments"), where("orderId", "==", orderId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...(d.data() as Omit<PaymentRecord, "id">) };
    }
  } catch (err) {
    console.warn("Could not find payment by orderId in Firestore:", err);
  }

  const local = getLocalPayments();
  return local.find((p) => p.orderId === orderId) || null;
};

export const findPaymentByPaymentId = async (paymentId: string): Promise<PaymentRecord | null> => {
  try {
    const q = query(collection(db, "payments"), where("paymentId", "==", paymentId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...(d.data() as Omit<PaymentRecord, "id">) };
    }
  } catch (err) {
    console.warn("Could not find payment by paymentId in Firestore:", err);
  }

  const local = getLocalPayments();
  return local.find((p) => p.paymentId === paymentId) || null;
};

/**
 * Create or update a payment record in Firestore 'payments' collection
 */
export const savePaymentRecordInFirestore = async (
  record: Omit<PaymentRecord, "id"> & { id?: string }
): Promise<PaymentRecord> => {
  const docId = record.id || `pay_${record.orderId || Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const finalRecord: PaymentRecord = {
    ...record,
    id: docId,
    createdAt: record.createdAt || nowIso,
    updatedAt: nowIso,
  };

  try {
    const docRef = doc(db, "payments", docId);
    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...finalRecord,
        updatedAt: serverTimestamp(),
        createdAt: finalRecord.createdAt,
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not save payment to Firestore 'payments' collection:", err);
  }

  saveLocalPayment(finalRecord);
  return finalRecord;
};

/**
 * Record an initiated bKash payment when customer clicks pay
 */
export const recordBkashPaymentInitiated = async (
  order: Order,
  paymentId: string,
  isSandbox: boolean
): Promise<PaymentRecord> => {
  const existing = await findPaymentByOrderId(order.id);

  const payload: Omit<PaymentRecord, "id"> & { id?: string } = {
    id: existing?.id,
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentId,
    gateway: "bkash",
    methodTitle: "bKash Online Payment",
    amount: order.totalAmount,
    currency: "BDT",
    status: "PENDING",
    isSandbox,
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail,
      customerMsisdn: undefined,
      streetAddress: order.shippingAddress?.streetAddress,
      city: order.shippingAddress?.city,
      district: order.shippingAddress?.district,
      notes: order.shippingAddress?.notes || order.notes,
      userId: order.userId,
    },
    itemsCount: order.totalQuantity || order.items?.length || 1,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  return savePaymentRecordInFirestore(payload);
};

/**
 * Record successful bKash execution into the 'payments' table
 */
export const recordBkashPaymentSuccess = async (
  order: Order,
  details: BkashPaymentDetails
): Promise<PaymentRecord> => {
  const existing = (await findPaymentByOrderId(order.id)) || (await findPaymentByPaymentId(details.paymentId));

  const payload: Omit<PaymentRecord, "id"> & { id?: string } = {
    id: existing?.id,
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentId: details.paymentId,
    trxId: details.trxID,
    gateway: "bkash",
    methodTitle: "bKash Online Payment",
    amount: details.amount || order.totalAmount,
    currency: details.currency || "BDT",
    status: "COMPLETED",
    isSandbox: details.isSandbox,
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail,
      customerMsisdn: details.customerMsisdn,
      streetAddress: order.shippingAddress?.streetAddress,
      city: order.shippingAddress?.city,
      district: order.shippingAddress?.district,
      notes: order.shippingAddress?.notes || order.notes,
      userId: order.userId,
    },
    itemsCount: order.totalQuantity || order.items?.length || 1,
    paymentExecuteTime: normalizePaymentDate(details.paymentExecuteTime),
    merchantInvoiceNumber: details.merchantInvoiceNumber || order.orderNumber,
    createdAt: existing?.createdAt || order.createdAt || new Date().toISOString(),
  };

  return savePaymentRecordInFirestore(payload);
};

/**
 * Record bKash payment failure or cancellation into the 'payments' table
 */
export const recordBkashPaymentFailed = async (
  order: Order,
  paymentId: string,
  failureReason: string,
  isCancelled: boolean = false
): Promise<PaymentRecord> => {
  const existing = (await findPaymentByOrderId(order.id)) || (await findPaymentByPaymentId(paymentId));

  const payload: Omit<PaymentRecord, "id"> & { id?: string } = {
    id: existing?.id,
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentId: paymentId || existing?.paymentId,
    gateway: "bkash",
    methodTitle: "bKash Online Payment",
    amount: order.totalAmount,
    currency: "BDT",
    status: isCancelled ? "CANCELLED" : "FAILED",
    isSandbox: existing?.isSandbox ?? true,
    failureReason,
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail,
      streetAddress: order.shippingAddress?.streetAddress,
      city: order.shippingAddress?.city,
      district: order.shippingAddress?.district,
      notes: order.shippingAddress?.notes || order.notes,
      userId: order.userId,
    },
    itemsCount: order.totalQuantity || order.items?.length || 1,
    createdAt: existing?.createdAt || order.createdAt || new Date().toISOString(),
  };

  return savePaymentRecordInFirestore(payload);
};

/**
 * Record a Cash on Delivery payment into the 'payments' table
 */
export const recordCodPaymentInitiated = async (order: Order): Promise<PaymentRecord> => {
  const existing = await findPaymentByOrderId(order.id);

  const payload: Omit<PaymentRecord, "id"> & { id?: string } = {
    id: existing?.id,
    orderId: order.id,
    orderNumber: order.orderNumber,
    gateway: "cod",
    methodTitle: "Cash on Delivery",
    amount: order.totalAmount,
    currency: "BDT",
    status: order.paymentStatus === "paid" ? "COMPLETED" : "PENDING",
    isSandbox: false,
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail,
      streetAddress: order.shippingAddress?.streetAddress,
      city: order.shippingAddress?.city,
      district: order.shippingAddress?.district,
      notes: order.shippingAddress?.notes || order.notes,
      userId: order.userId,
    },
    itemsCount: order.totalQuantity || order.items?.length || 1,
    createdAt: existing?.createdAt || order.createdAt || new Date().toISOString(),
  };

  return savePaymentRecordInFirestore(payload);
};

/**
 * Update payment status manually by admin (e.g. mark COD as COMPLETED upon delivery)
 */
export const updatePaymentRecordStatus = async (
  paymentDocId: string,
  newStatus: PaymentRecordStatus,
  note?: string
): Promise<void> => {
  const nowIso = new Date().toISOString();
  try {
    const docRef = doc(db, "payments", paymentDocId);
    await updateDoc(
      docRef,
      sanitizeForFirestore({
        status: newStatus,
        failureReason: note || undefined,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (err) {
    console.warn("Could not update payment status in Firestore:", err);
  }

  const local = getLocalPayments();
  const existing = local.find((p) => p.id === paymentDocId);
  if (existing) {
    existing.status = newStatus;
    if (note) existing.failureReason = note;
    existing.updatedAt = nowIso;
    saveLocalPayment(existing);
  }
};

/**
 * Sync / backfill existing orders into the payments table
 * Useful for displaying past orders that were placed before the payments collection was created
 */
export const syncPaymentsFromOrders = async (orders: Order[]): Promise<number> => {
  if (!orders || orders.length === 0) return 0;

  const existingPayments = await fetchPaymentsFromFirestore();
  const existingOrderIds = new Set(existingPayments.map((p) => p.orderId));

  let syncedCount = 0;

  for (const order of orders) {
    if (!existingOrderIds.has(order.id)) {
      if (order.paymentMethod === "bkash" || order.paymentDetails) {
        if (order.paymentStatus === "paid" && order.paymentDetails) {
          await recordBkashPaymentSuccess(order, order.paymentDetails);
        } else {
          await recordBkashPaymentInitiated(
            order,
            order.bkashPaymentId || order.paymentDetails?.paymentId || `bkash_${order.id}`,
            order.paymentDetails?.isSandbox ?? true
          );
        }
        syncedCount++;
      } else {
        await recordCodPaymentInitiated(order);
        syncedCount++;
      }
    }
  }

  return syncedCount;
};
