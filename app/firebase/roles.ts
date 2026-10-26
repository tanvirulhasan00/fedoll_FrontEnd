/**
 * Application Roles and Permission Controls for SilkenDrift eCommerce
 *
 * Staff Roles:
 * - admin: Store Owner / Super Administrator (Full access, system settings, legal, staff management)
 * - manager: Operations Manager (Catalog, stock, orders, returns, shipping, coupons, blogs, inquiries)
 * - salesman: Sales Representative (Orders fulfillment, returns, stock inquiry, customer support)
 *
 * Customer Role:
 * - customer: Verified storefront customer
 */

export type AppStaffRole = "admin" | "manager" | "salesman";
export type AppRole = AppStaffRole | "customer";

export type AdminTab =
  | "overview"
  | "products"
  | "categories"
  | "inventory"
  | "orders"
  | "returns"
  | "blogs"
  | "shipping"
  | "customers"
  | "staff"
  | "coupons"
  | "messages"
  | "newsletters"
  | "legal"
  | "settings";

/**
 * Normalizes any role string into one of the canonical AppRole values.
 */
export const normalizeRole = (role?: string | null): AppRole => {
  if (!role) return "customer";
  const r = role.toLowerCase().trim();
  if (r === "admin" || r === "administrator" || r === "superadmin") return "admin";
  if (r === "manager" || r === "operations_manager") return "manager";
  if (r === "salesman" || r === "sales_man" || r === "sales" || r === "salesperson") return "salesman";
  return "customer";
};

/**
 * Checks whether a given role is an internal staff member.
 */
export const isStaffRole = (role?: string | null): boolean => {
  const norm = normalizeRole(role);
  return norm === "admin" || norm === "manager" || norm === "salesman";
};

/**
 * Checks whether a given role is a super administrator.
 */
export const isSuperAdmin = (role?: string | null): boolean => {
  return normalizeRole(role) === "admin";
};

/**
 * Checks whether a role has permission to manage (promote, demote, delete) staff roles.
 * Only administrators have this permission.
 */
export const canManageStaff = (role?: string | null): boolean => {
  return normalizeRole(role) === "admin";
};

/**
 * Validates whether currentUser has permission to delete targetUser.
 * Rule: "no one can delete admin. admin can delete or demote all roles"
 */
export const canDeleteUser = (
  currentUserRole: string | null | undefined,
  targetUserRole: string | null | undefined,
  isSelf: boolean
): { canDelete: boolean; reason?: string } => {
  if (isSelf) {
    return { canDelete: false, reason: "You cannot delete your own active account." };
  }

  const normTarget = normalizeRole(targetUserRole);
  if (normTarget === "admin") {
    return {
      canDelete: false,
      reason: "Administrators are protected by system security rules and cannot be deleted.",
    };
  }

  const normCurrent = normalizeRole(currentUserRole);
  if (normCurrent !== "admin") {
    return {
      canDelete: false,
      reason: "Only Administrators possess authority to delete user accounts.",
    };
  }

  return { canDelete: true };
};

/**
 * Validates whether currentUser has permission to change (promote or demote) targetUser's role.
 * Rule: "admin can delete or demote all roles"
 */
export const canChangeRole = (
  currentUserRole: string | null | undefined,
  targetUserRole: string | null | undefined,
  isSelf: boolean
): { canChange: boolean; reason?: string } => {
  const normCurrent = normalizeRole(currentUserRole);
  if (normCurrent !== "admin") {
    return {
      canChange: false,
      reason: "Only Administrators have permission to alter user roles.",
    };
  }

  if (isSelf) {
    return {
      canChange: false,
      reason: "You cannot demote or alter your own administrator role.",
    };
  }

  return { canChange: true };
};

/**
 * Returns the list of permitted admin tabs for a given role.
 */
export const getRoleAllowedTabs = (role?: string | null): AdminTab[] => {
  const norm = normalizeRole(role);
  switch (norm) {
    case "admin":
      return [
        "overview",
        "products",
        "categories",
        "inventory",
        "orders",
        "returns",
        "blogs",
        "shipping",
        "customers",
        "staff",
        "coupons",
        "messages",
        "newsletters",
        "legal",
        "settings",
      ];
    case "manager":
      return [
        "overview",
        "products",
        "categories",
        "inventory",
        "orders",
        "returns",
        "blogs",
        "shipping",
        "customers",
        "coupons",
        "messages",
        "newsletters",
      ];
    case "salesman":
      return [
        "overview",
        "orders",
        "returns",
        "inventory",
        "products",
        "messages",
        "customers",
      ];
    default:
      return [];
  }
};

/**
 * Comprehensive metadata and styling for each role.
 */
export const ROLE_CONFIGS: Record<
  AppRole,
  {
    role: AppRole;
    label: string;
    shortLabel: string;
    tagline: string;
    badgeClass: string;
    description: string;
    permissions: string[];
  }
> = {
  admin: {
    role: "admin",
    label: "Administrator",
    shortLabel: "Admin",
    tagline: "Super Admin & Store Owner",
    badgeClass:
      "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    description:
      "Unrestricted administrative power: store general settings, legal policies, staff promotions/demotions, inventory, order processing, and all store data.",
    permissions: [
      "Manage Store Settings, Branding & Payment Parameters",
      "Draft, Publish & Modify Store Legal Policies",
      "Promote, Demote & Delete Staff Members",
      "Full Control over Catalog, Categories & Heavy Restocking",
      "Process Orders, Logistics & Return Tickets",
      "Create & Manage Coupons & Promotional Campaigns",
      "Resolve Customer Inquiries & View Shopper Profiles",
    ],
  },
  manager: {
    role: "manager",
    label: "Operations Manager",
    shortLabel: "Manager",
    tagline: "Store Operations & Merchandising",
    badgeClass:
      "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    description:
      "Operational leadership: product catalog authoring, inventory restocking, logistics courier configuration, customer communications, coupons, and journal posts.",
    permissions: [
      "Author & Edit Products, Categories & Pricing",
      "Inventory Stock Tracking & Batch Restocking",
      "Order Fulfillment, Courier Routing & Status Updates",
      "Review & Resolve Returns & Exchanges",
      "Configure Shipping Providers & Base Rates",
      "Manage Coupons & Newsletter Broadcasts",
      "Reply to Customer Messages & Inquiries",
      "Inspect Verified Customer Shopper Records",
    ],
  },
  salesman: {
    role: "salesman",
    label: "Sales Representative",
    shortLabel: "Salesman",
    tagline: "Front-Line Sales & Support",
    badgeClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    description:
      "Front-line sales and customer fulfillment: order processing, shipping labels/stickers, return inspects, stock lookup, and customer communication.",
    permissions: [
      "View Orders & Update Fulfillment Status",
      "Print Packaging Stickers & Invoices",
      "Inspect & Update Returns & Exchanges",
      "Lookup Product Catalog & Live Variant Availability",
      "Reply to Customer Inquiries & Log Notes",
      "Lookup Customer Delivery & Phone Information",
    ],
  },
  customer: {
    role: "customer",
    label: "Customer / Shopper",
    shortLabel: "Customer",
    tagline: "Verified Retail Shopper",
    badgeClass:
      "bg-stone-100 text-stone-700 dark:bg-neutral-800 dark:text-neutral-300 border-stone-200 dark:border-neutral-700",
    description:
      "Registered retail customer account with storefront ordering and personal parcel tracking privileges.",
    permissions: [
      "Browse Catalog & Place Storefront Orders",
      "Track Personal Order Receipts & Returns",
      "Manage Personal Delivery Address & Profile",
    ],
  },
};

export const getRoleConfig = (role?: string | null) => {
  const norm = normalizeRole(role);
  return ROLE_CONFIGS[norm] || ROLE_CONFIGS.customer;
};
