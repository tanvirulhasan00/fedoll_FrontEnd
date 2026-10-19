import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase.config";

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
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
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
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
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
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
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
