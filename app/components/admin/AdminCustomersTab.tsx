import React, { useState, useMemo, useEffect } from "react";
import {
  UsersIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  PhoneIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  LockClosedIcon,
  UserPlusIcon,
  SparklesIcon,
  BriefcaseIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { toast } from "sonner";
import type { FirestoreUserProfile } from "~/firebase";
import {
  updateCustomerRoleInFirestore,
  deleteCustomerInFirestore,
  normalizeRole,
  isStaffRole,
  canDeleteUser,
  canChangeRole,
  getRoleConfig,
  ROLE_CONFIGS,
  type AppRole,
} from "~/firebase";
import { Spinner } from "~/components/ui/spinner";

interface AdminCustomersTabProps {
  customers: FirestoreUserProfile[];
  onRefresh: () => void;
  currentAdminUid?: string;
  currentUserRole?: string;
  initialSubView?: "customers" | "staff";
  onSubViewChange?: (subView: "customers" | "staff") => void;
}

export const AdminCustomersTab: React.FC<AdminCustomersTabProps> = ({
  customers,
  onRefresh,
  currentAdminUid,
  currentUserRole = "admin",
  initialSubView = "customers",
  onSubViewChange,
}) => {
  const isSuper = normalizeRole(currentUserRole) === "admin";
  const [subView, setSubView] = useState<"customers" | "staff">(initialSubView);
  const [searchQuery, setSearchQuery] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState<"all" | "admin" | "manager" | "salesman">("all");

  // Keep subView synchronized if initialSubView changes
  useEffect(() => {
    if (initialSubView) {
      if (!isSuper && initialSubView === "staff") {
        setSubView("customers");
      } else {
        setSubView(initialSubView);
      }
    }
  }, [initialSubView, isSuper]);

  const handleSwitchSubView = (view: "customers" | "staff") => {
    setSubView(view);
    setSearchQuery("");
    if (onSubViewChange) {
      onSubViewChange(view);
    }
  };

  // Delete Modal State
  const [customerToDelete, setCustomerToDelete] = useState<FirestoreUserProfile | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  // Role Assignment / Promote / Demote Modal State
  const [userToChangeRole, setUserToChangeRole] = useState<FirestoreUserProfile | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<AppRole>("manager");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Separate Shopper Customers and Staff / App Users
  const shopperCustomers = useMemo(
    () => customers.filter((c) => !isStaffRole(c.role)),
    [customers]
  );

  const staffMembers = useMemo(
    () => customers.filter((c) => isStaffRole(c.role)),
    [customers]
  );

  // Staff Counts
  const adminCount = useMemo(
    () => staffMembers.filter((s) => normalizeRole(s.role) === "admin").length,
    [staffMembers]
  );
  const managerCount = useMemo(
    () => staffMembers.filter((s) => normalizeRole(s.role) === "manager").length,
    [staffMembers]
  );
  const salesmanCount = useMemo(
    () => staffMembers.filter((s) => normalizeRole(s.role) === "salesman").length,
    [staffMembers]
  );

  // Filtered Shoppers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return shopperCustomers;
    const q = searchQuery.toLowerCase();
    return shopperCustomers.filter(
      (c) =>
        c.displayName?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phoneNumber?.toLowerCase().includes(q) ||
        c.deliveryAddress?.city?.toLowerCase().includes(q) ||
        c.deliveryAddress?.district?.toLowerCase().includes(q)
    );
  }, [shopperCustomers, searchQuery]);

  // Filtered Staff
  const filteredStaff = useMemo(() => {
    return staffMembers.filter((s) => {
      const norm = normalizeRole(s.role);
      if (staffRoleFilter !== "all" && norm !== staffRoleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.displayName?.toLowerCase().includes(q);
        const matchEmail = s.email?.toLowerCase().includes(q);
        const matchPhone = s.phoneNumber?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }
      return true;
    });
  }, [staffMembers, staffRoleFilter, searchQuery]);

  // Open Delete Modal with safety guards
  const handleOpenDelete = (targetUser: FirestoreUserProfile) => {
    const isSelf = targetUser.uid === currentAdminUid;
    const check = canDeleteUser(currentUserRole, targetUser.role, isSelf);
    if (!check.canDelete) {
      toast.error(check.reason || "Action not permitted.");
      return;
    }
    setCustomerToDelete(targetUser);
  };

  // Confirm Delete Action from Modal Alert
  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;

    // Double check guardrail: "no one can delete admin"
    if (normalizeRole(customerToDelete.role) === "admin") {
      toast.error("Administrators are protected and cannot be deleted.");
      setCustomerToDelete(null);
      return;
    }

    setIsDeletingCustomer(true);
    try {
      await deleteCustomerInFirestore(customerToDelete.uid);
      const isStaff = isStaffRole(customerToDelete.role);
      toast.success(
        `${isStaff ? "Staff member" : "Customer"} "${
          customerToDelete.displayName || customerToDelete.email
        }" removed successfully.`
      );
      setCustomerToDelete(null);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to delete account record.");
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  // Open Role Assignment Modal
  const handleOpenRoleModal = (targetUser: FirestoreUserProfile, defaultRole?: AppRole) => {
    const isSelf = targetUser.uid === currentAdminUid;
    const check = canChangeRole(currentUserRole, targetUser.role, isSelf);
    if (!check.canChange) {
      toast.error(check.reason || "Only Administrators can modify user roles.");
      return;
    }

    setUserToChangeRole(targetUser);
    const currentNorm = normalizeRole(targetUser.role);
    setSelectedNewRole(defaultRole || (currentNorm === "customer" ? "manager" : currentNorm));
  };

  // Confirm Role Assignment (Promote or Demote)
  const handleConfirmRoleChange = async () => {
    if (!userToChangeRole) return;

    if (!isSuper) {
      toast.error("Only Administrators possess authority to promote or demote roles.");
      return;
    }

    if (userToChangeRole.uid === currentAdminUid && selectedNewRole !== "admin") {
      toast.error("You cannot demote your own active administrator account.");
      return;
    }

    setIsUpdatingRole(true);
    try {
      await updateCustomerRoleInFirestore(userToChangeRole.uid, selectedNewRole);
      const config = getRoleConfig(selectedNewRole);
      toast.success(
        `Role for "${userToChangeRole.displayName || userToChangeRole.email}" updated to ${config.label}.`
      );
      setUserToChangeRole(null);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update role assignment.");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Segmented Tab Switcher */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <UsersIcon className="size-6 text-orange-600" />
              <span>User Directory &amp; Role Access Control</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
              Strictly separated databases for verified storefront shoppers and internal administrative staff.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-neutral-200 transition cursor-pointer self-start sm:self-auto"
          >
            <ArrowPathIcon className="size-4" />
            <span>Refresh Directory</span>
          </button>
        </div>

        {/* Dedicated View Switcher */}
        <div className="flex items-center gap-2 border-t border-stone-100 dark:border-neutral-800 pt-4">
          <button
            type="button"
            onClick={() => handleSwitchSubView("customers")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
              subView === "customers"
                ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-sm"
                : "bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-neutral-300 hover:bg-stone-200/80 dark:hover:bg-neutral-700/80"
            }`}
          >
            <UsersIcon className="size-4" />
            <span>Shoppers &amp; Customers</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                subView === "customers"
                  ? "bg-stone-700 dark:bg-stone-200 text-white dark:text-stone-900"
                  : "bg-stone-200 dark:bg-neutral-700 text-stone-700 dark:text-neutral-300"
              }`}
            >
              {shopperCustomers.length}
            </span>
          </button>

          {isSuper && (
            <button
              type="button"
              onClick={() => handleSwitchSubView("staff")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                subView === "staff"
                  ? "bg-orange-600 text-white shadow-sm"
                  : "bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-neutral-300 hover:bg-stone-200/80 dark:hover:bg-neutral-700/80"
              }`}
            >
              <ShieldCheckIcon className="size-4" />
              <span>Staff &amp; App Users</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  subView === "staff"
                    ? "bg-orange-700 text-white"
                    : "bg-stone-200 dark:bg-neutral-700 text-stone-700 dark:text-neutral-300"
                }`}
              >
                {staffMembers.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: SHOPPERS & CUSTOMERS */}
      {subView === "customers" && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-stone-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
                  Total Registered Shoppers
                </p>
                <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                  {shopperCustomers.length}
                </p>
              </div>
              <div className="size-11 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center">
                <UsersIcon className="size-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-stone-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
                  Verified Contact Numbers
                </p>
                <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                  {shopperCustomers.filter((c) => Boolean(c.phoneNumber)).length}
                </p>
              </div>
              <div className="size-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <PhoneIcon className="size-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-stone-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
                  Saved Delivery Addresses
                </p>
                <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                  {
                    shopperCustomers.filter((c) => Boolean(c.deliveryAddress?.city))
                      .length
                  }
                </p>
              </div>
              <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <MapPinIcon className="size-5" />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200/80 dark:border-neutral-800 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers by name, email, phone, city..."
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-neutral-400 hidden sm:inline">
              Showing {filteredCustomers.length} of {shopperCustomers.length} customers
            </span>
          </div>

          {/* Shoppers Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600 dark:text-neutral-300">
                <thead className="bg-stone-50 dark:bg-neutral-800/60 uppercase text-[10px] font-bold text-gray-500 dark:text-neutral-400 tracking-wider border-b border-gray-100 dark:border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">Shopper</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Primary Delivery Address</th>
                    <th className="py-3 px-4">Account Type</th>
                    {isSuper && <th className="py-3 px-4 text-right">Admin Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={isSuper ? 6 : 5} className="py-14 text-center text-gray-400 space-y-2">
                        <UsersIcon className="size-8 mx-auto text-stone-300 dark:text-neutral-600" />
                        <p>No shopper accounts found matching your query.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => (
                      <tr key={c.uid} className="hover:bg-stone-50/50 dark:hover:bg-neutral-800/30 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {c.photoURL ? (
                              <img
                                src={c.photoURL}
                                alt=""
                                className="size-8 rounded-full object-cover ring-1 ring-stone-200 dark:ring-neutral-700"
                              />
                            ) : (
                              <div className="size-8 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                                {(c.displayName || c.email || "C").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 dark:text-white truncate">
                                {c.displayName || "Customer"}
                              </p>
                              <span className="text-[10px] text-gray-400 font-mono">
                                UID: {c.uid.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-gray-800 dark:text-neutral-200">
                          {c.email ? (
                            <a
                              href={`mailto:${c.email}`}
                              className="hover:underline hover:text-orange-600"
                            >
                              {c.email}
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">No email</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[11px]">
                          {c.phoneNumber ? (
                            <a
                              href={`tel:${c.phoneNumber}`}
                              className="font-mono text-gray-700 dark:text-neutral-300 hover:text-orange-600"
                            >
                              {c.phoneNumber}
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">Unregistered</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[11px] text-gray-500">
                          {c.deliveryAddress?.city ? (
                            <span>
                              {c.deliveryAddress.street ? `${c.deliveryAddress.street}, ` : ""}
                              {c.deliveryAddress.city}, {c.deliveryAddress.district}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">No address on file</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 text-stone-700 dark:bg-neutral-800 dark:text-neutral-300 border border-stone-200 dark:border-neutral-700">
                            Shopper
                          </span>
                        </td>

                        {isSuper && (
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenRoleModal(c, "manager")}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-orange-200 dark:border-orange-900/60 text-orange-600 dark:text-orange-400 bg-orange-50/60 dark:bg-orange-950/40 hover:bg-orange-100 transition cursor-pointer flex items-center gap-1"
                                title="Promote customer to Staff (Manager, Salesman, or Admin)"
                              >
                                <UserPlusIcon className="size-3.5" />
                                <span>Promote to Staff</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenDelete(c)}
                                className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 transition cursor-pointer"
                                title="Delete shopper account"
                              >
                                <TrashIcon className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: STAFF & APP USERS */}
      {subView === "staff" && (
        <div className="space-y-6">
          {/* Roles Hierarchy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Admin Card */}
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-purple-200/80 dark:border-purple-900/50 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  👑 Administrator
                </span>
                <span className="text-xl font-black text-purple-700 dark:text-purple-300 font-mono">
                  {adminCount}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed">
                Super-administrator with unrestricted privileges across store settings, legal policies, staff roles, and all eCommerce operations.
              </p>
              <div className="pt-2 border-t border-purple-100 dark:border-purple-950 text-[11px] text-purple-900 dark:text-purple-300 font-semibold space-y-1">
                <p>• Only Admin can promote/demote staff</p>
                <p>• Protected: No one can delete an admin</p>
              </div>
            </div>

            {/* Manager Card */}
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-blue-200/80 dark:border-blue-900/50 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  💼 Operations Manager
                </span>
                <span className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono">
                  {managerCount}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed">
                Operational authority over catalog merchandising, stock tracking, order fulfillment, shipping couriers, marketing coupons, and journal.
              </p>
              <div className="pt-2 border-t border-blue-100 dark:border-blue-950 text-[11px] text-blue-900 dark:text-blue-300 font-semibold space-y-1">
                <p>• Full catalog &amp; logistics authority</p>
                <p>• Restricted from settings &amp; staff roles</p>
              </div>
            </div>

            {/* Salesman Card */}
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  🏷️ Sales Representative
                </span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                  {salesmanCount}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed">
                Front-line sales and fulfillment: processing orders, printing packaging stickers, handling return tickets, stock inquiries, and customer chat.
              </p>
              <div className="pt-2 border-t border-emerald-100 dark:border-emerald-950 text-[11px] text-emerald-900 dark:text-emerald-300 font-semibold space-y-1">
                <p>• Orders, stickers &amp; returns support</p>
                <p>• Live variant &amp; stock lookup</p>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200/80 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { key: "all", label: `All Staff (${staffMembers.length})` },
                { key: "admin", label: `Admins (${adminCount})` },
                { key: "manager", label: `Managers (${managerCount})` },
                { key: "salesman", label: `Salesmen (${salesmanCount})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStaffRoleFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    staffRoleFilter === tab.key
                      ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs"
                      : "bg-stone-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-stone-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff members..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
              />
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600 dark:text-neutral-300">
                <thead className="bg-stone-50 dark:bg-neutral-800/60 uppercase text-[10px] font-bold text-gray-500 dark:text-neutral-400 tracking-wider border-b border-gray-100 dark:border-neutral-800">
                  <tr>
                    <th className="py-3.5 px-4">Staff Member</th>
                    <th className="py-3.5 px-4">Contact Email</th>
                    <th className="py-3.5 px-4">Assigned App Role</th>
                    <th className="py-3.5 px-4">Standard eCommerce Access</th>
                    <th className="py-3.5 px-4 text-right">Role Management &amp; Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-14 text-center text-gray-400 space-y-2">
                        <ShieldCheckIcon className="size-8 mx-auto text-stone-300 dark:text-neutral-600" />
                        <p>No staff accounts found matching filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff) => {
                      const norm = normalizeRole(staff.role);
                      const config = getRoleConfig(norm);
                      const isTargetAdmin = norm === "admin";
                      const isCurrentSelf = staff.uid === currentAdminUid;

                      return (
                        <tr key={staff.uid} className="hover:bg-stone-50/50 dark:hover:bg-neutral-800/30 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              {staff.photoURL ? (
                                <img
                                  src={staff.photoURL}
                                  alt=""
                                  className="size-9 rounded-full object-cover ring-2 ring-stone-200 dark:ring-neutral-700"
                                />
                              ) : (
                                <div className="size-9 rounded-full bg-gradient-to-tr from-stone-800 to-stone-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                  {(staff.displayName || staff.email || "S").charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                                  <span>{staff.displayName || "Staff Member"}</span>
                                  {isCurrentSelf && (
                                    <span className="px-1.5 py-0.2 rounded-sm bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 text-[9px] font-mono font-bold">
                                      YOU
                                    </span>
                                  )}
                                </p>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  UID: {staff.uid.slice(0, 10)}...
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px] text-gray-800 dark:text-neutral-200">
                            {staff.email ? (
                              <a
                                href={`mailto:${staff.email}`}
                                className="hover:underline hover:text-orange-600"
                              >
                                {staff.email}
                              </a>
                            ) : (
                              <span className="text-gray-400 italic">No email</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${config.badgeClass}`}
                            >
                              <ShieldCheckIcon className="size-3.5" />
                              <span>{config.label}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="text-xs text-gray-600 dark:text-neutral-300 font-medium">
                              {config.tagline}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-neutral-500 truncate max-w-xs mt-0.5">
                              {config.permissions.slice(0, 2).join(" • ")}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Change / Promote / Demote Role Button (Admin Only) */}
                              {isSuper ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRoleModal(staff)}
                                  className="px-3 py-1 rounded-lg text-[11px] font-bold border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-stone-800 dark:text-neutral-200 hover:bg-stone-50 dark:hover:bg-neutral-700 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                  <span>Change Role</span>
                                </button>
                              ) : (
                                <span className="text-[10px] font-mono text-gray-400 italic">
                                  Protected View
                                </span>
                              )}

                              {/* Delete Staff Member: "no one can delete admin. admin can delete or demote all roles" */}
                              {isTargetAdmin ? (
                                <div
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-neutral-800/80 border border-stone-200 dark:border-neutral-700 text-stone-400 text-[10px] font-bold select-none"
                                  title="Administrators are protected by system security rules and cannot be deleted."
                                >
                                  <LockClosedIcon className="size-3 text-stone-400" />
                                  <span>Protected</span>
                                </div>
                              ) : isSuper ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDelete(staff)}
                                  className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 transition cursor-pointer"
                                  title={`Delete ${config.label} account`}
                                >
                                  <TrashIcon className="size-3.5" />
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Role Assignment / Promotion / Demotion Modal */}
      <Transition appear show={Boolean(userToChangeRole)} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50 font-sans"
          onClose={() => {
            if (!isUpdatingRole) setUserToChangeRole(null);
          }}
        >
          <TransitionChild
            as={React.Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
              <TransitionChild
                as={React.Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-8 text-left shadow-2xl transition-all border border-stone-200/80 dark:border-neutral-800 space-y-5 text-gray-900 dark:text-white">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                        <BriefcaseIcon className="size-6" />
                      </div>
                      <div>
                        <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                          Role Assignment &amp; Access Rights
                        </DialogTitle>
                        <p className="text-xs text-gray-500 dark:text-neutral-400">
                          Promote or demote account privileges across store administration.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isUpdatingRole}
                      onClick={() => setUserToChangeRole(null)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>

                  {/* Target User Card */}
                  {userToChangeRole && (
                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-800/60 border border-stone-200/80 dark:border-neutral-700/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-stone-200 dark:bg-neutral-700 text-stone-700 dark:text-neutral-200 flex items-center justify-center font-bold text-sm">
                          {(userToChangeRole.displayName || userToChangeRole.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {userToChangeRole.displayName || "User"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-neutral-400 font-mono">
                            {userToChangeRole.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">
                          Current Role
                        </span>
                        <span className="text-xs font-bold font-mono uppercase text-orange-600 dark:text-orange-400">
                          {normalizeRole(userToChangeRole.role)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Role Selection Grid */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300">
                      Select New App Role:
                    </label>

                    <div className="grid grid-cols-1 gap-2.5">
                      {(["admin", "manager", "salesman", "customer"] as AppRole[]).map((r) => {
                        const conf = ROLE_CONFIGS[r];
                        const isSelected = selectedNewRole === r;

                        return (
                          <div
                            key={r}
                            onClick={() => setSelectedNewRole(r)}
                            className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                              isSelected
                                ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 ring-2 ring-orange-500/20"
                                : "border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-stone-300 dark:hover:border-neutral-700"
                            }`}
                          >
                            <div
                              className={`size-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                                isSelected
                                  ? "border-orange-600 bg-orange-600 text-white"
                                  : "border-stone-300 dark:border-neutral-600"
                              }`}
                            >
                              {isSelected && <CheckIcon className="size-3.5" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-gray-900 dark:text-white">
                                  {conf.label}
                                </span>
                                <span className={`px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase border ${conf.badgeClass}`}>
                                  {conf.shortLabel}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                                {conf.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-neutral-800">
                    <button
                      type="button"
                      disabled={isUpdatingRole}
                      onClick={() => setUserToChangeRole(null)}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-semibold text-xs hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingRole}
                      onClick={handleConfirmRoleChange}
                      className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isUpdatingRole ? (
                        <>
                          <Spinner className="size-4 text-white" />
                          <span>Updating Role...</span>
                        </>
                      ) : (
                        <span>Confirm Role Update</span>
                      )}
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* MODAL 2: Delete User Confirmation Modal Alert */}
      <Transition appear show={Boolean(customerToDelete)} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50 font-sans"
          onClose={() => {
            if (!isDeletingCustomer) setCustomerToDelete(null);
          }}
        >
          <TransitionChild
            as={React.Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
              <TransitionChild
                as={React.Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-8 text-left shadow-2xl transition-all border border-stone-200/80 dark:border-neutral-800 space-y-5 text-gray-900 dark:text-white">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="size-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 ring-4 ring-rose-50 dark:ring-rose-950/20">
                        <ExclamationTriangleIcon className="size-6" />
                      </div>
                      <div>
                        <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                          Delete Account Record
                        </DialogTitle>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                          This action permanently deletes this record from Cloud Firestore.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isDeletingCustomer}
                      onClick={() => setCustomerToDelete(null)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>

                  {/* Customer Preview */}
                  {customerToDelete && (
                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-800/60 border border-stone-200/80 dark:border-neutral-700/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCircleIcon className="size-5 text-gray-400" />
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                            {customerToDelete.displayName || "User"}
                          </h4>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-200 dark:bg-neutral-700 text-stone-700 dark:text-neutral-300">
                          {customerToDelete.role || "customer"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-neutral-300 font-mono">
                        {customerToDelete.email}
                      </p>
                      {customerToDelete.phoneNumber && (
                        <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                          Phone: {customerToDelete.phoneNumber}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Danger Notice */}
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-300 leading-relaxed">
                    Are you sure you want to delete account{" "}
                    <strong className="font-bold">
                      &quot;{customerToDelete?.displayName || customerToDelete?.email}&quot;
                    </strong>? Their profile, saved addresses, and all access privileges will be permanently erased.
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-neutral-800">
                    <button
                      type="button"
                      disabled={isDeletingCustomer}
                      onClick={() => setCustomerToDelete(null)}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-semibold text-xs hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingCustomer}
                      onClick={handleConfirmDelete}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isDeletingCustomer ? (
                        <>
                          <Spinner className="size-3.5 text-white" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <TrashIcon className="size-3.5" />
                          <span>Delete Account</span>
                        </>
                      )}
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default AdminCustomersTab;
