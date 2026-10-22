import type { ReturnExchangeRequest, ReturnsExchangesData } from "~/firebase";

export interface ReverseCourierOption {
  id: string;
  name: string;
  code: string;
  note: string;
  defaultTrackingPrefix: string;
  website: string;
}

export const BANGLADESH_REVERSE_COURIERS: ReverseCourierOption[] = [
  {
    id: "steadfast",
    name: "Steadfast Courier Reverse Logistics",
    code: "STF",
    note: "Nationwide doorstep reverse collection across all 64 districts in Bangladesh",
    defaultTrackingPrefix: "STF-REV",
    website: "https://steadfast.com.bd",
  },
  {
    id: "pathao",
    name: "Pathao Express Reverse",
    code: "PTH",
    note: "Rapid 24-hour doorstep reverse collection across Dhaka Metro & Chittagong",
    defaultTrackingPrefix: "PTH-REV",
    website: "https://pathao.com",
  },
  {
    id: "redx",
    name: "RedX Logistics Reverse",
    code: "RDX",
    note: "Doorstep pickup in all divisional cities and district headquarters",
    defaultTrackingPrefix: "RDX-REV",
    website: "https://redx.com.bd",
  },
  {
    id: "paperfly",
    name: "Paperfly Reverse Hub",
    code: "PFLY",
    note: "Deep doorstep reach spanning upazilas, unions, and rural post offices",
    defaultTrackingPrefix: "PFLY-REV",
    website: "https://paperfly.com.bd",
  },
  {
    id: "ecourier",
    name: "eCourier Reverse Parcel",
    code: "ECO",
    note: "Secure reverse collection with SMS OTP handover verification",
    defaultTrackingPrefix: "ECO-REV",
    website: "https://ecourier.com.bd",
  },
];

export interface DispatchCourierOption {
  id: string;
  name: string;
  code: string;
  note: string;
  defaultTrackingPrefix: string;
}

export const BANGLADESH_DISPATCH_COURIERS: DispatchCourierOption[] = [
  {
    id: "steadfast",
    name: "Steadfast Courier",
    code: "STF",
    note: "Nationwide 24–72h home delivery across 64 districts",
    defaultTrackingPrefix: "STF-OUT",
  },
  {
    id: "pathao",
    name: "Pathao Express",
    code: "PTH",
    note: "Same-Day / Next-Day delivery in Dhaka Metro & Chittagong",
    defaultTrackingPrefix: "PTH-OUT",
  },
  {
    id: "redx",
    name: "RedX Logistics",
    code: "RDX",
    note: "Reliable parcel delivery in divisional cities",
    defaultTrackingPrefix: "RDX-OUT",
  },
  {
    id: "paperfly",
    name: "Paperfly Express",
    code: "PFLY",
    note: "Home delivery to remote upazilas and sub-districts",
    defaultTrackingPrefix: "PFLY-OUT",
  },
  {
    id: "sundarban",
    name: "Sundarban Courier Service",
    code: "SCS",
    note: "Branch-to-branch collection and direct counter delivery",
    defaultTrackingPrefix: "SCS-OUT",
  },
];

export interface DropOffHubOption {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  city: string;
  landmark: string;
  isMain?: boolean;
}

export const FEDOLL_DROP_OFF_HUBS: DropOffHubOption[] = [
  {
    id: "uttara_flagship",
    name: "Fedoll Flagship Atelier Hub (Uttara)",
    address: "House 14, Road 7, Sector 3, Uttara Model Town, Dhaka 1230, Bangladesh",
    phone: "+880 1712-345678",
    hours: "Saturday – Thursday, 10:00 AM – 08:30 PM (Friday Closed)",
    city: "Dhaka",
    landmark: "3 min walk from Uttara North Metro Station (Opposite to Friends Club)",
    isMain: true,
  },
  {
    id: "banani_concierge",
    name: "Fedoll Concierge Desk (Banani)",
    address: "House 48, Road 11, Block D, Banani, Dhaka 1213, Bangladesh",
    phone: "+880 1812-345679",
    hours: "Saturday – Thursday, 11:00 AM – 08:00 PM",
    city: "Dhaka",
    landmark: "Beside Kemal Ataturk Avenue junction",
  },
  {
    id: "dhanmondi_point",
    name: "Fedoll Collection Point (Dhanmondi)",
    address: "House 27, Road 9/A, Satmasjid Road, Dhanmondi, Dhaka 1209, Bangladesh",
    phone: "+880 1912-345670",
    hours: "Saturday – Thursday, 11:00 AM – 08:00 PM",
    city: "Dhaka",
    landmark: "Near Star Cineplex Shimanto Shambhar",
  },
  {
    id: "courier_nationwide_hub",
    name: "Authorized Courier Hub Drop-Off (All 64 Districts)",
    address: "Nearest Steadfast Courier or Pathao Hub branch in customer's district/city",
    phone: "+880 1712-345678 (Head Office Concierge)",
    hours: "Saturday – Thursday, 10:00 AM – 06:00 PM",
    city: "Nationwide",
    landmark: "Present return consignment note at the parcel booking counter",
  },
];

/**
 * Generate a smart WhatsApp customer service URL with courteous Bangladesh e-commerce phrasing
 */
export function getReturnWhatsAppUrl(
  ticket: ReturnExchangeRequest,
  policy?: ReturnsExchangesData
): string {
  const cleanPhone = ticket.customerPhone.replace(/[^0-9]/g, "");
  const hotline = policy?.supportHotline || "+880 1712-345678";
  let message = "";

  switch (ticket.status) {
    case "pending":
    case "approved":
      message = `Hello ${ticket.customerName}, this is Fedoll Apparel Atelier. Regarding your Return/Exchange Ticket #${ticket.ticketNumber} for Order #${ticket.orderNumber}: Your request has been approved! We are now finalizing your package return handover details.`;
      break;

    case "pickup_scheduled":
      message = `Hello ${ticket.customerName}, your Fedoll Return/Exchange Ticket #${ticket.ticketNumber} is approved!\n\n` +
        `📦 *Doorstep Reverse Pickup Scheduled*\n` +
        `• Courier Partner: ${ticket.reverseCourier || "Steadfast Courier Reverse"}\n` +
        `• Consignment ID: ${ticket.reverseTrackingNumber || "REV-FED-1001"}\n` +
        `• Scheduled Date: ${ticket.pickupDate || "Tomorrow"}\n` +
        `• Time Window: ${ticket.pickupTimeSlot || "Morning (10:00 AM - 02:00 PM)"}\n` +
        `• Pickup Charge: ${ticket.pickupFee ? `৳${ticket.pickupFee} (${ticket.pickupFeeStatus === "paid_bkash" ? "Paid" : "Pay to rider"})` : "Free (Warranty)"}\n\n` +
        `📌 *Instructions:* Please keep your garment securely packed in the original Fedoll parcel bag with all woven tags intact and hand it over to the rider when they arrive. Thank you!`;
      break;

    case "dropoff_pending":
      message = `Hello ${ticket.customerName}, your Fedoll Return/Exchange Ticket #${ticket.ticketNumber} is approved!\n\n` +
        `📍 *Customer Drop-Off Details*\n` +
        `• Hub Location: ${ticket.dropoffHubName || "Fedoll Flagship Atelier Hub (Uttara)"}\n` +
        `• Address: ${ticket.dropoffHubAddress || "House 14, Road 7, Sector 3, Uttara Model Town, Dhaka 1230"}\n` +
        `• Visiting Hours: ${ticket.dropoffHubHours || "Saturday – Thursday, 10:00 AM – 08:30 PM"}\n` +
        `• Drop-Off Deadline: ${ticket.dropoffDeadline || "Within 5 calendar days"}\n` +
        `• Desk Phone: ${ticket.dropoffHubPhone || hotline}\n\n` +
        `📌 *Instructions:* Please bring the garment in its original bag with tags intact. Present Ticket #${ticket.ticketNumber} at the front reception desk.`;
      break;

    case "received_at_hub":
      message = `Hello ${ticket.customerName}, we have safely received your return package at our Uttara atelier hub!\n\n` +
        `🔍 *Quality Inspection Result:* ${ticket.inspectionResult ? ticket.inspectionResult.replace(/_/g, " ").toUpperCase() : "PASSED - Tags Intact & Brand New"}\n\n` +
        `${ticket.type === "refund" ? "Our accounts team is now processing your monetary refund settlement." : "Our atelier dispatch team is preparing your fresh replacement garment for outbound dispatch."}`;
      break;

    case "resolved":
      if (ticket.type === "refund") {
        message = `Hello ${ticket.customerName}, your refund for Fedoll Return Ticket #${ticket.ticketNumber} (Order #${ticket.orderNumber}) has been successfully settled!\n\n` +
          `💰 *Refund Settlement Confirmation*\n` +
          `• Disbursed Amount: ৳${ticket.refundAmount || 0}\n` +
          `• Gateway: ${ticket.refundMethod || "bKash"}\n` +
          `• Account: ${ticket.refundAccountDetails || "Verified account"}\n` +
          `• Transaction ID (TrxID): ${ticket.refundTransactionId || "N/A"}\n\n` +
          `Thank you for shopping with Fedoll Apparel Atelier Bangladesh!`;
      } else {
        message = `Hello ${ticket.customerName}, exciting news! Your fresh replacement garment has been dispatched!\n\n` +
          `🚚 *Outbound Replacement Tracking*\n` +
          `• Item: ${ticket.replacementItemDetails || ticket.requestedReplacement || "Replacement Garment"}\n` +
          `• Courier Partner: ${ticket.replacementCourier || "Steadfast Courier"}\n` +
          `• Tracking Number: ${ticket.replacementTrackingNumber || "N/A"}\n` +
          `• Estimated Delivery: ${ticket.replacementEstimatedDelivery || "24–48 hours"}\n\n` +
          `Track live here: https://fedoll.com/track-order?tracking=${ticket.replacementTrackingNumber || ""}\n` +
          `Thank you for your patronage!`;
      }
      break;

    case "rejected":
      message = `Hello ${ticket.customerName}, regarding your Return/Exchange Ticket #${ticket.ticketNumber} for Order #${ticket.orderNumber}: After reviewing with our quality team, we regret to inform you that your return could not be approved.\n\n` +
        `Reason: "${ticket.adminNotes || "Garment condition or return policy window guidelines not met"}".\n\n` +
        `If you have questions, please reach out to our concierge hotline at ${hotline}.`;
      break;

    default:
      message = `Hello ${ticket.customerName}, this is Fedoll Apparel regarding your Ticket #${ticket.ticketNumber}.`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
