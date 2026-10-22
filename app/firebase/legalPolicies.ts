import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase.config";
import { sanitizeForFirestore } from "./firestore";


export interface LegalClause {
  id: string;
  title: string;
  content: string;
  bulletPoints?: string[];
}

export interface PrivacyPolicyData {
  lastUpdated: string;
  effectiveDate: string;
  noticeBanner?: string;
  contactEmail: string;
  dpoName: string;
  dpoContact: string;
  officeAddress: string;
  dataRetentionMonths: number;
  cookieNotice: string;
  thirdPartyServices: string[];
  clauses: LegalClause[];
}

export interface TermsOfServiceData {
  lastUpdated: string;
  effectiveDate: string;
  noticeBanner?: string;
  contactEmail: string;
  supportPhone: string;
  returnWindowDays: number;
  orderCancellationHours: number;
  exchangeFeeInsideDhaka: number;
  exchangeFeeOutsideDhaka: number;
  codVerificationThreshold: number;
  disputeJurisdiction: string;
  clauses: LegalClause[];
}

export interface SecurityComplianceData {
  lastUpdated: string;
  effectiveDate: string;
  noticeBanner?: string;
  sslGrade: string;
  pciDssCompliance: string;
  firestoreSecurityNotice: string;
  antiFraudLabeling: string;
  vulnerabilityReportingEmail: string;
  securityHotline: string;
  complianceCertifications: {
    id: string;
    title: string;
    issuer: string;
    status: string;
    badgeColor: string;
  }[];
  clauses: LegalClause[];
}

export interface ReturnsExchangesData {
  lastUpdated: string;
  effectiveDate: string;
  noticeBanner?: string;
  returnWindowDays: number;
  exchangeFeeInsideDhaka: number;
  exchangeFeeOutsideDhaka: number;
  freeExchangeOnDefect: boolean;
  refundProcessingDays: string;
  instantExchangeDispatched: boolean;
  supportHotline: string;
  supportWhatsApp: string;
  supportEmail: string;
  hubAddress: string;
  courierPartners: string[];
  nonReturnableItems: string[];
  clauses: LegalClause[];
}

export interface ReturnExchangeRequest {
  id: string;
  ticketNumber: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupAddress: string;
  zone: "inside_dhaka" | "outside_dhaka";
  type: "size_exchange" | "color_style_exchange" | "defective_replacement" | "refund";
  itemDetails: string;
  requestedReplacement?: string;

  // Handover Method (Doorstep Pickup vs Atelier/Hub Drop-off)
  returnMethod?: "doorstep_pickup" | "hub_dropoff";

  // Doorstep Pickup specifics (Steadfast, Pathao, RedX, Paperfly)
  pickupDate?: string;
  pickupTimeSlot?: string;
  pickupFee?: number;
  pickupFeeStatus?: "pending_cod" | "paid_bkash" | "waived_defect";
  reverseCourier?: string;
  reverseTrackingNumber?: string;
  pickupInstructions?: string;

  // Drop-off specifics (Uttara Flagship Atelier Hub, Banani Desk, Dhanmondi Point, Partner Courier Branch)
  dropoffHubName?: string;
  dropoffHubAddress?: string;
  dropoffHubPhone?: string;
  dropoffHubHours?: string;
  dropoffDeadline?: string;
  dropoffInstructions?: string;

  // Atelier Quality Inspection
  inspectionResult?: "passed" | "failed_damaged" | "failed_tags_missing" | "pending";
  inspectionNotes?: string;
  inspectedAt?: string;
  inspectedBy?: string;

  // Exchange Replacement Dispatch specifics
  replacementCourier?: string;
  replacementTrackingNumber?: string;
  replacementDispatchedAt?: string;
  replacementEstimatedDelivery?: string;
  replacementItemDetails?: string;

  // Monetary Refund specifics
  refundMethod?: "bKash" | "Nagad" | "Rocket" | "Bank Transfer" | "Store Credit";
  refundAccountDetails?: string;
  refundAmount?: number;
  refundTransactionId?: string;
  refundProcessedAt?: string;
  refundProofNote?: string;

  reason: string;
  status:
    | "pending"
    | "approved"
    | "pickup_scheduled"
    | "dropoff_pending"
    | "received_at_hub"
    | "resolved"
    | "rejected";
  createdAt: string;
  resolvedAt?: string;
  adminNotes?: string;
}

/* ============================================================================
   DEFAULT DATASETS (Realistic Bangladesh E-Commerce & Global Apparel Standards)
   ============================================================================ */

export const defaultPrivacyPolicy: PrivacyPolicyData = {
  lastUpdated: "October 20, 2026",
  effectiveDate: "January 1, 2026",
  noticeBanner:
    "We have updated our Data Protection & Courier Privacy Standards to comply with the 2026 Bangladesh Digital Commerce Guidelines.",
  contactEmail: "privacy@fedoll.com",
  dpoName: "Tanvir Hasan (Data Protection Officer)",
  dpoContact: "+880 1712-345678 (Ext. 402)",
  officeAddress: "House 14, Road 7, Sector 3, Uttara Model Town, Dhaka 1230, Bangladesh",
  dataRetentionMonths: 24,
  cookieNotice:
    "We use privacy-friendly local storage and session cookies exclusively to preserve your shopping bag, wishlist, and theme preferences.",
  thirdPartyServices: [
    "Steadfast Courier (Nationwide Doorstep Delivery)",
    "Pathao Express (Dhaka Same-Day Delivery)",
    "bKash Merchant Payment Gateway",
    "Nagad Corporate PGW",
    "Google Firebase Cloud Authentication & Firestore",
    "Cloudflare SSL/TLS Security Infrastructure",
  ],
  clauses: [
    {
      id: "collection",
      title: "1. Information We Collect from Customers",
      content:
        "When you place an order, create an account, or contact our customer support, we collect essential transactional and delivery details to craft and transport your garments securely.",
      bulletPoints: [
        "Full Legal Name and Verified Mobile Phone Number (required for Cash on Delivery confirmation).",
        "Exact Shipping Address including Flat/Holding, Thana, District, and Postal Code across all 64 districts.",
        "Email address for parcel tracking receipts, order confirmations, and size exchange tickets.",
        "Browser device preferences, dark/light theme state, and active shopping bag items stored locally.",
      ],
    },
    {
      id: "usage",
      title: "2. How We Utilize Your Personal Information",
      content:
        "Fedoll adheres to a strict non-disclosure policy. Your private data is utilized exclusively for garment dispatch, logistics verification, and customer satisfaction.",
      bulletPoints: [
        "Printing tamper-evident courier shipping labels with recipient contact and parcel contents.",
        "Sending real-time SMS and email milestone notifications regarding delivery status.",
        "Processing seamless 7-day size exchanges, refunds, or atelier alterations.",
        "Preventing fraudulent or duplicate Cash on Delivery bookings.",
      ],
    },
    {
      id: "sharing",
      title: "3. Logistics & Third-Party Service Disclosure",
      content:
        "We never sell, rent, or monetize your customer records. Data is transferred strictly through encrypted API tunnels to authorized courier and financial partners.",
      bulletPoints: [
        "Authorized Courier Partners: We share recipient name, phone, address, and parcel value only with Steadfast and Pathao express courier services.",
        "Financial Gateways: For online payments (bKash, Nagad, Visa, Mastercard), payment credentials are processed directly by certified payment processors under PCI-DSS protocols. Fedoll never stores your PIN or CVV.",
        "Legal Authorities: Information may be disclosed solely when compelled by applicable laws or court orders of the People's Republic of Bangladesh.",
      ],
    },
    {
      id: "rights",
      title: "4. Your Consumer Privacy Rights",
      content:
        "Every registered Fedoll customer retains full sovereignty over their personal data in accordance with modern digital privacy conventions.",
      bulletPoints: [
        "Access & Rectification: You may inspect and update your shipping address and personal details at any time in your Customer Profile.",
        "Account Deletion: You have the right to request permanent deletion of your profile and order history by writing to privacy@fedoll.com.",
        "Marketing Opt-Out: You may unsubscribe from our seasonal drop newsletters with one click via the unsubscribe link in our emails.",
      ],
    },
  ],
};

export const defaultTermsOfService: TermsOfServiceData = {
  lastUpdated: "October 20, 2026",
  effectiveDate: "January 1, 2026",
  noticeBanner:
    "Cash on Delivery is available across all 64 districts in Bangladesh with 7-day doorstep size exchange guarantee.",
  contactEmail: "legal@fedoll.com",
  supportPhone: "+880 1712-345678",
  returnWindowDays: 7,
  orderCancellationHours: 12,
  exchangeFeeInsideDhaka: 70,
  exchangeFeeOutsideDhaka: 130,
  codVerificationThreshold: 5000,
  disputeJurisdiction: "Dhaka, Bangladesh",
  clauses: [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms & Digital Contract",
      content:
        "By accessing the Fedoll storefront, placing an order, or interacting with our atelier services, you represent that you are at least 18 years of age or acting under the supervision of a legal guardian, and agree to be bound by these Terms of Service.",
      bulletPoints: [
        "Orders placed constitute a legally valid purchase offer for the selected garments.",
        "Fedoll reserves the right to accept or decline orders in cases of stock exhaustion or suspicious bulk ordering.",
      ],
    },
    {
      id: "pricing-payment",
      title: "2. Pricing, Bangladeshi Taka (৳ BDT) & Payment Methods",
      content:
        "All catalog prices are listed in Bangladeshi Taka (৳ BDT) and are inclusive of applicable VAT unless explicitly stated otherwise.",
      bulletPoints: [
        "Cash on Delivery (COD): Pay courier personnel in cash upon physical receipt and inspection of the package.",
        "High-Value Verification: Orders exceeding our threshold may require a quick phone confirmation or token advance to avoid fraudulent booking.",
        "Digital PGW: Payments via bKash, Nagad, or credit/debit cards are charged at the time of order confirmation.",
      ],
    },
    {
      id: "shipping-delivery",
      title: "3. Nationwide Courier Shipping & Inspection",
      content:
        "We dispatch parcels through trusted courier networks including Steadfast and Pathao Express with unique tracking IDs.",
      bulletPoints: [
        "Delivery Timeline: 24–48 hours within Dhaka Metro; 48–96 hours for all other districts, upazilas, and divisional cities.",
        "Open-Box Inspection: Customers are encouraged to inspect outer packaging in front of the delivery personnel before payment.",
        "Unclaimed Parcels: Customers who refuse delivery without legitimate defect reason may have COD privileges restricted on future orders.",
      ],
    },
    {
      id: "exchange-refund",
      title: "4. Return, Size Exchange & Atelier Guarantee",
      content:
        "We want every garment to fit you impeccably. If the fit, color, or cut does not meet your expectations, our easy exchange policy protects you.",
      bulletPoints: [
        "Exchange Period: You may request a size exchange or model swap within the eligible return window from the delivery date.",
        "Condition: Garments must remain unwashed, unworn, and retain all original Fedoll woven tags and barcode labels.",
        "Defect Guarantee: If a manufacturing stitch defect or fabric flaw is found, exchange delivery fees are 100% covered by Fedoll.",
      ],
    },
    {
      id: "intellectual-property",
      title: "5. Intellectual Property & Brand Assets",
      content:
        "All visual photography, fabric cut specifications, lookbook imagery, product descriptions, and the Fedoll emblem are proprietary intellectual property of Fedoll International Ltd.",
      bulletPoints: [
        "Commercial duplication or reselling of our visual assets without written consent is strictly prohibited.",
      ],
    },
  ],
};

export const defaultSecurityCompliance: SecurityComplianceData = {
  lastUpdated: "October 20, 2026",
  effectiveDate: "January 1, 2026",
  noticeBanner:
    "Fedoll employs end-to-end 256-bit TLS encryption, role-based database authentication, and sealed tamper-evident parcels.",
  sslGrade: "256-Bit TLS 1.3 End-to-End Encryption (A+ Rating)",
  pciDssCompliance: "PCI-DSS Level 1 Service Provider Gateway Integrations",
  firestoreSecurityNotice:
    "Firebase Firestore with strict Role-Based Access Control (RBAC) preventing unauthorized customer record traversal.",
  antiFraudLabeling:
    "Unique Code-128 barcode stickers, recipient identification, and courier consignment verification on every parcel.",
  vulnerabilityReportingEmail: "security@fedoll.com",
  securityHotline: "+880 1712-345678 (24/7 Security Escalation)",
  complianceCertifications: [
    {
      id: "digital-commerce",
      title: "Bangladesh Digital Commerce Guidelines 2026",
      issuer: "Ministry of Commerce, People's Republic of Bangladesh",
      status: "Fully Compliant & Certified",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    },
    {
      id: "pci-dss",
      title: "Payment Card Industry Data Security Standard (PCI-DSS)",
      issuer: "PCI Security Standards Council (via Partner PGWs)",
      status: "Level 1 Verified Processing",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    },
    {
      id: "oeko-tex",
      title: "OEKO-TEX® Standard 100 Fabric Safety",
      issuer: "International Association for Research & Testing in Textile Ecology",
      status: "Tested & Chemical-Free Garments",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    },
    {
      id: "iso-27001",
      title: "ISO/IEC 27001 Information Security Management",
      issuer: "Cloud Infrastructure Security Baseline (Google Cloud)",
      status: "Tier-4 Data Center Standards",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
    },
  ],
  clauses: [
    {
      id: "data-encryption",
      title: "1. Data Transmission & Cryptographic Standards",
      content:
        "All network communications between your web browser and our servers are encrypted using Transport Layer Security (TLS 1.3) with SHA-256 signatures, ensuring complete immunity against eavesdropping and man-in-the-middle exploits.",
      bulletPoints: [
        "HSTS (HTTP Strict Transport Security) enabled across all subdomains.",
        "Automatic cipher suite rotation and SSL session ticket encryption.",
        "Zero plain-text storage of customer passwords or confidential credentials.",
      ],
    },
    {
      id: "payment-security",
      title: "2. Payment Processing & Gateway Isolation",
      content:
        "Customer financial data is never exposed to or stored on Fedoll servers. Transactions are delegated through tokenized, sandboxed payment gateways with multi-factor OTP verification.",
      bulletPoints: [
        "Direct integration with bKash and Nagad official merchant APIs with two-factor OTP verification.",
        "Card payment transactions processed through SSLCommerz with 3D-Secure 2.0 protocol.",
        "Cash on Delivery verification shields customers from paying until parcels arrive at their doorstep.",
      ],
    },
    {
      id: "database-integrity",
      title: "3. Database Security & Access Governance",
      content:
        "Our database resides on Google Cloud Firestore with granular security rules. Only authenticated administrative users possessing verified admin roles can inspect system-wide orders or modify store parameters.",
      bulletPoints: [
        "Customers can only read and query their own personal orders and delivery addresses.",
        "Administrative actions require dual-factor session verification.",
        "Real-time audit trails with automated daily disaster recovery backups.",
      ],
    },
    {
      id: "physical-inspection",
      title: "4. Physical Logistics & Parcel Anti-Tampering",
      content:
        "Security extends beyond digital code to the physical packaging and handover of your export-grade apparel.",
      bulletPoints: [
        "Every garment box is sealed with high-adhesion tamper-evident Fedoll tape.",
        "Unique thermal stickers printed with Code-128 consignment barcodes and recipient verification numbers.",
        "Courier handovers recorded and cross-referenced with Steadfast and Pathao tracking nodes.",
      ],
    },
    {
      id: "responsible-disclosure",
      title: "5. Vulnerability Disclosure & Bug Bounty",
      content:
        "We welcome ethical security researchers to identify potential weaknesses in our web infrastructure and report them constructively.",
      bulletPoints: [
        "Send technical proof-of-concept reports directly to security@fedoll.com.",
        "We pledge to acknowledge and investigate valid security reports within 24 business hours.",
        "Responsible reporters are eligible for official acknowledgment and Fedoll merchandise rewards.",
      ],
    },
  ],
};

export const defaultReturnsExchanges: ReturnsExchangesData = {
  lastUpdated: "October 20, 2026",
  effectiveDate: "January 1, 2026",
  noticeBanner:
    "Complimentary Hassle-Free Doorstep Size Exchange across Dhaka and all 64 districts in Bangladesh.",
  returnWindowDays: 7,
  exchangeFeeInsideDhaka: 60,
  exchangeFeeOutsideDhaka: 120,
  freeExchangeOnDefect: true,
  refundProcessingDays: "3 - 5 business days",
  instantExchangeDispatched: true,
  supportHotline: "+880 1712-345678",
  supportWhatsApp: "+880 1712-345678",
  supportEmail: "returns@fedoll.com",
  hubAddress: "House 14, Road 7, Sector 3, Uttara Model Town, Dhaka 1230, Bangladesh",
  courierPartners: [
    "Steadfast Courier Reverse Logistics",
    "Pathao Express Doorstep Collection",
    "Paperfly Reverse Hub Network",
    "Fedoll Atelier Uttara Walk-in Desk",
  ],
  nonReturnableItems: [
    "Custom bespoke garments with personalized atelier monogramming or custom alterations.",
    "Intimate innerwear, undergarments, and socks due to strict health and sanitary regulations.",
    "Garments with removed, torn, or misplaced original Fedoll atelier tags and barcode seals.",
    "Items displaying noticeable perfume fragrance, body odor, washing powder scents, or wear marks.",
  ],
  clauses: [
    {
      id: "eligibility",
      title: "1. 7-Day Hassle-Free Exchange Eligibility",
      content:
        "Every garment purchased from Fedoll is backed by our signature 7-day atelier satisfaction promise. If your shirt, jacket, raw selvedge denim, or panjabi does not fit with immaculate precision, you may request an immediate size or style replacement.",
      bulletPoints: [
        "The exchange request must be initiated within 7 calendar days of the courier parcel delivery timestamp.",
        "Garments must remain in unworn, unwashed, brand-new condition with all fabric care and barcode tags attached.",
        "Original bespoke Fedoll garment bag and thermal packaging should be provided during courier handover.",
        "First size exchange is 100% free of service fees; only standard courier transportation applies.",
      ],
    },
    {
      id: "doorstep-pickup",
      title: "2. Nationwide Doorstep Reverse Courier Pickup",
      content:
        "You never have to visit a courier terminal or stand in queues. Once your return or exchange ticket is approved, we schedule a reverse pickup rider to collect the package directly from your home or office.",
      bulletPoints: [
        "Inside Dhaka: Doorstep reverse collection within 24–48 hours via Pathao Express or Steadfast.",
        "Outside Dhaka: Doorstep collection across all 64 districts within 48–72 hours via Steadfast Courier.",
        "Hand over the securely packaged parcel to the courier rider and collect the consignment receipt note.",
        "Exchange fee (৳60 inside Dhaka / ৳120 outside Dhaka) can be adjusted with COD or paid via bKash/Nagad.",
      ],
    },
    {
      id: "defective-wrong",
      title: "3. 100% Free Replacements for Defective or Wrong Items",
      content:
        "If you receive an item with a manufacturing fabric flaw, seam irregularity, or incorrect size/color dispatched through logistical error, Fedoll covers 100% of all reverse pickup and re-delivery charges.",
      bulletPoints: [
        "Please photograph the defect or mismatch and upload it when initiating the request or share on WhatsApp.",
        "Upon instantaneous verification, our dispatch team ships out the replacement immediately.",
        "No delivery charge, exchange surcharge, or handling fees will be charged to the customer.",
      ],
    },
    {
      id: "refund-policy",
      title: "4. Monetary Refunds & Store Credit Processing",
      content:
        "If a suitable replacement size or style is unavailable in our inventory, or if you prefer a monetary refund, we issue complete refunds promptly according to Bangladesh e-commerce trade laws.",
      bulletPoints: [
        "Refund requests are verified and processed within 3 to 5 business days upon parcel arrival at our Dhaka hub.",
        "Direct digital refunds are disbursed directly to your bKash, Nagad, or Bangladeshi Bank Account.",
        "Credit card payments are refunded back to the issuing bank card within standard banking settlement cycles (5-10 working days).",
        "Optional instant Store Credit with an extra 5% bonus voucher for your subsequent atelier shopping.",
      ],
    },
    {
      id: "drop-in-desk",
      title: "5. Walk-in Atelier Exchange Hub (Uttara, Dhaka)",
      content:
        "Customers residing in Dhaka are also warmly invited to exchange their garments in person at our flagship atelier studio in Uttara for instantaneous size fitting and complimentary alteration consults.",
      bulletPoints: [
        "Address: House 14, Road 7, Sector 3, Uttara Model Town, Dhaka 1230, Bangladesh.",
        "Visiting Hours: Saturday through Thursday, 10:00 AM to 8:30 PM.",
        "In-house tailors can provide immediate hem adjustments or size consultations on the spot.",
      ],
    },
  ],
};

/* ============================================================================
   FIRESTORE FETCH & SAVE METHODS (With Offline LocalStorage Fallback)
   ============================================================================ */

const LOCAL_STORAGE_PRIVACY_KEY = "fedoll_legal_privacy_v1";
const LOCAL_STORAGE_TERMS_KEY = "fedoll_legal_terms_v1";
const LOCAL_STORAGE_SECURITY_KEY = "fedoll_legal_security_v1";

export const fetchPrivacyPolicy = async (): Promise<PrivacyPolicyData> => {
  try {
    const docRef = doc(db, "legal_policies", "privacy");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...defaultPrivacyPolicy, ...snap.data() } as PrivacyPolicyData;
    }
    // Seed default to Firestore so database holds current dynamic data
    await setDoc(docRef, sanitizeForFirestore({ ...defaultPrivacyPolicy, updatedAt: serverTimestamp() }), { merge: true });
    return defaultPrivacyPolicy;
  } catch (err) {
    console.warn("Could not fetch privacy policy from Firestore:", err);
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PRIVACY_KEY);
      if (raw) return { ...defaultPrivacyPolicy, ...JSON.parse(raw) };
    } catch {}
  }

  return defaultPrivacyPolicy;
};

export const savePrivacyPolicy = async (
  data: PrivacyPolicyData
): Promise<PrivacyPolicyData> => {
  try {
    const docRef = doc(db, "legal_policies", "privacy");
    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...data,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not save privacy policy to Firestore:", err);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_PRIVACY_KEY, JSON.stringify(data));
    } catch {}
  }

  return data;
};

export const fetchTermsOfService = async (): Promise<TermsOfServiceData> => {
  try {
    const docRef = doc(db, "legal_policies", "terms");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...defaultTermsOfService, ...snap.data() } as TermsOfServiceData;
    }
    // Seed default to Firestore
    await setDoc(docRef, sanitizeForFirestore({ ...defaultTermsOfService, updatedAt: serverTimestamp() }), { merge: true });
    return defaultTermsOfService;
  } catch (err) {
    console.warn("Could not fetch terms of service from Firestore:", err);
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_TERMS_KEY);
      if (raw) return { ...defaultTermsOfService, ...JSON.parse(raw) };
    } catch {}
  }

  return defaultTermsOfService;
};

export const saveTermsOfService = async (
  data: TermsOfServiceData
): Promise<TermsOfServiceData> => {
  try {
    const docRef = doc(db, "legal_policies", "terms");
    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...data,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not save terms of service to Firestore:", err);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_TERMS_KEY, JSON.stringify(data));
    } catch {}
  }

  return data;
};

export const fetchSecurityCompliance = async (): Promise<SecurityComplianceData> => {
  try {
    const docRef = doc(db, "legal_policies", "security");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...defaultSecurityCompliance, ...snap.data() } as SecurityComplianceData;
    }
    // Seed default to Firestore
    await setDoc(docRef, sanitizeForFirestore({ ...defaultSecurityCompliance, updatedAt: serverTimestamp() }), { merge: true });
    return defaultSecurityCompliance;
  } catch (err) {
    console.warn("Could not fetch security compliance from Firestore:", err);
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SECURITY_KEY);
      if (raw) return { ...defaultSecurityCompliance, ...JSON.parse(raw) };
    } catch {}
  }

  return defaultSecurityCompliance;
};

export const saveSecurityCompliance = async (
  data: SecurityComplianceData
): Promise<SecurityComplianceData> => {
  try {
    const docRef = doc(db, "legal_policies", "security");
    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...data,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not save security compliance to Firestore:", err);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_SECURITY_KEY, JSON.stringify(data));
    } catch {}
  }

  return data;
};

const LOCAL_STORAGE_RETURNS_KEY = "fedoll_legal_returns_v1";
const LOCAL_STORAGE_RETURN_REQUESTS_KEY = "fedoll_return_requests_v1";

export const fetchReturnsExchanges = async (): Promise<ReturnsExchangesData> => {
  try {
    const docRef = doc(db, "legal_policies", "returns");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...defaultReturnsExchanges, ...snap.data() } as ReturnsExchangesData;
    }
    // Seed default returns policy to Firestore
    await setDoc(docRef, sanitizeForFirestore({ ...defaultReturnsExchanges, updatedAt: serverTimestamp() }), { merge: true });
    return defaultReturnsExchanges;
  } catch (err) {
    console.warn("Could not fetch returns & exchanges from Firestore:", err);
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_RETURNS_KEY);
      if (raw) return { ...defaultReturnsExchanges, ...JSON.parse(raw) };
    } catch {}
  }

  return defaultReturnsExchanges;
};

export const saveReturnsExchanges = async (
  data: ReturnsExchangesData
): Promise<ReturnsExchangesData> => {
  try {
    const docRef = doc(db, "legal_policies", "returns");
    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...data,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not save returns & exchanges to Firestore:", err);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_RETURNS_KEY, JSON.stringify(data));
    } catch {}
  }

  return data;
};

/**
 * Customer / Admin: Submit a new return/exchange request directly to Cloud Firestore.
 * Automatically links to the Order in Firestore if the order exists.
 */
export const createReturnExchangeRequest = async (
  requestData: Omit<ReturnExchangeRequest, "id" | "ticketNumber" | "status" | "createdAt">
): Promise<ReturnExchangeRequest> => {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const ticketNumber = `RET-${timestamp.toString().slice(-6)}-${randomSuffix}`;

  const fullRecord: ReturnExchangeRequest = {
    ...requestData,
    id: `req_${timestamp}_${randomSuffix}`,
    ticketNumber,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  // 1. Primary Firestore persistence
  try {
    const docRef = doc(db, "return_requests", fullRecord.id);
    const cleanPayload = sanitizeForFirestore({
      ...fullRecord,
      serverCreatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, cleanPayload);
  } catch (err) {
    console.error("Could not save return request to Firestore:", err);
  }

  // 2. Link return request directly onto the Order document if it exists in Firestore
  if (fullRecord.orderNumber) {
    try {
      const cleanOrderNo = fullRecord.orderNumber.trim().toUpperCase();
      const ordersCol = collection(db, "orders");
      const orderQuery = query(ordersCol, where("orderNumber", "==", cleanOrderNo));
      const orderSnap = await getDocs(orderQuery);

      if (!orderSnap.empty) {
        const orderDoc = orderSnap.docs[0];
        const orderData = orderDoc.data() as any;
        const now = new Date();
        const timestampStr = now.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        const updatedTimeline = [
          ...(orderData.trackingTimeline || []).map((step: any) => ({
            ...step,
            isCurrent: false,
          })),
          {
            status: orderData.orderStatus || "delivered",
            title: "Return / Exchange Requested",
            description: `Ticket #${ticketNumber} submitted (${fullRecord.type.replace(/_/g, " ")}). Reason: "${fullRecord.reason}".`,
            timestamp: timestampStr,
            completed: true,
            isCurrent: true,
          },
        ];

        await updateDoc(
          orderDoc.ref,
          sanitizeForFirestore({
            returnRequest: {
              ticketNumber,
              type: fullRecord.type,
              status: fullRecord.status,
              requestedAt: fullRecord.createdAt,
              reason: fullRecord.reason,
              itemDetails: fullRecord.itemDetails,
            },
            trackingTimeline: updatedTimeline,
            updatedAt: serverTimestamp(),
          })
        );
      }
    } catch (orderLinkErr) {
      console.warn("Could not link return ticket to order:", orderLinkErr);
    }
  }

  // 3. Mirror to local cache for instant UI availability
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_RETURN_REQUESTS_KEY);
      const list: ReturnExchangeRequest[] = raw ? JSON.parse(raw) : [];
      list.unshift(fullRecord);
      localStorage.setItem(LOCAL_STORAGE_RETURN_REQUESTS_KEY, JSON.stringify(list));
    } catch {}
  }

  return fullRecord;
};

/**
 * Fetch all return/exchange tickets directly from Firestore (free plan compliant)
 */
export const fetchReturnExchangeRequests = async (): Promise<ReturnExchangeRequest[]> => {
  let localList: ReturnExchangeRequest[] = [];
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_RETURN_REQUESTS_KEY);
      if (raw) localList = JSON.parse(raw);
    } catch {}
  }

  try {
    const colRef = collection(db, "return_requests");
    const snap = await getDocs(colRef);

    const firestoreList: ReturnExchangeRequest[] = snap.empty
      ? []
      : (snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as object),
        })) as ReturnExchangeRequest[]);

    // Deduplicate and sync any local requests not yet in Firestore
    const map = new Map<string, ReturnExchangeRequest>();
    firestoreList.forEach((r) => map.set(r.id, r));

    for (const localReq of localList) {
      if (!map.has(localReq.id)) {
        try {
          await setDoc(
            doc(colRef, localReq.id),
            sanitizeForFirestore({
              ...localReq,
              serverCreatedAt: serverTimestamp(),
            })
          );
        } catch {}
        map.set(localReq.id, localReq);
      }
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Update local cache
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_RETURN_REQUESTS_KEY, JSON.stringify(merged));
      } catch {}
    }

    return merged;
  } catch (err) {
    console.warn("Could not query return_requests from Firestore:", err);
    return localList;
  }
};

/**
 * Quick status update for return request
 */
export const updateReturnRequestStatus = async (
  id: string,
  status: ReturnExchangeRequest["status"],
  adminNotes?: string
): Promise<void> => {
  return updateReturnRequest(id, { status, adminNotes: adminNotes || "" });
};

/**
 * Search return request by Ticket Number or Order Number or Customer Phone
 */
export const fetchReturnRequestByTicket = async (
  queryStr: string
): Promise<ReturnExchangeRequest | null> => {
  const trimmed = queryStr.trim().toUpperCase();
  if (!trimmed) return null;

  // Search Firestore first
  try {
    const colRef = collection(db, "return_requests");

    // 1. By Ticket Number
    const q1 = query(colRef, where("ticketNumber", "==", trimmed));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      return { id: snap1.docs[0].id, ...(snap1.docs[0].data() as object) } as ReturnExchangeRequest;
    }

    // 2. By Order Number
    const q2 = query(colRef, where("orderNumber", "==", trimmed));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      return { id: snap2.docs[0].id, ...(snap2.docs[0].data() as object) } as ReturnExchangeRequest;
    }

    // 3. Fallback to full list search for phone / id
    const all = await fetchReturnExchangeRequests();
    const found = all.find(
      (r) =>
        r.ticketNumber.toUpperCase() === trimmed ||
        r.orderNumber.toUpperCase() === trimmed ||
        r.id.toUpperCase() === trimmed ||
        r.customerPhone.includes(trimmed)
    );
    if (found) return found;
  } catch (err) {
    console.warn("Failed to query return request from Firestore:", err);
  }

  // Fallback to local cache if offline
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_RETURN_REQUESTS_KEY);
      if (raw) {
        const list: ReturnExchangeRequest[] = JSON.parse(raw);
        const found = list.find(
          (r) =>
            r.ticketNumber.toUpperCase() === trimmed ||
            r.orderNumber.toUpperCase() === trimmed ||
            r.customerPhone.includes(trimmed)
        );
        if (found) return found;
      }
    } catch {}
  }

  return null;
};

/**
 * Update a return request in Cloud Firestore and sync linked order
 */
export const updateReturnRequest = async (
  id: string,
  updates: Partial<ReturnExchangeRequest>
): Promise<void> => {
  try {
    const docRef = doc(db, "return_requests", id);
    await updateDoc(
      docRef,
      sanitizeForFirestore({
        ...updates,
        updatedAt: serverTimestamp(),
      })
    );

    // If orderNumber is present, sync status and handover details to the order document
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const full = snap.data() as ReturnExchangeRequest;
      if (full.orderNumber) {
        try {
          const ordersCol = collection(db, "orders");
          const oSnap = await getDocs(
            query(ordersCol, where("orderNumber", "==", full.orderNumber.trim().toUpperCase()))
          );
          if (!oSnap.empty) {
            const orderDoc = oSnap.docs[0];
            const orderData = orderDoc.data() as any;

            const returnRequestUpdate: any = {
              "returnRequest.status": full.status,
              "returnRequest.returnMethod": full.returnMethod || null,
              "returnRequest.reverseCourier": full.reverseCourier || null,
              "returnRequest.reverseTrackingNumber": full.reverseTrackingNumber || null,
              "returnRequest.pickupDate": full.pickupDate || null,
              "returnRequest.pickupTimeSlot": full.pickupTimeSlot || null,
              "returnRequest.dropoffHubName": full.dropoffHubName || null,
              "returnRequest.dropoffHubAddress": full.dropoffHubAddress || null,
              "returnRequest.dropoffDeadline": full.dropoffDeadline || null,
              "returnRequest.dropoffHubPhone": full.dropoffHubPhone || null,
              "returnRequest.replacementCourier": full.replacementCourier || null,
              "returnRequest.replacementTrackingNumber": full.replacementTrackingNumber || null,
              "returnRequest.replacementItemDetails": full.replacementItemDetails || null,
              "returnRequest.refundMethod": full.refundMethod || null,
              "returnRequest.refundAmount": full.refundAmount || null,
              "returnRequest.refundTransactionId": full.refundTransactionId || null,
              "returnRequest.inspectionResult": full.inspectionResult || null,
              updatedAt: serverTimestamp(),
            };

            // Timeline milestone generator if status is provided in updates
            if (updates.status) {
              const now = new Date();
              const timestampStr = now.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });

              let timelineTitle = "";
              let timelineDesc = "";

              if (updates.status === "approved") {
                timelineTitle = "Return Request Approved";
                timelineDesc = `Ticket #${full.ticketNumber} approved. Proceeding with return handover arrangement.`;
              } else if (updates.status === "pickup_scheduled") {
                timelineTitle = "Reverse Pickup Scheduled";
                timelineDesc = `Doorstep reverse pickup arranged with ${full.reverseCourier || "Courier"} (Consignment: ${full.reverseTrackingNumber || "Pending"})${full.pickupDate ? ` on ${full.pickupDate}` : ""}.`;
              } else if (updates.status === "dropoff_pending") {
                timelineTitle = "Return Drop-Off Designated";
                timelineDesc = `Customer package to be dropped at ${full.dropoffHubName || "Atelier Hub"}${full.dropoffDeadline ? ` by ${full.dropoffDeadline}` : ""}.`;
              } else if (updates.status === "received_at_hub") {
                timelineTitle = "Package Received at Atelier";
                timelineDesc = `Return consignment received at Dhaka Hub. Inspection: ${full.inspectionResult ? full.inspectionResult.replace(/_/g, " ") : "In review"}.`;
              } else if (updates.status === "resolved") {
                if (full.type === "refund") {
                  timelineTitle = "Return Refund Settled";
                  timelineDesc = `Refund of ৳${full.refundAmount || "—"} disbursed via ${full.refundMethod || "Online Gateway"}${full.refundTransactionId ? ` (TrxID: ${full.refundTransactionId})` : ""}.`;
                } else {
                  timelineTitle = "Replacement Dispatched";
                  timelineDesc = `Fresh replacement garment dispatched via ${full.replacementCourier || "Courier"}${full.replacementTrackingNumber ? ` (Tracking: ${full.replacementTrackingNumber})` : ""}.`;
                }
              }

              if (timelineTitle) {
                const currentTimeline = orderData.trackingTimeline || [];
                const updatedTimeline = [
                  ...currentTimeline.map((step: any) => ({ ...step, isCurrent: false })),
                  {
                    status: orderData.orderStatus || "delivered",
                    title: timelineTitle,
                    description: timelineDesc,
                    timestamp: timestampStr,
                    completed: true,
                    isCurrent: true,
                  },
                ];
                returnRequestUpdate.trackingTimeline = updatedTimeline;
              }
            }

            await updateDoc(orderDoc.ref, sanitizeForFirestore(returnRequestUpdate));
          }
        } catch (syncErr) {
          console.warn("Could not sync return request to order doc:", syncErr);
        }
      }
    }
  } catch (err) {
    console.error("Could not update return request in Firestore:", err);
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_RETURN_REQUESTS_KEY);
      if (raw) {
        const list: ReturnExchangeRequest[] = JSON.parse(raw);
        const idx = list.findIndex((r) => r.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates };
          localStorage.setItem(LOCAL_STORAGE_RETURN_REQUESTS_KEY, JSON.stringify(list));
        }
      }
    } catch {}
  }
};

/**
 * Delete a return request from Cloud Firestore
 */
export const deleteReturnRequest = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, "return_requests", id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error("Could not delete return request in Firestore:", err);
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_RETURN_REQUESTS_KEY);
      if (raw) {
        const list: ReturnExchangeRequest[] = JSON.parse(raw);
        const filtered = list.filter((r) => r.id !== id);
        localStorage.setItem(LOCAL_STORAGE_RETURN_REQUESTS_KEY, JSON.stringify(filtered));
      }
    } catch {}
  }
};


