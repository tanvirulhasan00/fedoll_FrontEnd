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
      title: `Dispatched with ${courierName}`,
      description: `Package handed over to ${courierName} for prompt express delivery.`,
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

  const courierName =
    input.shippingAddress.city.toLowerCase().includes("dhaka") ||
    input.shippingAddress.district.toLowerCase().includes("dhaka")
      ? "Steadfast Express (Dhaka 24-Hour)"
      : "Pathao Express Courier";

  const newOrder: Order = {
    id: `ord_${Date.now()}_${randomSuffix}`,
    orderNumber,
    trackingNumber,
    userId: input.userId,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    shippingAddress: input.shippingAddress,
    items: input.items,
    totalQuantity: input.totalQuantity,
    subtotal: input.subtotal,
    discount: input.discount,
    shippingFee: input.shippingFee,
    totalAmount: input.totalAmount,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentStatus || (input.paymentMethod === "cod" ? "pending" : "paid"),
    orderStatus: "confirmed",
    courierName,
    courierTrackingUrl: `https://steadfast.com.bd/tracking/${trackingNumber}`,
    estimatedDeliveryDate,
    createdAt: now.toISOString(),
    trackingTimeline: buildInitialTrackingTimeline(now.toISOString(), courierName),
  };

  // Attempt Firestore sync
  try {
    const ordersCol = collection(db, "orders");
    const docRef = doc(ordersCol, newOrder.id);
    await setDoc(docRef, {
      ...newOrder,
      firestoreCreatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn("Could not save order directly to Firestore, saving to local state:", error);
  }

  // Always cache locally so customer has zero-friction instant access
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

      // Merge and deduplicate
      const map = new Map<string, Order>();
      firestoreOrders.forEach((o) => map.set(o.id, o));
      localList.forEach((o) => {
        if (!map.has(o.id)) map.set(o.id, o);
      });

      const merged = Array.from(map.values());
      return merged.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
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

  // First search local cache
  const localMatch = getLocalOrders().find(
    (o) =>
      o.orderNumber.toUpperCase() === trimmed ||
      o.trackingNumber.toUpperCase() === trimmed ||
      o.id.toUpperCase() === trimmed
  );
  if (localMatch) return localMatch;

  // Search Firestore
  try {
    const ordersCol = collection(db, "orders");

    // Try by orderNumber
    const q1 = query(ordersCol, where("orderNumber", "==", trimmed));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      return { id: snap1.docs[0].id, ...(snap1.docs[0].data() as DocumentData) } as Order;
    }

    // Try by trackingNumber
    const q2 = query(ordersCol, where("trackingNumber", "==", trimmed));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      return { id: snap2.docs[0].id, ...(snap2.docs[0].data() as DocumentData) } as Order;
    }

    // Try direct document id
    const docRef = doc(db, "orders", searchKey.trim());
    const snap3 = await getDoc(docRef);
    if (snap3.exists()) {
      return { id: snap3.id, ...(snap3.data() as DocumentData) } as Order;
    }
  } catch (err) {
    console.warn("Failed to query order in Firestore:", err);
  }

  return null;
};

/**
 * Cancel an order if still in placed or confirmed state
 */
export const cancelOrderInFirestore = async (
  orderId: string
): Promise<boolean> => {
  try {
    const docRef = doc(db, "orders", orderId);
    await updateDoc(docRef, {
      orderStatus: "cancelled",
      cancelledAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Could not cancel order in Firestore:", err);
  }

  // Update in local cache as well
  const local = getLocalOrders();
  const updated = local.map((o) =>
    o.id === orderId
      ? {
          ...o,
          orderStatus: "cancelled" as OrderStatus,
          trackingTimeline: [
            ...o.trackingTimeline,
            {
              status: "cancelled" as OrderStatus,
              title: "Order Cancelled",
              description: "Cancelled upon customer request.",
              timestamp: new Date().toLocaleString(),
              completed: true,
              isCurrent: true,
            },
          ],
        }
      : o
  );
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

  return true;
};

/**
 * Admin: Fetch all orders across all customers
 */
export const fetchAllOrdersForAdmin = async (): Promise<Order[]> => {
  const localList = getLocalOrders();

  try {
    const ordersCol = collection(db, "orders");
    const snap = await getDocs(ordersCol);

    if (!snap.empty) {
      const firestoreOrders: Order[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as DocumentData),
      })) as Order[];

      const map = new Map<string, Order>();
      firestoreOrders.forEach((o) => map.set(o.id, o));
      localList.forEach((o) => {
        if (!map.has(o.id)) map.set(o.id, o);
      });

      const merged = Array.from(map.values());
      return merged.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  } catch (err) {
    console.warn("Failed to fetch all orders from Firestore, using local list:", err);
  }

  return localList.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
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
  const local = getLocalOrders();
  const existingOrder = local.find((o) => o.id === orderId);

  // Generate updated timeline
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
        return `Dispatched with ${options?.courierName || existingOrder?.courierName || "Express Courier"}`;
      case "delivered":
        return "Package Successfully Delivered";
      case "cancelled":
        return "Order Cancelled by Store / Customer";
      default:
        return s;
    }
  };

  const updatedTimeline = existingOrder?.trackingTimeline
    ? existingOrder.trackingTimeline.map((step) => {
        if (step.status === newStatus) {
          return {
            ...step,
            completed: true,
            isCurrent: true,
            timestamp: timestampStr,
            description: options?.note || step.description,
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
    await updateDoc(docRef, {
      ...updateFields,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Could not update order in Firestore:", err);
  }

  // Update in local cache
  let updatedOrderResult: Order | null = null;
  const updatedList = local.map((o) => {
    if (o.id === orderId) {
      const merged = { ...o, ...updateFields };
      updatedOrderResult = merged;
      return merged;
    }
    return o;
  });

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
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

