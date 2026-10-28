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
  | "reviews"
  | "blogs"
  | "shipping"
  | "customers"
  | "staff"
  | "coupons"
  | "banners"
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
 * Validates whether currentUser has permission to view targetUser.
 * Rule:
 * - Admin can see all users (Admin, Manager, Salesman, Customer).
 * - Manager cannot see Admin, but can see own account and Salesman accounts.
 * - Salesman can only see his own account.
 */
export const canViewUser = (
  currentUserRole: string | null | undefined,
  targetUserRole: string | null | undefined,
  isSelf: boolean
): boolean => {
  const normCurrent = normalizeRole(currentUserRole);
  const normTarget = normalizeRole(targetUserRole);

  if (normCurrent === "admin") {
    // Admin can see everyone
    return true;
  }

  if (normCurrent === "manager") {
    // Manager cannot see admin
    if (normTarget === "admin") {
      return false;
    }
    // Manager can see his own account, salesman accounts, and retail shoppers
    if (isSelf || normTarget === "salesman" || normTarget === "customer") {
      return true;
    }
    return false;
  }

  if (normCurrent === "salesman") {
    // Salesman only see his own account (and retail shoppers if viewing customer directory)
    if (isSelf || normTarget === "customer") {
      return true;
    }
    return false;
  }

  return false;
};

/**
 * Validates whether currentUser has permission to edit targetUser's information.
 * Rule:
 * - Admin can edit manager, salesman, and admin info too (including own info).
 * - Manager cannot edit admin, but can edit his own and salesman accounts.
 * - Salesman can only edit his own account.
 */
export const canEditUser = (
  currentUserRole: string | null | undefined,
  targetUserRole: string | null | undefined,
  isSelf: boolean
): { canEdit: boolean; reason?: string } => {
  const normCurrent = normalizeRole(currentUserRole);
  const normTarget = normalizeRole(targetUserRole);

  if (normCurrent === "admin") {
    // Admin can edit manager, salesman, and admin info too (including self)
    return { canEdit: true };
  }

  if (normCurrent === "manager") {
    // Manager cannot edit admin
    if (normTarget === "admin") {
      return {
        canEdit: false,
        reason: "Managers cannot edit Administrator accounts.",
      };
    }
    // Manager can edit his own and salesman account
    if (isSelf || normTarget === "salesman") {
      return { canEdit: true };
    }
    return {
      canEdit: false,
      reason: "Managers can only edit their own account and Salesman accounts.",
    };
  }

  if (normCurrent === "salesman") {
    // Salesman can only edit his own account
    if (isSelf) {
      return { canEdit: true };
    }
    return {
      canEdit: false,
      reason: "Sales representatives can only edit their own account.",
    };
  }

  return { canEdit: false, reason: "Unauthorized to edit user accounts." };
};

/**
 * Validates whether currentUser has permission to change targetUser's password.
 * Rule:
 * - Admin can change password of manager, salesman, and admin info too (including own).
 * - Manager can change password for his own account only.
 * - Salesman can change password for his own account only.
 */
export const canChangeUserPassword = (
  currentUserRole: string | null | undefined,
  targetUserRole: string | null | undefined,
  isSelf: boolean
): { canChangePassword: boolean; reason?: string } => {
  const normCurrent = normalizeRole(currentUserRole);

  if (normCurrent === "admin") {
    // Admin can change password of manager, salesman, and admin info too
    return { canChangePassword: true };
  }

  if (normCurrent === "manager") {
    if (isSelf) {
      return { canChangePassword: true };
    }
    return {
      canChangePassword: false,
      reason: "Managers can only change password for their own account.",
    };
  }

  if (normCurrent === "salesman") {
    if (isSelf) {
      return { canChangePassword: true };
    }
    return {
      canChangePassword: false,
      reason: "Sales representatives can only change password for their own account.",
    };
  }

  return { canChangePassword: false, reason: "Unauthorized to change password." };
};

/**
 * Validates whether currentUser has permission to delete targetUser.
 * Rule:
 * - Admin can delete manager, salesman, and other admin info too, but CANNOT delete own account.
 * - Manager cannot delete admin (nor other staff).
 * - Salesman cannot delete accounts.
 */
export const canDeleteUser = (
  currentUserRole: string | null | undefined,
  targetUserRole: string | null | undefined,
  isSelf: boolean
): { canDelete: boolean; reason?: string } => {
  if (isSelf) {
    return { canDelete: false, reason: "You cannot delete your own active account." };
  }

  const normCurrent = normalizeRole(currentUserRole);
  if (normCurrent !== "admin") {
    return {
      canDelete: false,
      reason: "Only Administrators possess authority to delete user accounts.",
    };
  }

  // Admin can delete manager, salesman, and other admins too (own account prevented above)
  return { canDelete: true };
};

/**
 * Validates whether currentUser has permission to change (promote or demote) targetUser's role.
 * Only administrators have authority to alter user roles.
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
        "reviews",
        "blogs",
        "shipping",
        "customers",
        "staff",
        "coupons",
        "banners",
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
        "reviews",
        "blogs",
        "shipping",
        "customers",
        "staff",
        "coupons",
        "banners",
        "messages",
        "newsletters",
      ];
    case "salesman":
      return [
        "overview",
        "orders",
        "returns",
        "reviews",
        "inventory",
        "products",
        "messages",
        "customers",
        "staff",
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
      "Unrestricted administrative power: edit, delete, and change password of manager, salesman, and admin info (cannot delete own account). Full control over store settings, legal, and catalog.",
    permissions: [
      "Edit Info & Change Password of Manager, Salesman & Admin Accounts",
      "Delete Staff Accounts (Protected: Cannot delete own account)",
      "Promote, Demote & Alter Staff Roles",
      "Manage Store Settings, Branding & Payment Parameters",
      "Draft, Publish & Modify Store Legal Policies",
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
      "Operational leadership: author products, manage stock and orders. Can view & edit own and salesman accounts (cannot see, edit, or delete admin accounts).",
    permissions: [
      "View & Edit Own Account and Salesman Accounts (Cannot see/edit/delete Admin)",
      "Change Password for Own Account",
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
      "Front-line sales and customer fulfillment: order processing, shipping labels, stock lookup. Can only see and edit own account.",
    permissions: [
      "View & Edit Own Account Only (Cannot see or edit other accounts)",
      "Change Password for Own Account",
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
