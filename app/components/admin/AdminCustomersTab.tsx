import React, { useState } from "react";
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
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import type { FirestoreUserProfile } from "~/firebase";
import {
  updateCustomerRoleInFirestore,
  deleteCustomerInFirestore,
} from "~/firebase";
import { Spinner } from "~/components/ui/spinner";

interface AdminCustomersTabProps {
  customers: FirestoreUserProfile[];
  onRefresh: () => void;
  currentAdminUid?: string;
}

export const AdminCustomersTab: React.FC<AdminCustomersTabProps> = ({
  customers,
  onRefresh,
  currentAdminUid,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "customer" | "admin">("all");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleToggleRole = async (customer: FirestoreUserProfile) => {
    const newRole = customer.role === "admin" ? "customer" : "admin";
    const confirmChange = window.confirm(
      `Change role of "${customer.displayName || customer.email}" to "${newRole.toUpperCase()}"?`
    );
    if (!confirmChange) return;

    setIsUpdating(customer.uid);
    try {
      await updateCustomerRoleInFirestore(customer.uid, newRole);
      toast.success(
        `User ${customer.displayName || customer.email} is now an ${newRole.toUpperCase()}!`
      );
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update user role.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteCustomer = async (uid: string, name: string) => {
    if (uid === currentAdminUid) {
      toast.error("You cannot delete your own active administrator account.");
      return;
    }

    const confirmDelete = window.confirm(`Delete customer account "${name}"?`);
    if (!confirmDelete) return;

    try {
      await deleteCustomerInFirestore(uid);
      toast.success(`Customer "${name}" removed from database.`);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to delete customer.");
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (roleFilter !== "all" && c.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.displayName?.toLowerCase().includes(q);
      const matchEmail = c.email?.toLowerCase().includes(q);
      const matchPhone = c.phoneNumber?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <UsersIcon className="size-6 text-orange-600" />
            <span>Customer Accounts &amp; Role Assignments</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            Manage verified shoppers, promote administrators, inspect phone contacts, and delivery addresses.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-neutral-200 transition cursor-pointer"
        >
          <ArrowPathIcon className="size-4" />
          <span>Refresh Customers</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200/80 dark:border-neutral-800">
        <div className="flex items-center gap-1.5">
          {[
            { key: "all", label: "All Users" },
            { key: "customer", label: "Customers Only" },
            { key: "admin", label: "Admins Only" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setRoleFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                roleFilter === tab.key
                  ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs"
                  : "bg-stone-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-neutral-300">
            <thead className="bg-stone-50 dark:bg-neutral-800/60 uppercase text-[10px] font-bold text-gray-500 dark:text-neutral-400 tracking-wider border-b border-gray-100 dark:border-neutral-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Delivery Region</th>
                <th className="py-3 px-4 text-right">Role Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No customers found matching filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.uid} className="hover:bg-stone-50/50 dark:hover:bg-neutral-800/30">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {c.photoURL ? (
                          <img
                            src={c.photoURL}
                            alt=""
                            className="size-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="size-8 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs">
                            {(c.displayName || c.email || "C").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {c.displayName || "Customer"}
                          </p>
                          <span className="text-[10px] text-gray-400 font-mono">
                            UID: {c.uid.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-gray-800 dark:text-neutral-200">
                      {c.email || "N/A"}
                    </td>

                    <td className="py-3.5 px-4 text-[11px]">
                      {c.phoneNumber || <span className="text-gray-400 italic">Not set</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.role === "admin"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        }`}
                      >
                        <ShieldCheckIcon className="size-3" />
                        <span>{c.role || "customer"}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-gray-500">
                      {c.deliveryAddress?.city ? (
                        <span>
                          {c.deliveryAddress.city}, {c.deliveryAddress.district}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">No saved address</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={isUpdating === c.uid}
                          onClick={() => handleToggleRole(c)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                            c.role === "admin"
                              ? "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
                              : "border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100"
                          }`}
                        >
                          {isUpdating === c.uid ? (
                            <Spinner className="size-3 text-purple-600 inline mr-1" />
                          ) : null}
                          <span>
                            {c.role === "admin" ? "Demote to Customer" : "Promote to Admin"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(c.uid, c.displayName || c.email)}
                          className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete user record"
                        >
                          <TrashIcon className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomersTab;
