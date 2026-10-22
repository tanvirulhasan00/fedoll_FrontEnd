import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase.config";
import { sanitizeForFirestore } from "./firestore";
import type { CartItem } from "~/redux/features/cart/cartSlice";

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "bkash" | "card";

export interface OrderShippingAddress {
  fullName: string;
  phoneNumber: string;
  streetAddress: string;
  city: string;
  district: string;
  postalCode?: string;
  notes?: string;
}

export interface OrderTrackingTimelineStep {
  status: OrderStatus;
  title: string;
  description: string;
  location?: string;
  timestamp: string;
  completed: boolean;
  isCurrent?: boolean;
}

export interface OrderCancellationRequest {
  requestedAt: string;
  reason: string;
  details?: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt?: string;
  adminNote?: string;
}

export interface OrderReturnRequest {
  ticketNumber: string;
  type: string;
  status: string;
  requestedAt: string;
  reason: string;
  itemDetails?: string;
  returnMethod?: "doorstep_pickup" | "hub_dropoff";
  reverseCourier?: string;
  reverseTrackingNumber?: string;
  pickupDate?: string;
  pickupTimeSlot?: string;
  dropoffHubName?: string;
  dropoffHubAddress?: string;
  dropoffDeadline?: string;
  dropoffHubPhone?: string;
  replacementCourier?: string;
  replacementTrackingNumber?: string;
  replacementItemDetails?: string;
  refundMethod?: string;
  refundAmount?: number;
  refundTransactionId?: string;
  inspectionResult?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "FED-839201"
  trackingNumber: string; // e.g. "TRK-7849120"
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: OrderShippingAddress;
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "paid";
  orderStatus: OrderStatus;
  courierName: string; // "Steadfast Courier" | "Pathao Express" | "RedX"
  courierTrackingUrl?: string;
  estimatedDeliveryDate: string;
  createdAt: string;
  trackingTimeline: OrderTrackingTimelineStep[];
  cancellationRequest?: OrderCancellationRequest;
  returnRequest?: OrderReturnRequest;
}

export interface CreateOrderInput {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: OrderShippingAddress;
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: "pending" | "paid";
  notes?: string;
}

const LOCAL_STORAGE_KEY = "fedoll_customer_orders_v1";

const getLocalOrders = (): Order[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalOrder = (order: Order) => {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalOrders();
    const updated = [order, ...existing.filter((o) => o.id !== order.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to cache order locally:", err);
  }
};

/**
 * Helper: Retrieve single order from Firestore, fallback to local storage
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const docRef = doc(db, "orders", orderId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const order = { id: snap.id, ...(snap.data() as DocumentData) } as Order;
      saveLocalOrder(order);
      return order;
    }
  } catch (err) {
    console.warn("Could not fetch order from Firestore:", err);
  }

  const local = getLocalOrders();
  return local.find((o) => o.id === orderId) || null;
};

/**
 * Creates initial order tracking timeline steps
 */
export const buildInitialTrackingTimeline = (
  nowIso: string,
  courierName: string
): OrderTrackingTimelineStep[] => {
  const date = new Date(nowIso);

  const formatStepDate = (offsetHours: number) => {
    const d = new Date(date.getTime() + offsetHours * 60 * 60 * 1000);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return [
    {
      status: "placed",
      title: "Order Received",
      description: "Order placed online by verified customer.",
      location: "Fedoll Online System",
      timestamp: formatStepDate(0),
      completed: true,
      isCurrent: false,
    },
    {
      status: "confirmed",
      title: "Order Confirmed & Approved",
      description: "Customer details and payment/COD verified.",
      location: "Dhaka Central Processing Hub",
      timestamp: formatStepDate(1),
      completed: true,
      isCurrent: true,
    },
    {
      status: "processing",
      title: "Quality Check & Tailoring Inspection",
      description: "Garments pressed, measured, and packed with eco-luxury dust bags.",
      location: "Dhaka Garment Atelier, Bangladesh",
      timestamp: `Expected: ${formatStepDate(12)}`,
      completed: false,
      isCurrent: false,
    },
    {
      status: "shipped",
      title:
        courierName && courierName !== "Pending Assignment" && courierName !== "Unassigned"
          ? `Dispatched with ${courierName}`
          : "Dispatched with Courier",
      description:
        courierName && courierName !== "Pending Assignment" && courierName !== "Unassigned"
          ? `Package handed over to ${courierName} for prompt express delivery.`
          : "Package handed over to assigned courier partner for prompt express delivery.",
      location: "Transit Hub, Dhaka",
      timestamp: `Expected: ${formatStepDate(24)}`,
      completed: false,
      isCurrent: false,
    },
    {
      status: "delivered",
      title: "Delivered to Customer",
      description: "Package delivered safely to destination address.",
      location: "Recipient Doorstep",
      timestamp: `Expected: ${formatStepDate(48)}`,
      completed: false,
      isCurrent: false,
    },
  ];
};

/**
 * Create a new order in Firestore under 'orders' collection
 */
export const createOrderInFirestore = async (
  input: CreateOrderInput
): Promise<Order> => {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const orderNumber = `FED-${randomSuffix}`;
  const trackingNumber = `TRK-BD${Math.floor(10000000 + Math.random() * 90000000)}`;

  const now = new Date();
  const estimatedDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const estimatedDeliveryDate = estimatedDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const courierName = "Pending Assignment";

  const newOrder: Order = {
    id: `ord_${Date.now()}_${randomSuffix}`,
    orderNumber,
    trackingNumber,
    userId: input.userId,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    shippingAddress: {
      fullName: input.shippingAddress.fullName || input.customerName,
      phoneNumber: input.shippingAddress.phoneNumber || input.customerPhone,
      streetAddress: input.shippingAddress.streetAddress || "",
      city: input.shippingAddress.city || "Dhaka",
      district: input.shippingAddress.district || "Dhaka",
      postalCode: input.shippingAddress.postalCode || "",
      notes: input.shippingAddress.notes || input.notes || "",
    },
    items: input.items.map((item) => ({
      ...item,
      size: item.size || "Standard",
      color: item.color || "Default",
      image: item.image || "",
      category: item.category || "Apparel",
    })),
    totalQuantity: input.totalQuantity,
    subtotal: input.subtotal,
    discount: input.discount || 0,
    shippingFee: input.shippingFee,
    totalAmount: input.totalAmount,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentStatus || (input.paymentMethod === "cod" ? "pending" : "paid"),
    orderStatus: "confirmed",
    courierName,
    courierTrackingUrl: "",
    estimatedDeliveryDate,
    createdAt: now.toISOString(),
    trackingTimeline: buildInitialTrackingTimeline(now.toISOString(), courierName),
  };

  // Primary Firestore Persistence
  try {
    const ordersCol = collection(db, "orders");
    const docRef = doc(ordersCol, newOrder.id);
    const cleanPayload = sanitizeForFirestore({
      ...newOrder,
      firestoreCreatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, cleanPayload);
  } catch (error) {
    console.error("Firestore order save error:", error);
  }

  // Always mirror to local cache for instant offline UI and smooth transitions
  saveLocalOrder(newOrder);

  return newOrder;
};

/**
 * Fetch all orders for a registered customer
 */
export const fetchCustomerOrders = async (
  userId: string
): Promise<Order[]> => {
  const localList = getLocalOrders().filter((o) => o.userId === userId);

  try {
    const ordersCol = collection(db, "orders");
    const q = query(ordersCol, where("userId", "==", userId));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const firestoreOrders: Order[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as DocumentData),
      })) as Order[];

      // Check if any local orders weren't synced to Firestore yet
      for (const localOrder of localList) {
        if (!firestoreOrders.some((fo) => fo.id === localOrder.id)) {
          try {
            await setDoc(
              doc(ordersCol, localOrder.id),
              sanitizeForFirestore({
                ...localOrder,
                firestoreCreatedAt: serverTimestamp(),
              })
            );
            firestoreOrders.push(localOrder);
          } catch (syncErr) {
            console.warn("Could not sync local order to Firestore:", syncErr);
          }
        }
      }

      // Update local cache with freshest Firestore data
      firestoreOrders.forEach((o) => saveLocalOrder(o));

      return firestoreOrders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (localList.length > 0) {
      // Local orders exist but Firestore is empty for this user: sync them now
      for (const localOrder of localList) {
        try {
          await setDoc(
            doc(ordersCol, localOrder.id),
            sanitizeForFirestore({
              ...localOrder,
              firestoreCreatedAt: serverTimestamp(),
            })
          );
        } catch {}
      }
    }
  } catch (err) {
    console.warn("Failed to fetch orders from Firestore, using local list:", err);
  }

  return localList.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * Search or track an order by Order Number or Tracking Number or ID
 */
export const fetchOrderByTrackingOrNumber = async (
  searchKey: string
): Promise<Order | null> => {
  const trimmed = searchKey.trim().toUpperCase();
  if (!trimmed) return null;

  // Search Firestore first so user always gets the freshest live status
  try {
    const ordersCol = collection(db, "orders");

    // 1. Try by orderNumber
    const q1 = query(ordersCol, where("orderNumber", "==", trimmed));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const order = { id: snap1.docs[0].id, ...(snap1.docs[0].data() as DocumentData) } as Order;
      saveLocalOrder(order);
      return order;
    }

    // 2. Try by trackingNumber
    const q2 = query(ordersCol, where("trackingNumber", "==", trimmed));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const order = { id: snap2.docs[0].id, ...(snap2.docs[0].data() as DocumentData) } as Order;
      saveLocalOrder(order);
      return order;
    }

    // 3. Try direct document id
    const docRef = doc(db, "orders", searchKey.trim());
    const snap3 = await getDoc(docRef);
    if (snap3.exists()) {
      const order = { id: snap3.id, ...(snap3.data() as DocumentData) } as Order;
      saveLocalOrder(order);
      return order;
    }
  } catch (err) {
    console.warn("Failed to query order in Firestore:", err);
  }

  // Fallback to local cache if offline
  const localMatch = getLocalOrders().find(
    (o) =>
      o.orderNumber.toUpperCase() === trimmed ||
      o.trackingNumber.toUpperCase() === trimmed ||
      o.id.toUpperCase() === trimmed
  );
  if (localMatch) return localMatch;

  return null;
};

/**
 * Cancel an order if still in placed or confirmed state (cannot cancel if shipped or delivered)
 */
export const cancelOrderInFirestore = async (
  orderId: string
): Promise<boolean> => {
  const existingOrder = await getOrderById(orderId);

  if (
    existingOrder &&
    ["shipped", "delivered", "cancelled"].includes(existingOrder.orderStatus)
  ) {
    throw new Error(
      "Orders cannot be cancelled once they are shipped to the courier partner. Cancellation is only permitted before shipping."
    );
  }

  const now = new Date();
  const timestampStr = now.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const updatedTimeline: OrderTrackingTimelineStep[] = existingOrder
    ? [
        ...existingOrder.trackingTimeline.map((step) => ({
          ...step,
          isCurrent: false,
        })),
        {
          status: "cancelled" as OrderStatus,
          title: "Order Cancelled",
          description: "Cancelled upon customer request.",
          timestamp: timestampStr,
          completed: true,
          isCurrent: true,
        },
      ]
    : [];

  try {
    const docRef = doc(db, "orders", orderId);
    await updateDoc(
      docRef,
      sanitizeForFirestore({
        orderStatus: "cancelled",
        cancelledAt: serverTimestamp(),
        trackingTimeline: updatedTimeline,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (err) {
    console.warn("Could not cancel order in Firestore:", err);
  }

  // Update in local cache as well
  if (existingOrder) {
    saveLocalOrder({
      ...existingOrder,
      orderStatus: "cancelled",
      trackingTimeline: updatedTimeline,
    });
  }

  return true;
};

/**
 * Customer: Submit a cancellation request with proper reason for admin review
 * Note: Orders that are already shipped cannot be cancelled.
 */
export const requestOrderCancellationInFirestore = async (
  orderId: string,
  reason: string,
  details?: string
): Promise<Order | null> => {
  const existingOrder = await getOrderById(orderId);

  if (!existingOrder) {
    throw new Error(`Order ${orderId} not found.`);
  }

  if (["shipped", "delivered", "cancelled"].includes(existingOrder.orderStatus)) {
    throw new Error(
      "Orders cannot be cancelled once shipped to the courier partner. Cancellation requests must be submitted before shipping."
    );
  }

  const now = new Date();
  const timestampStr = now.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const cancellationRequest: OrderCancellationRequest = {
    requestedAt: now.toISOString(),
    reason: reason.trim(),
    details: details?.trim() || "",
    status: "pending",
  };

  const updatedTimeline: OrderTrackingTimelineStep[] = [
    ...(existingOrder.trackingTimeline || []).map((step) => ({
      ...step,
      isCurrent: false,
    })),
    {
      status: existingOrder.orderStatus,
      title: "Cancellation Requested",
      description: `Customer submitted cancellation request: "${reason.trim()}". Awaiting atelier admin review.`,
      timestamp: timestampStr,
      completed: true,
      isCurrent: true,
    },
  ];

  const updateFields: Partial<Order> = {
    cancellationRequest,
    trackingTimeline: updatedTimeline,
  };

  try {
    const docRef = doc(db, "orders", orderId);
    await updateDoc(
      docRef,
      sanitizeForFirestore({
        ...updateFields,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (err) {
    console.warn("Could not record cancellation request in Firestore:", err);
  }

  const updatedOrderResult: Order = {
    ...existingOrder,
    ...updateFields,
  };

  saveLocalOrder(updatedOrderResult);
  return updatedOrderResult;
};

/**
 * Admin: Review and decide on a customer cancellation request (approve or reject)
 */
export const reviewOrderCancellationInFirestore = async (
  orderId: string,
  action: "approve" | "reject",
  adminNote?: string
): Promise<Order | null> => {
  const existingOrder = await getOrderById(orderId);
  if (!existingOrder) return null;

  const now = new Date();
  const timestampStr = now.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const updatedCancellationRequest: OrderCancellationRequest = {
    ...(existingOrder.cancellationRequest || {
      requestedAt: now.toISOString(),
      reason: "Cancellation Request",
      details: "",
      status: "pending",
    }),
    status: action === "approve" ? "approved" : "rejected",
    reviewedAt: now.toISOString(),
    adminNote: adminNote?.trim() || (action === "approve" ? "Cancellation request approved." : "Cancellation request declined."),
  };

  const newStatus: OrderStatus = action === "approve" ? "cancelled" : existingOrder.orderStatus;

  const updatedTimeline: OrderTrackingTimelineStep[] = [
    ...(existingOrder.trackingTimeline || []).map((step) => ({
      ...step,
      isCurrent: false,
    })),
    action === "approve"
      ? {
          status: "cancelled",
          title: "Order Cancelled (Approved by Admin)",
          description: adminNote?.trim()
            ? `Admin approved cancellation: ${adminNote.trim()}`
            : "Cancellation approved by admin. Order is now cancelled and items restocked.",
          timestamp: timestampStr,
          completed: true,
          isCurrent: true,
        }
      : {
          status: existingOrder.orderStatus,
          title: "Cancellation Request Declined",
          description: adminNote?.trim()
            ? `Admin declined request: ${adminNote.trim()}`
            : "Cancellation request was declined. Processing and dispatch continue.",
          timestamp: timestampStr,
          completed: true,
          isCurrent: true,
        },
  ];

  const updateFields: Partial<Order> = {
    orderStatus: newStatus,
    cancellationRequest: updatedCancellationRequest,
    trackingTimeline: updatedTimeline,
  };

  try {
    const docRef = doc(db, "orders", orderId);
    await updateDoc(
      docRef,
      sanitizeForFirestore({
        ...updateFields,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (err) {
    console.warn("Could not update cancellation review in Firestore:", err);
  }

  const updatedOrderResult: Order = {
    ...existingOrder,
    ...updateFields,
  };

  saveLocalOrder(updatedOrderResult);
  return updatedOrderResult;
};

/**
 * Admin: Fetch all orders across all customers directly from Firestore
 */
export const fetchAllOrdersForAdmin = async (): Promise<Order[]> => {
  const localList = getLocalOrders();

  try {
    const ordersCol = collection(db, "orders");
    const snap = await getDocs(ordersCol);

    const firestoreOrders: Order[] = snap.empty
      ? []
      : (snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as DocumentData),
        })) as Order[]);

    // Deduplicate and sync any local orders not yet in Firestore
    const map = new Map<string, Order>();
    firestoreOrders.forEach((o) => map.set(o.id, o));

    for (const localOrder of localList) {
      if (!map.has(localOrder.id)) {
        try {
          await setDoc(
            doc(ordersCol, localOrder.id),
            sanitizeForFirestore({
              ...localOrder,
              firestoreCreatedAt: serverTimestamp(),
            })
          );
        } catch {}
        map.set(localOrder.id, localOrder);
      }
    }

    const merged = Array.from(map.values());
    merged.forEach((o) => saveLocalOrder(o));

    return merged.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    console.warn("Failed to fetch all orders from Firestore, using local list:", err);
    return localList.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
};

/**
 * Admin: Update order status, payment status, courier, or milestone
 */
export const updateOrderStatusInFirestore = async (
  orderId: string,
  newStatus: OrderStatus,
  options?: {
    paymentStatus?: "pending" | "paid";
    courierName?: string;
    trackingNumber?: string;
    note?: string;
  }
): Promise<Order | null> => {
  const existingOrder = await getOrderById(orderId);
  if (!existingOrder) return null;

  const now = new Date();
  const timestampStr = now.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const getTimelineTitle = (s: OrderStatus) => {
    switch (s) {
      case "placed":
        return "Order Placed";
      case "confirmed":
        return "Order Confirmed & Approved";
      case "processing":
        return "Tailoring & Quality Check at Dhaka Atelier";
      case "shipped":
        return `Dispatched with ${options?.courierName || existingOrder.courierName || "Express Courier"}`;
      case "delivered":
        return "Package Successfully Delivered";
      case "cancelled":
        return "Order Cancelled by Store / Customer";
      default:
        return s;
    }
  };

  const updatedTimeline = existingOrder.trackingTimeline
    ? existingOrder.trackingTimeline.map((step) => {
        if (step.status === newStatus) {
          return {
            ...step,
            completed: true,
            isCurrent: true,
            title: getTimelineTitle(newStatus),
            timestamp: timestampStr,
            description: options?.note || step.description,
          };
        }
        if (step.status === "shipped" && options?.courierName && options.courierName !== "Pending Assignment") {
          return {
            ...step,
            title: `Dispatched with ${options.courierName}`,
            description: `Package handed over to ${options.courierName} for prompt express delivery.`,
            isCurrent: false,
            completed: step.completed || newStatus === "delivered",
          };
        }
        return {
          ...step,
          isCurrent: false,
          completed:
            step.completed ||
            (newStatus === "delivered" && step.status !== "cancelled") ||
            (newStatus === "shipped" &&
              ["placed", "confirmed", "processing"].includes(step.status)),
        };
      })
    : [];

  const updateFields: Partial<Order> = {
    orderStatus: newStatus,
    trackingTimeline: updatedTimeline,
  };

  if (options?.paymentStatus) updateFields.paymentStatus = options.paymentStatus;
  if (options?.courierName) updateFields.courierName = options.courierName;
  if (options?.trackingNumber) updateFields.trackingNumber = options.trackingNumber;

  try {
    const docRef = doc(db, "orders", orderId);
    await updateDoc(
      docRef,
      sanitizeForFirestore({
        ...updateFields,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (err) {
    console.warn("Could not update order in Firestore:", err);
  }

  const updatedOrderResult: Order = {
    ...existingOrder,
    ...updateFields,
  };

  saveLocalOrder(updatedOrderResult);
  return updatedOrderResult;
};

/**
 * Admin: Delete an order
 */
export const deleteOrderInFirestore = async (orderId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "orders", orderId));
  } catch (err) {
    console.warn("Could not delete order from Firestore:", err);
  }

  const local = getLocalOrders();
  const filtered = local.filter((o) => o.id !== orderId);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  return true;
};


