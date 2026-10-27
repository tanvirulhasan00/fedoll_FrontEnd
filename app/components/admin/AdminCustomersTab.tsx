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
  PencilSquareIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { toast } from "sonner";
import { useAppDispatch } from "~/redux/hooks/hook";
import { updateUserProfile } from "~/redux/features/auth/authSlice";
import type { FirestoreUserProfile } from "~/firebase";
import {
  updateCustomerRoleInFirestore,
  deleteCustomerInFirestore,
  updateUserProfileInFirestore,
  changeCurrentUserPassword,
  adminSetUserPasswordOrReset,
  adminCreateStaffAccount,
  normalizeRole,
  isStaffRole,
  canDeleteUser,
  canEditUser,
  canChangeUserPassword,
  canViewUser,
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
  const dispatch = useAppDispatch();
  const normCurrentRole = normalizeRole(currentUserRole);
  const isSuper = normCurrentRole === "admin";
  const isManager = normCurrentRole === "manager";
  const isSalesman = normCurrentRole === "salesman";

  const [subView, setSubView] = useState<"customers" | "staff">(initialSubView);
  const [searchQuery, setSearchQuery] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState<
    "all" | "admin" | "manager" | "salesman"
  >("all");

  // Keep subView synchronized if initialSubView changes
  useEffect(() => {
    if (initialSubView) {
      setSubView(initialSubView);
    }
  }, [initialSubView]);

  const handleSwitchSubView = (view: "customers" | "staff") => {
    setSubView(view);
    setSearchQuery("");
    if (onSubViewChange) {
      onSubViewChange(view);
    }
  };

  // --- Password Visibility in Staff Table (For Admin) ---
  const [revealedPasswords, setRevealedPasswords] = useState<
    Record<string, boolean>
  >({});
  const [copiedStaffPasswordUid, setCopiedStaffPasswordUid] = useState<
    string | null
  >(null);

  const togglePasswordReveal = (uid: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [uid]: !prev[uid],
    }));
  };

  const handleCopyStaffPassword = (uid: string, pwd?: string) => {
    if (!pwd) {
      toast.error("No password on file for this account.");
      return;
    }
    navigator.clipboard.writeText(pwd);
    setCopiedStaffPasswordUid(uid);
    toast.success("Password copied to clipboard!");
    setTimeout(() => setCopiedStaffPasswordUid(null), 2000);
  };

  // --- Modals State ---

  // 1. Create Staff Account Modal State (Admin Only)
  const [isCreateStaffOpen, setIsCreateStaffOpen] = useState(false);
  const [createDisplayName, setCreateDisplayName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<"manager" | "salesman" | "admin">(
    "manager"
  );
  const [createPhone, setCreatePhone] = useState("");
  const [createStreet, setCreateStreet] = useState("");
  const [createCity, setCreateCity] = useState("Dhaka");
  const [createDistrict, setCreateDistrict] = useState("Dhaka");
  const [showCreatePassword, setShowCreatePassword] = useState(true);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [createdStaffResult, setCreatedStaffResult] = useState<{
    email: string;
    password: string;
    displayName: string;
    role: string;
  } | null>(null);

  // 2. Delete Modal State
  const [customerToDelete, setCustomerToDelete] =
    useState<FirestoreUserProfile | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  // 3. Role Assignment (Promote / Demote) Modal State (Admin Only)
  const [userToChangeRole, setUserToChangeRole] =
    useState<FirestoreUserProfile | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<AppRole>("manager");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // 4. Edit User Info Modal State
  const [userToEdit, setUserToEdit] = useState<FirestoreUserProfile | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editPhotoURL, setEditPhotoURL] = useState("");
  const [editStreet, setEditStreet] = useState("");
  const [editCity, setEditCity] = useState("Dhaka");
  const [editDistrict, setEditDistrict] = useState("Dhaka");
  const [editPostalCode, setEditPostalCode] = useState("");
  const [editRole, setEditRole] = useState<AppRole>("customer");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // 5. Change Password Modal State
  const [userToChangePassword, setUserToChangePassword] =
    useState<FirestoreUserProfile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sendPasswordResetEmailOption, setSendPasswordResetEmailOption] =
    useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [tempPasswordCopied, setTempPasswordCopied] = useState(false);

  // --- Dataset Segmentation & Filtering ---

  // Separate Shopper Customers and Staff / App Users
  const shopperCustomers = useMemo(
    () => customers.filter((c) => !isStaffRole(c.role)),
    [customers]
  );

  const rawStaffMembers = useMemo(
    () => customers.filter((c) => isStaffRole(c.role)),
    [customers]
  );

  // Filtered by RBAC Visibility:
  // - Admin sees all staff
  // - Manager cannot see admin (normTarget !== "admin"), sees self and salesmen
  // - Salesman sees only himself
  const visibleStaffMembers = useMemo(() => {
    return rawStaffMembers.filter((s) => {
      const isSelf = s.uid === currentAdminUid;
      return canViewUser(currentUserRole, s.role, isSelf);
    });
  }, [rawStaffMembers, currentUserRole, currentAdminUid]);

  // Staff Counts (based on visible accounts)
  const adminCount = useMemo(
    () =>
      visibleStaffMembers.filter((s) => normalizeRole(s.role) === "admin")
        .length,
    [visibleStaffMembers]
  );
  const managerCount = useMemo(
    () =>
      visibleStaffMembers.filter((s) => normalizeRole(s.role) === "manager")
        .length,
    [visibleStaffMembers]
  );
  const salesmanCount = useMemo(
    () =>
      visibleStaffMembers.filter((s) => normalizeRole(s.role) === "salesman")
        .length,
    [visibleStaffMembers]
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

  // Filtered Staff (applied role filter + search query)
  const filteredStaff = useMemo(() => {
    return visibleStaffMembers.filter((s) => {
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
  }, [visibleStaffMembers, staffRoleFilter, searchQuery]);

  // Dynamic filter tabs depending on role
  const staffRoleFilterTabs = useMemo(() => {
    if (isSuper) {
      return [
        { key: "all", label: `All Staff (${visibleStaffMembers.length})` },
        { key: "admin", label: `Admins (${adminCount})` },
        { key: "manager", label: `Managers (${managerCount})` },
        { key: "salesman", label: `Salesmen (${salesmanCount})` },
      ];
    }
    if (isManager) {
      return [
        { key: "all", label: `All Staff (${visibleStaffMembers.length})` },
        { key: "manager", label: `My Account (${managerCount})` },
        { key: "salesman", label: `Sales Representatives (${salesmanCount})` },
      ];
    }
    return [{ key: "all", label: `My Staff Profile` }];
  }, [
    isSuper,
    isManager,
    visibleStaffMembers.length,
    adminCount,
    managerCount,
    salesmanCount,
  ]);

  // --- Handlers: Create Staff Account ---

  const handleOpenCreateStaffModal = () => {
    setIsCreateStaffOpen(true);
    setCreateDisplayName("");
    setCreateEmail("");
    setCreatePassword("");
    setCreateRole("manager");
    setCreatePhone("");
    setCreateStreet("");
    setCreateCity("Dhaka");
    setCreateDistrict("Dhaka");
    setShowCreatePassword(true);
    setCreatedStaffResult(null);
  };

  const handleGenerateCreateStaffPassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreatePassword(pwd);
    setShowCreatePassword(true);
    toast.success("Generated strong random password!");
  };

  const handleConfirmCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuper) {
      toast.error("Only Administrators possess authority to create staff accounts.");
      return;
    }

    if (!createDisplayName.trim()) {
      toast.error("Please provide staff member's full name.");
      return;
    }

    if (!createEmail.trim()) {
      toast.error("Please provide a valid email address.");
      return;
    }

    if (createPassword.length < 6) {
      toast.error("Password must contain at least 6 characters.");
      return;
    }

    setIsCreatingStaff(true);
    try {
      await adminCreateStaffAccount({
        email: createEmail.trim(),
        password: createPassword.trim(),
        displayName: createDisplayName.trim(),
        role: createRole,
        phoneNumber: createPhone.trim(),
        deliveryAddress: {
          street: createStreet.trim(),
          city: createCity.trim(),
          district: createDistrict.trim(),
        },
      });

      setCreatedStaffResult({
        email: createEmail.trim(),
        password: createPassword.trim(),
        displayName: createDisplayName.trim(),
        role: createRole,
      });

      const config = getRoleConfig(createRole);
      toast.success(
        `Staff account created for "${createDisplayName.trim()}" as ${config.label}!`
      );
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message?.includes("email-already-in-use")) {
        toast.error("An account with this email already exists.");
      } else {
        toast.error(error.message || "Failed to create staff account.");
      }
    } finally {
      setIsCreatingStaff(false);
    }
  };

  // --- Handlers: Edit Account Info ---

  const handleOpenEditModal = (targetUser: FirestoreUserProfile) => {
    const isSelf = targetUser.uid === currentAdminUid;
    const check = canEditUser(currentUserRole, targetUser.role, isSelf);
    if (!check.canEdit) {
      toast.error(check.reason || "Action not permitted.");
      return;
    }

    setUserToEdit(targetUser);
    setEditDisplayName(targetUser.displayName || "");
    setEditPhoneNumber(targetUser.phoneNumber || "");
    setEditPhotoURL(targetUser.photoURL || "");
    setEditStreet(targetUser.deliveryAddress?.street || "");
    setEditCity(targetUser.deliveryAddress?.city || "Dhaka");
    setEditDistrict(targetUser.deliveryAddress?.district || "Dhaka");
    setEditPostalCode(targetUser.deliveryAddress?.postalCode || "");
    setEditRole(normalizeRole(targetUser.role));
  };

  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    if (!editDisplayName.trim()) {
      toast.error("Please enter a valid display name.");
      return;
    }

    const isSelf = userToEdit.uid === currentAdminUid;
    const check = canEditUser(currentUserRole, userToEdit.role, isSelf);
    if (!check.canEdit) {
      toast.error(check.reason || "Action not permitted.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const updates: Partial<FirestoreUserProfile> = {
        displayName: editDisplayName.trim(),
        phoneNumber: editPhoneNumber.trim(),
        photoURL: editPhotoURL.trim(),
        deliveryAddress: {
          street: editStreet.trim(),
          city: editCity.trim(),
          district: editDistrict.trim(),
          postalCode: editPostalCode.trim(),
        },
      };

      // Only administrators possess power to alter user roles
      if (isSuper) {
        if (isSelf && editRole !== "admin") {
          toast.error("You cannot demote your own active administrator role.");
          setIsSavingEdit(false);
          return;
        }
        updates.role = editRole;
      }

      await updateUserProfileInFirestore(userToEdit.uid, updates);

      // If user edited their own profile, sync local Redux state
      if (isSelf) {
        dispatch(
          updateUserProfile({
            displayName: updates.displayName,
            phoneNumber: updates.phoneNumber,
            photoURL: updates.photoURL,
            deliveryAddress: updates.deliveryAddress,
            ...(updates.role ? { role: updates.role } : {}),
          })
        );
      }

      toast.success(
        `Account information for "${editDisplayName.trim()}" updated successfully!`
      );
      setUserToEdit(null);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update profile information.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // --- Handlers: Change Password ---

  const handleOpenPasswordModal = (targetUser: FirestoreUserProfile) => {
    const isSelf = targetUser.uid === currentAdminUid;
    const check = canChangeUserPassword(currentUserRole, targetUser.role, isSelf);
    if (!check.canChangePassword) {
      toast.error(check.reason || "Action not permitted.");
      return;
    }

    setUserToChangePassword(targetUser);
    setNewPassword("");
    setConfirmPassword("");
    setSendPasswordResetEmailOption(true);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setTempPasswordCopied(false);
  };

  const handleGenerateStrongPassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setConfirmPassword(pwd);
    setShowPassword(true);
    setShowConfirmPassword(true);
    toast.success("Generated random secure password!");
  };

  const handleCopyGeneratedPassword = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setTempPasswordCopied(true);
    toast.success("Password copied to clipboard!");
    setTimeout(() => setTempPasswordCopied(false), 2000);
  };

  const handleConfirmChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToChangePassword) return;

    const isSelf = userToChangePassword.uid === currentAdminUid;
    const check = canChangeUserPassword(
      currentUserRole,
      userToChangePassword.role,
      isSelf
    );
    if (!check.canChangePassword) {
      toast.error(check.reason || "Action not permitted.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must contain at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Password confirmation does not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      if (isSelf) {
        // Live Firebase Auth update for currently logged-in user
        await changeCurrentUserPassword(newPassword);
        toast.success("Your password has been changed successfully!");
      } else {
        // Admin updating password / sending reset email for another staff member
        const res = await adminSetUserPasswordOrReset(
          userToChangePassword.uid,
          userToChangePassword.email,
          newPassword,
          sendPasswordResetEmailOption
        );

        if (res.emailSent && res.passwordSaved) {
          toast.success(
            `Temporary password assigned & reset instructions sent to "${userToChangePassword.email}".`
          );
        } else if (res.emailSent) {
          toast.success(
            `Password reset email sent to "${userToChangePassword.email}".`
          );
        } else {
          toast.success(
            `Password updated for "${
              userToChangePassword.displayName || userToChangePassword.email
            }".`
          );
        }
      }

      setUserToChangePassword(null);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message?.includes("requires-recent-login")) {
        toast.error(
          "For security reasons, please log out and log in again before changing your password."
        );
      } else {
        toast.error(error.message || "Failed to update password.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleQuickSendPasswordReset = async () => {
    if (!userToChangePassword?.email) {
      toast.error("Target user does not have an active email address.");
      return;
    }
    setIsChangingPassword(true);
    try {
      await adminSetUserPasswordOrReset(
        userToChangePassword.uid,
        userToChangePassword.email,
        undefined,
        true
      );
      toast.success(
        `Official password reset link sent to "${userToChangePassword.email}".`
      );
      setUserToChangePassword(null);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to send password reset email.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // --- Handlers: Delete User Account ---

  const handleOpenDelete = (targetUser: FirestoreUserProfile) => {
    const isSelf = targetUser.uid === currentAdminUid;
    const check = canDeleteUser(currentUserRole, targetUser.role, isSelf);
    if (!check.canDelete) {
      toast.error(check.reason || "Action not permitted.");
      return;
    }
    setCustomerToDelete(targetUser);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;

    // Strict guardrail: Cannot delete own account
    if (customerToDelete.uid === currentAdminUid) {
      toast.error("You cannot delete your own active account.");
      setCustomerToDelete(null);
      return;
    }

    if (!isSuper) {
      toast.error("Only Administrators possess authority to delete user accounts.");
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
        }" deleted successfully.`
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

  // --- Handlers: Role Promotion / Demotion (Admin Only) ---

  const handleOpenRoleModal = (
    targetUser: FirestoreUserProfile,
    defaultRole?: AppRole
  ) => {
    const isSelf = targetUser.uid === currentAdminUid;
    const check = canChangeRole(currentUserRole, targetUser.role, isSelf);
    if (!check.canChange) {
      toast.error(check.reason || "Only Administrators can modify user roles.");
      return;
    }

    setUserToChangeRole(targetUser);
    const currentNorm = normalizeRole(targetUser.role);
    setSelectedNewRole(
      defaultRole || (currentNorm === "customer" ? "manager" : currentNorm)
    );
  };

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
        `Role for "${
          userToChangeRole.displayName || userToChangeRole.email
        }" updated to ${config.label}.`
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
              Strictly segmented management for verified storefront shoppers and internal administrative staff.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Create Staff Account Button (Admin Only) */}
            {isSuper && (
              <button
                type="button"
                onClick={handleOpenCreateStaffModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <UserPlusIcon className="size-4" />
                <span>Create Staff Account</span>
              </button>
            )}

            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-neutral-200 transition cursor-pointer self-start sm:self-auto"
            >
              <ArrowPathIcon className="size-4" />
              <span>Refresh</span>
            </button>
          </div>
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
            <span>
              {isSalesman
                ? "My Staff Account"
                : "Staff & App Users"}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                subView === "staff"
                  ? "bg-orange-700 text-white"
                  : "bg-stone-200 dark:bg-neutral-700 text-stone-700 dark:text-neutral-300"
              }`}
            >
              {visibleStaffMembers.length}
            </span>
          </button>
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
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center text-gray-400 space-y-2">
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

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Customer Profile (Admin & Manager) */}
                            {(isSuper || isManager) && (
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(c)}
                                className="p-1.5 rounded-lg border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-stone-700 dark:text-neutral-200 hover:bg-stone-50 dark:hover:bg-neutral-700 transition cursor-pointer"
                                title="Edit customer information"
                              >
                                <PencilSquareIcon className="size-3.5 text-stone-600 dark:text-neutral-300" />
                              </button>
                            )}

                            {/* Password / Reset (Admin Only) */}
                            {isSuper && (
                              <button
                                type="button"
                                onClick={() => handleOpenPasswordModal(c)}
                                className="p-1.5 rounded-lg border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                                title="Set password or send reset email"
                              >
                                <KeyIcon className="size-3.5" />
                              </button>
                            )}

                            {/* Promote to Staff (Admin Only) */}
                            {isSuper && (
                              <button
                                type="button"
                                onClick={() => handleOpenRoleModal(c, "manager")}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-orange-200 dark:border-orange-900/60 text-orange-600 dark:text-orange-400 bg-orange-50/60 dark:bg-orange-950/40 hover:bg-orange-100 transition cursor-pointer flex items-center gap-1"
                                title="Promote customer to Staff (Manager, Salesman, or Admin)"
                              >
                                <UserPlusIcon className="size-3.5" />
                                <span className="hidden sm:inline">Promote</span>
                              </button>
                            )}

                            {/* Delete Shopper Account (Admin Only) */}
                            {isSuper && (
                              <button
                                type="button"
                                onClick={() => handleOpenDelete(c)}
                                className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 transition cursor-pointer"
                                title="Delete shopper account"
                              >
                                <TrashIcon className="size-3.5" />
                              </button>
                            )}
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
      )}

      {/* VIEW 2: STAFF & APP USERS */}
      {subView === "staff" && (
        <div className="space-y-6">
          {/* Dynamic Role Hierarchy Cards based on Permissions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Admin Card: Only visible to Super Administrators! (Hidden from Manager & Salesman) */}
            {isSuper && (
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
                  Super Administrator power: can create manager &amp; salesman accounts, edit info, delete accounts (cannot delete own account), and view assigned passwords.
                </p>
                <div className="pt-2 border-t border-purple-100 dark:border-purple-950 text-[11px] text-purple-900 dark:text-purple-300 font-semibold space-y-1">
                  <p>• Create accounts &amp; view passwords</p>
                  <p>• Can delete staff (Self account is protected)</p>
                </div>
              </div>
            )}

            {/* Manager Card: Visible to Admin and Manager */}
            {(isSuper || isManager) && (
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
                  Operations leadership: merchandising, inventory, and order logistics. Can edit own account and salesman accounts (cannot see, edit, or delete admins).
                </p>
                <div className="pt-2 border-t border-blue-100 dark:border-blue-950 text-[11px] text-blue-900 dark:text-blue-300 font-semibold space-y-1">
                  <p>• Can edit own and salesman account</p>
                  <p>• Cannot view, edit or delete Admin accounts</p>
                </div>
              </div>
            )}

            {/* Salesman Card: Visible to Admin, Manager, and Salesman */}
            <div
              className={`bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs space-y-3 ${
                isSalesman ? "md:col-span-3" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  🏷️ Sales Representative
                </span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                  {salesmanCount}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed">
                Front-line sales and order fulfillment: orders, stickers, and customer inquiries. Salesmen can only see and edit their own account.
              </p>
              <div className="pt-2 border-t border-emerald-100 dark:border-emerald-950 text-[11px] text-emerald-900 dark:text-emerald-300 font-semibold space-y-1">
                <p>• Can only see and edit own account</p>
                <p>• Cannot view other staff or delete accounts</p>
              </div>
            </div>
          </div>

          {/* Filter, Search Bar & Quick Create Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200/80 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {staffRoleFilterTabs.map((tab) => (
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

            <div className="flex items-center gap-2">
              <div className="relative min-w-[220px]">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search staff members..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
                />
              </div>

              {isSuper && (
                <button
                  type="button"
                  onClick={handleOpenCreateStaffModal}
                  className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-xs"
                >
                  <UserPlusIcon className="size-4" />
                  <span className="hidden md:inline">Add Staff</span>
                </button>
              )}
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
                    <th className="py-3.5 px-4">Contact Phone</th>
                    <th className="py-3.5 px-4">Assigned Role</th>
                    {/* Assigned Password Column: ONLY Visible to Admin! */}
                    {isSuper && (
                      <th className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1">
                          <KeyIcon className="size-3 text-amber-500" />
                          <span>Password (Admin View)</span>
                        </span>
                      </th>
                    )}
                    <th className="py-3.5 px-4">Standard Permissions</th>
                    <th className="py-3.5 px-4 text-right">Management &amp; Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isSuper ? 7 : 6}
                        className="py-14 text-center text-gray-400 space-y-2"
                      >
                        <ShieldCheckIcon className="size-8 mx-auto text-stone-300 dark:text-neutral-600" />
                        <p>No staff accounts found matching your query.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff) => {
                      const norm = normalizeRole(staff.role);
                      const config = getRoleConfig(norm);
                      const isCurrentSelf = staff.uid === currentAdminUid;
                      const staffPwd =
                        staff.assignedPassword || staff.temporaryPassword;
                      const isPwdRevealed = Boolean(revealedPasswords[staff.uid]);

                      const editCheck = canEditUser(
                        currentUserRole,
                        staff.role,
                        isCurrentSelf
                      );
                      const passwordCheck = canChangeUserPassword(
                        currentUserRole,
                        staff.role,
                        isCurrentSelf
                      );
                      const roleCheck = canChangeRole(
                        currentUserRole,
                        staff.role,
                        isCurrentSelf
                      );
                      const deleteCheck = canDeleteUser(
                        currentUserRole,
                        staff.role,
                        isCurrentSelf
                      );

                      return (
                        <tr
                          key={staff.uid}
                          className="hover:bg-stone-50/50 dark:hover:bg-neutral-800/30 transition"
                        >
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
                                  {(
                                    staff.displayName ||
                                    staff.email ||
                                    "S"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                                  <span>
                                    {staff.displayName || "Staff Member"}
                                  </span>
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

                          <td className="py-3.5 px-4 text-[11px]">
                            {staff.phoneNumber ? (
                              <a
                                href={`tel:${staff.phoneNumber}`}
                                className="font-mono text-gray-700 dark:text-neutral-300 hover:text-orange-600"
                              >
                                {staff.phoneNumber}
                              </a>
                            ) : (
                              <span className="text-gray-400 italic">None</span>
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

                          {/* Password Cell (Admin Only!) */}
                          {isSuper && (
                            <td className="py-3.5 px-4 text-center">
                              {staffPwd ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700">
                                  <span className="font-mono text-[11px] text-stone-900 dark:text-neutral-100 font-bold select-all">
                                    {isPwdRevealed ? staffPwd : "••••••••"}
                                  </span>

                                  {/* Toggle reveal */}
                                  <button
                                    type="button"
                                    onClick={() => togglePasswordReveal(staff.uid)}
                                    className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
                                    title={
                                      isPwdRevealed ? "Hide password" : "Show password"
                                    }
                                  >
                                    {isPwdRevealed ? (
                                      <EyeSlashIcon className="size-3.5 text-stone-600 dark:text-neutral-300" />
                                    ) : (
                                      <EyeIcon className="size-3.5 text-stone-400" />
                                    )}
                                  </button>

                                  {/* Copy password */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopyStaffPassword(staff.uid, staffPwd)
                                    }
                                    className="p-1 text-stone-400 hover:text-orange-600 transition cursor-pointer"
                                    title="Copy password to clipboard"
                                  >
                                    {copiedStaffPasswordUid === staff.uid ? (
                                      <CheckIcon className="size-3.5 text-emerald-600" />
                                    ) : (
                                      <DocumentDuplicateIcon className="size-3.5 text-stone-400" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-400 italic font-mono">
                                  Not recorded
                                </span>
                              )}
                            </td>
                          )}

                          <td className="py-3.5 px-4">
                            <p className="text-xs text-gray-600 dark:text-neutral-300 font-medium">
                              {config.tagline}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-neutral-500 truncate max-w-xs mt-0.5">
                              {config.permissions.slice(0, 2).join(" • ")}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* 1. Edit User Info Button (Admin: all; Manager: self & salesman; Salesman: self) */}
                              {editCheck.canEdit && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(staff)}
                                  className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-stone-700 dark:text-neutral-200 hover:bg-stone-50 dark:hover:bg-neutral-700 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Edit account details"
                                >
                                  <PencilSquareIcon className="size-3.5 text-stone-600 dark:text-neutral-300" />
                                  <span className="text-[11px] font-semibold hidden md:inline">
                                    Edit
                                  </span>
                                </button>
                              )}

                              {/* 2. Change Password Button (Admin: all; Manager: self; Salesman: self) */}
                              {passwordCheck.canChangePassword && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPasswordModal(staff)}
                                  className="px-2.5 py-1.5 rounded-lg border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100/70 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Change or reset password"
                                >
                                  <KeyIcon className="size-3.5" />
                                  <span className="text-[11px] font-semibold hidden md:inline">
                                    Password
                                  </span>
                                </button>
                              )}

                              {/* 3. Change Role Button (Admin Only, cannot alter own role) */}
                              {roleCheck.canChange && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRoleModal(staff)}
                                  className="px-2.5 py-1.5 rounded-lg border border-purple-200/80 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100/70 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Alter App Role"
                                >
                                  <BriefcaseIcon className="size-3.5" />
                                  <span className="text-[11px] font-semibold hidden md:inline">
                                    Role
                                  </span>
                                </button>
                              )}

                              {/* 4. Delete Staff Member */}
                              {isCurrentSelf ? (
                                <div
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-neutral-800/80 border border-stone-200 dark:border-neutral-700 text-stone-400 text-[10px] font-bold select-none"
                                  title="You cannot delete your own active account."
                                >
                                  <LockClosedIcon className="size-3 text-stone-400" />
                                  <span>Protected (You)</span>
                                </div>
                              ) : deleteCheck.canDelete ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDelete(staff)}
                                  className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
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

      {/* MODAL 1: Create Staff Member Account Modal (Admin Only) */}
      <Transition appear show={isCreateStaffOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50 font-sans"
          onClose={() => {
            if (!isCreatingStaff) {
              setIsCreateStaffOpen(false);
              setCreatedStaffResult(null);
            }
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
                        <UserPlusIcon className="size-6" />
                      </div>
                      <div>
                        <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                          Create Staff Account
                        </DialogTitle>
                        <p className="text-xs text-gray-500 dark:text-neutral-400">
                          Create a new Manager or Salesman with direct login credentials.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isCreatingStaff}
                      onClick={() => {
                        setIsCreateStaffOpen(false);
                        setCreatedStaffResult(null);
                      }}
                      className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>

                  {/* SUCCESS VIEW: Show created credentials with visible password */}
                  {createdStaffResult ? (
                    <div className="space-y-4 py-2">
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckBadgeIcon className="size-6 text-emerald-600 shrink-0" />
                          <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-300">
                            Account Successfully Created &amp; Activated!
                          </h4>
                        </div>
                        <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                          The new staff member can now log in using these credentials. The password is saved and visible to you at any time.
                        </p>

                        <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 space-y-2 text-xs font-mono">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Name:</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              {createdStaffResult.displayName}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Role:</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 dark:bg-neutral-800 text-stone-800 dark:text-neutral-200">
                              {createdStaffResult.role}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Login Email:</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              {createdStaffResult.email}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-gray-100 dark:border-neutral-800">
                            <span className="text-gray-500 font-bold">Password:</span>
                            <span className="font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md select-all">
                              {createdStaffResult.password}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Success Actions */}
                      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100 dark:border-neutral-800">
                        <button
                          type="button"
                          onClick={() => {
                            const credText = `SilkenDrift Staff Credentials\nRole: ${createdStaffResult.role.toUpperCase()}\nName: ${createdStaffResult.displayName}\nEmail: ${createdStaffResult.email}\nPassword: ${createdStaffResult.password}`;
                            navigator.clipboard.writeText(credText);
                            toast.success("Full credentials copied to clipboard!");
                          }}
                          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-semibold text-xs hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <DocumentDuplicateIcon className="size-4 text-stone-600" />
                          <span>Copy All Credentials</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenCreateStaffModal();
                          }}
                          className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                        >
                          Create Another
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreateStaffOpen(false);
                            setCreatedStaffResult(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs shadow-md transition cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* FORM VIEW: Create Staff Account Form */
                    <form onSubmit={handleConfirmCreateStaff} className="space-y-4">
                      {/* Role Selector: Manager or Salesman or Admin */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1.5">
                          Select Staff Role *
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div
                            onClick={() => setCreateRole("manager")}
                            className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-2.5 ${
                              createRole === "manager"
                                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
                                : "border-stone-200 dark:border-neutral-800 hover:border-stone-300"
                            }`}
                          >
                            <span className="text-xl">💼</span>
                            <div>
                              <p className="font-bold text-xs text-gray-900 dark:text-white">
                                Operations Manager
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-neutral-400">
                                Merchandising &amp; Stock
                              </p>
                            </div>
                          </div>

                          <div
                            onClick={() => setCreateRole("salesman")}
                            className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-2.5 ${
                              createRole === "salesman"
                                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                                : "border-stone-200 dark:border-neutral-800 hover:border-stone-300"
                            }`}
                          >
                            <span className="text-xl">🏷️</span>
                            <div>
                              <p className="font-bold text-xs text-gray-900 dark:text-white">
                                Sales Representative
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-neutral-400">
                                Orders &amp; Fulfillment
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Display Name */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={createDisplayName}
                          onChange={(e) => setCreateDisplayName(e.target.value)}
                          placeholder="e.g. Rafiqul Islam"
                          className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </div>

                      {/* Email Address */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                          Login Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={createEmail}
                          onChange={(e) => setCreateEmail(e.target.value)}
                          placeholder="e.g. rafiq@silkendrift.com"
                          className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                        />
                      </div>

                      {/* Password (Visible for Admin!) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300">
                            Password (Visible for Admin) *
                          </label>
                          <button
                            type="button"
                            onClick={handleGenerateCreateStaffPassword}
                            className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                          >
                            <SparklesIcon className="size-3.5" />
                            <span>Generate Strong Password</span>
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showCreatePassword ? "text" : "password"}
                            required
                            value={createPassword}
                            onChange={(e) => setCreatePassword(e.target.value)}
                            placeholder="Minimum 6 characters"
                            className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCreatePassword(!showCreatePassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            {showCreatePassword ? (
                              <EyeSlashIcon className="size-4" />
                            ) : (
                              <EyeIcon className="size-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          The assigned password is saved in Firestore so you can view it anytime from the staff table.
                        </p>
                      </div>

                      {/* Optional Contact Phone & Location */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100 dark:border-neutral-800">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                            Contact Phone
                          </label>
                          <input
                            type="tel"
                            value={createPhone}
                            onChange={(e) => setCreatePhone(e.target.value)}
                            placeholder="+880 1..."
                            className="w-full px-3.5 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                            Operational Hub / City
                          </label>
                          <input
                            type="text"
                            value={createCity}
                            onChange={(e) => setCreateCity(e.target.value)}
                            placeholder="Dhaka"
                            className="w-full px-3.5 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-neutral-800">
                        <button
                          type="button"
                          disabled={isCreatingStaff}
                          onClick={() => setIsCreateStaffOpen(false)}
                          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-semibold text-xs hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isCreatingStaff}
                          className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isCreatingStaff ? (
                            <>
                              <Spinner className="size-4 text-white" />
                              <span>Creating Account...</span>
                            </>
                          ) : (
                            <>
                              <UserPlusIcon className="size-4" />
                              <span>Create &amp; Save Credentials</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* MODAL 2: Edit Account Information Modal */}
      <Transition appear show={Boolean(userToEdit)} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50 font-sans"
          onClose={() => {
            if (!isSavingEdit) setUserToEdit(null);
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
                        <PencilSquareIcon className="size-6" />
                      </div>
                      <div>
                        <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                          Edit Account Information
                        </DialogTitle>
                        <p className="text-xs text-gray-500 dark:text-neutral-400">
                          Update profile name, phone number, and delivery details.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSavingEdit}
                      onClick={() => setUserToEdit(null)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleConfirmEdit} className="space-y-4">
                    {/* User identifier banner */}
                    {userToEdit && (
                      <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-neutral-800/60 border border-stone-200/80 dark:border-neutral-700/80 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {userToEdit.email}
                          </p>
                          <span className="text-[10px] text-gray-400 font-mono">
                            UID: {userToEdit.uid}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-200 dark:bg-neutral-700 text-stone-700 dark:text-neutral-300">
                          {userToEdit.role || "customer"}
                        </span>
                      </div>
                    )}

                    {/* Display Name */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                        Full Name / Display Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editDisplayName}
                        onChange={(e) => setEditDisplayName(e.target.value)}
                        placeholder="e.g. Tanvir Hasan"
                        className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </div>

                    {/* Phone Number & Profile Photo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={editPhoneNumber}
                          onChange={(e) => setEditPhoneNumber(e.target.value)}
                          placeholder="e.g. +880 1712 345678"
                          className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                          Avatar Image URL
                        </label>
                        <input
                          type="url"
                          value={editPhotoURL}
                          onChange={(e) => setEditPhotoURL(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </div>
                    </div>

                    {/* Address Fields */}
                    <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-neutral-800">
                      <p className="text-[11px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                        Address / Location Details
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            value={editStreet}
                            onChange={(e) => setEditStreet(e.target.value)}
                            placeholder="Street / House / Area"
                            className="w-full px-3.5 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={editCity}
                            onChange={(e) => setEditCity(e.target.value)}
                            placeholder="City"
                            className="w-full px-3.5 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={editDistrict}
                            onChange={(e) => setEditDistrict(e.target.value)}
                            placeholder="District"
                            className="w-full px-3.5 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* App Role (Only Admin can change role) */}
                    {isSuper && (
                      <div className="pt-2 border-t border-stone-100 dark:border-neutral-800">
                        <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                          Assigned Role (Administrator Power)
                        </label>
                        <select
                          value={editRole}
                          disabled={userToEdit?.uid === currentAdminUid}
                          onChange={(e) => setEditRole(e.target.value as AppRole)}
                          className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option value="admin">Administrator (👑 Full Access)</option>
                          <option value="manager">Operations Manager (💼 Catalog &amp; Operations)</option>
                          <option value="salesman">Sales Representative (🏷️ Orders &amp; Fulfillment)</option>
                          <option value="customer">Shopper / Customer (Retail Customer)</option>
                        </select>
                        {userToEdit?.uid === currentAdminUid && (
                          <p className="text-[10px] text-gray-400 mt-1 italic">
                            You cannot demote or alter your own active administrator role.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-neutral-800">
                      <button
                        type="button"
                        disabled={isSavingEdit}
                        onClick={() => setUserToEdit(null)}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-semibold text-xs hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingEdit}
                        className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingEdit ? (
                          <>
                            <Spinner className="size-4 text-white" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <span>Save Changes</span>
                        )}
                      </button>
                    </div>
                  </form>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* MODAL 3: Change Password Modal */}
      <Transition appear show={Boolean(userToChangePassword)} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50 font-sans"
          onClose={() => {
            if (!isChangingPassword) setUserToChangePassword(null);
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
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <KeyIcon className="size-6" />
                      </div>
                      <div>
                        <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                          {userToChangePassword?.uid === currentAdminUid
                            ? "Change Your Password"
                            : `Change Password for ${
                                userToChangePassword?.displayName || "Staff Member"
                              }`}
                        </DialogTitle>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                          {userToChangePassword?.uid === currentAdminUid
                            ? "Update your login credentials securely."
                            : "Assign a new password or send a password reset email."}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isChangingPassword}
                      onClick={() => setUserToChangePassword(null)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>

                  {/* Target Account Summary */}
                  {userToChangePassword && (
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-neutral-800/60 border border-stone-200/80 dark:border-neutral-700/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {userToChangePassword.displayName || "User"}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400 font-mono truncate">
                            {userToChangePassword.email}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-200 dark:bg-neutral-700 text-stone-700 dark:text-neutral-300 shrink-0">
                          {normalizeRole(userToChangePassword.role)}
                        </span>
                      </div>

                      {/* Display current password if known for Admin */}
                      {isSuper &&
                        (userToChangePassword.assignedPassword ||
                          userToChangePassword.temporaryPassword) && (
                          <div className="pt-2 border-t border-stone-200/60 dark:border-neutral-700/60 flex items-center justify-between text-[11px]">
                            <span className="text-gray-500">Current on file:</span>
                            <span className="font-mono font-bold text-stone-800 dark:text-stone-200 bg-stone-200/80 dark:bg-neutral-700/80 px-2 py-0.5 rounded-sm select-all">
                              {userToChangePassword.assignedPassword ||
                                userToChangePassword.temporaryPassword}
                            </span>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleConfirmChangePassword} className="space-y-4">
                    {/* Password Generator (Available when Admin manages another user) */}
                    {userToChangePassword?.uid !== currentAdminUid && (
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40 text-xs">
                        <span className="text-orange-900 dark:text-orange-300 font-medium text-[11px]">
                          Need a secure random password?
                        </span>
                        <button
                          type="button"
                          onClick={handleGenerateStrongPassword}
                          className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <SparklesIcon className="size-3.5" />
                          <span>Generate</span>
                        </button>
                      </div>
                    )}

                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                        New Password (minimum 6 characters) *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeSlashIcon className="size-4" />
                          ) : (
                            <EyeIcon className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showConfirmPassword ? (
                            <EyeSlashIcon className="size-4" />
                          ) : (
                            <EyeIcon className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Copy Password Helper (When password filled) */}
                    {newPassword && (
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>Copy password to give to user:</span>
                        <button
                          type="button"
                          onClick={handleCopyGeneratedPassword}
                          className="font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 cursor-pointer"
                        >
                          {tempPasswordCopied ? (
                            <>
                              <CheckIcon className="size-3.5 text-emerald-600" />
                              <span className="text-emerald-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <DocumentDuplicateIcon className="size-3.5" />
                              <span>Copy Password</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Send Email Option (Admin changing other user's password) */}
                    {userToChangePassword?.uid !== currentAdminUid && (
                      <div className="pt-2 border-t border-stone-100 dark:border-neutral-800 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-neutral-300">
                          <input
                            type="checkbox"
                            checked={sendPasswordResetEmailOption}
                            onChange={(e) =>
                              setSendPasswordResetEmailOption(e.target.checked)
                            }
                            className="size-4 text-orange-600 rounded-sm border-gray-300 focus:ring-orange-500"
                          />
                          <span>
                            Also send official password reset email to{" "}
                            <strong>{userToChangePassword?.email}</strong>
                          </span>
                        </label>

                        {/* Quick action: Send reset email only */}
                        <div className="text-right">
                          <button
                            type="button"
                            disabled={isChangingPassword}
                            onClick={handleQuickSendPasswordReset}
                            className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                          >
                            Or send password reset link without changing password &rarr;
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-neutral-800">
                      <button
                        type="button"
                        disabled={isChangingPassword}
                        onClick={() => setUserToChangePassword(null)}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-semibold text-xs hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isChangingPassword ? (
                          <>
                            <Spinner className="size-4 text-white" />
                            <span>Updating Password...</span>
                          </>
                        ) : (
                          <span>Update Password</span>
                        )}
                      </button>
                    </div>
                  </form>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* MODAL 4: Role Assignment / Promotion / Demotion Modal (Admin Only) */}
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
                          {(
                            userToChangeRole.displayName ||
                            userToChangeRole.email ||
                            "U"
                          )
                            .charAt(0)
                            .toUpperCase()}
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
                      {(["admin", "manager", "salesman", "customer"] as AppRole[]).map(
                        (r) => {
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
                                  <span
                                    className={`px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase border ${conf.badgeClass}`}
                                  >
                                    {conf.shortLabel}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                                  {conf.description}
                                </p>
                              </div>
                            </div>
                          );
                        }
                      )}
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

      {/* MODAL 5: Delete Account Confirmation Modal */}
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
                          Permanently delete this user from Cloud Firestore.
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
                      &quot;
                      {customerToDelete?.displayName || customerToDelete?.email}
                      &quot;
                    </strong>
                    ? Their profile data and internal access privileges will be permanently erased.
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
