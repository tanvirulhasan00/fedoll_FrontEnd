import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  UserGroupIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowTopRightOnSquareIcon,
  PhotoIcon,
  SparklesIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { toast } from "sonner";
import {
  type TeamMember,
  fetchAboutDataFromFirestore,
  saveTeamMembersToFirestore,
  subscribeToAboutDataFromFirestore,
  initialAboutData,
  normalizeGoogleDriveImageUrl,
  syncRealStaffToTeamMembers,
} from "~/firebase";
import { useAppDispatch } from "~/redux/hooks/hook";
import { setTeamMembers as setReduxTeamMembers } from "~/redux/features/aboutSlice";
import { Spinner } from "~/components/ui/spinner";

interface AdminTeamTabProps {
  canManage?: boolean;
}

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";

export const AdminTeamTab: React.FC<AdminTeamTabProps> = ({ canManage = true }) => {
  const dispatch = useAppDispatch();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingStaff, setIsSyncingStaff] = useState(false);

  // Edit / Add Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    avatar: "",
    bio: "",
  });
  const [avatarPreviewError, setAvatarPreviewError] = useState(false);

  // Delete Confirmation Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  // Load and subscribe to team data
  useEffect(() => {
    let isMounted = true;

    // Fetch initial
    fetchAboutDataFromFirestore()
      .then((data) => {
        if (isMounted) {
          setTeam(data.team || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Failed loading team members from Firestore:", err);
        if (isMounted) setIsLoading(false);
      });

    // Real-time updates subscription
    const unsubscribe = subscribeToAboutDataFromFirestore((data) => {
      if (isMounted && data.team) {
        setTeam(data.team);
        dispatch(setReduxTeamMembers(data.team));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [dispatch]);

  // Handle saving the full team list to Firestore & Redux
  const persistTeam = async (
    newTeam: TeamMember[],
    successMessage?: string
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      const res = await saveTeamMembersToFirestore(newTeam);
      setTeam(res.team);
      dispatch(setReduxTeamMembers(res.team));
      if (successMessage) {
        toast.success(successMessage);
      }
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update team members in Firestore.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Open modal to add a new member
  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({
      name: "",
      role: "",
      avatar: "",
      bio: "",
    });
    setAvatarPreviewError(false);
    setModalOpen(true);
  };

  // Open modal to edit an existing member
  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      avatar: member.avatar,
      bio: member.bio,
    });
    setAvatarPreviewError(false);
    setModalOpen(true);
  };

  // Submit Add or Edit
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter the team member's full name.");
      return;
    }
    if (!formData.role.trim()) {
      toast.error("Please specify their role or designation.");
      return;
    }
    if (!formData.bio.trim()) {
      toast.error("Please write a short bio or background summary.");
      return;
    }

    const normalizedAvatar =
      normalizeGoogleDriveImageUrl(formData.avatar.trim()) ||
      formData.avatar.trim() ||
      FALLBACK_AVATAR;

    let updatedTeam: TeamMember[];

    if (editingMember) {
      // Update existing
      updatedTeam = team.map((m) =>
        m.id === editingMember.id
          ? {
              ...m,
              name: formData.name.trim(),
              role: formData.role.trim(),
              avatar: normalizedAvatar,
              bio: formData.bio.trim(),
            }
          : m
      );
    } else {
      // Add new
      const newMember: TeamMember = {
        id: `team-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: formData.name.trim(),
        role: formData.role.trim(),
        avatar: normalizedAvatar,
        bio: formData.bio.trim(),
      };
      updatedTeam = [...team, newMember];
    }

    const success = await persistTeam(
      updatedTeam,
      editingMember
        ? `Team member "${formData.name.trim()}" updated successfully!`
        : `New team member "${formData.name.trim()}" added to About Us page!`
    );

    if (success) {
      setModalOpen(false);
      setEditingMember(null);
    }
  };

  // Open delete confirmation
  const handleOpenDelete = (member: TeamMember) => {
    setMemberToDelete(member);
    setDeleteModalOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    const filtered = team.filter((m) => m.id !== memberToDelete.id);
    const success = await persistTeam(
      filtered,
      `Removed "${memberToDelete.name}" from the About Us team.`
    );
    if (success) {
      setDeleteModalOpen(false);
      setMemberToDelete(null);
    }
  };

  // Move member position (reorder)
  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= team.length) return;

    const reordered = [...team];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setTeam(reordered);
    await persistTeam(reordered, `Reordered ${moved.name} to position #${targetIndex + 1}.`);
  };

  // Automatically sync real staff accounts from Cloud Firestore users collection
  const handleSyncRealStaff = async () => {
    setIsSyncingStaff(true);
    try {
      const syncedTeam = await syncRealStaffToTeamMembers();
      setTeam(syncedTeam);
      dispatch(setReduxTeamMembers(syncedTeam));
      toast.success("Successfully synced real staff members to Our Team!");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to sync staff accounts.");
    } finally {
      setIsSyncingStaff(false);
    }
  };

  // Reset or load initial template team
  const handleRestoreInitial = async () => {
    if (
      !window.confirm(
        "Are you sure you want to load the default SilkenDrift Dhaka team template? This will replace the current team list."
      )
    ) {
      return;
    }
    await persistTeam(initialAboutData.team, "Restored default Dhaka Atelier team members.");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-2xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <UserGroupIcon className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span>Our Team (About Us Page)</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-neutral-400">
                  {team.length} {team.length === 1 ? "Member" : "Members"}
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                Manage the artisans, designers, and specialists featured on the public{" "}
                <Link
                  to="/about-us"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-600 dark:text-orange-400 hover:underline font-semibold inline-flex items-center gap-0.5"
                >
                  About Us page
                  <ArrowTopRightOnSquareIcon className="size-3" />
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSyncRealStaff}
              disabled={isSaving || isSyncingStaff}
              title="Automatically sync registered Admin & Manager accounts from Firestore users"
              className="px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-stone-700 dark:text-neutral-200 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon
                className={`size-4 ${isSyncingStaff ? "animate-spin text-orange-600 dark:text-orange-400" : ""}`}
              />
              <span>{isSyncingStaff ? "Syncing..." : "Sync Real Staff"}</span>
            </button>

            {team.length === 0 && (
              <button
                type="button"
                onClick={handleRestoreInitial}
                disabled={isSaving || isSyncingStaff}
                className="px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-stone-700 dark:text-neutral-200 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon className="size-4" />
                <span>Load Template Team</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenAdd}
              disabled={isSaving || isSyncingStaff}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <PlusIcon className="size-4 stroke-2" />
              <span>Add Team Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Info notice */}
      <div className="bg-stone-50 dark:bg-neutral-900/60 border border-stone-200/80 dark:border-neutral-800/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-stone-600 dark:text-neutral-400">
        <InformationCircleIcon className="size-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-stone-800 dark:text-neutral-200">
            Real-Time Synchronization with Public Storefront
          </p>
          <p>
            Any addition, profile edit, or reordering made here reflects live on{" "}
            <span className="font-mono text-[11px] text-orange-600 dark:text-orange-400">
              /about-us
            </span>{" "}
            instantaneously without needing to redeploy or rebuild the site.
          </p>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-12 border border-stone-200/80 dark:border-neutral-800 flex flex-col items-center justify-center gap-3">
          <Spinner className="size-8 text-orange-600" />
          <p className="text-xs text-gray-500 dark:text-neutral-400 font-medium">
            Fetching Atelier team members...
          </p>
        </div>
      ) : team.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-12 text-center border border-dashed border-stone-300 dark:border-neutral-800 flex flex-col items-center max-w-xl mx-auto">
          <div className="size-16 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4">
            <UserGroupIcon className="size-8" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            No Team Members Published
          </h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 max-w-md leading-relaxed">
            The &quot;Our Team&quot; section on the public About Us page is currently hidden because no
            members have been added. Add your leadership, designers, or tailors to introduce your
            brand story.
          </p>
          {canManage && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSyncRealStaff}
                disabled={isSaving || isSyncingStaff}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon
                  className={`size-4 ${isSyncingStaff ? "animate-spin" : ""}`}
                />
                <span>{isSyncingStaff ? "Syncing Staff..." : "Sync Real Staff"}</span>
              </button>
              <button
                type="button"
                onClick={handleRestoreInitial}
                disabled={isSaving || isSyncingStaff}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-neutral-700 hover:bg-stone-100 dark:hover:bg-neutral-800 text-xs font-semibold text-stone-700 dark:text-neutral-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Load Default Team
              </button>
              <button
                type="button"
                onClick={handleOpenAdd}
                disabled={isSaving || isSyncingStaff}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-neutral-700 hover:bg-stone-100 dark:hover:bg-neutral-800 text-stone-700 dark:text-neutral-300 text-xs font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <PlusIcon className="size-4" />
                <span>Add Member</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Team Members Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {team.map((member, index) => (
            <div
              key={member.id}
              className="group bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
            >
              {/* Photo Area */}
              <div className="relative aspect-4/3 bg-stone-100 dark:bg-neutral-800 overflow-hidden">
                <img
                  src={member.avatar || FALLBACK_AVATAR}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.src = FALLBACK_AVATAR;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                {/* Position Badge */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-white/20">
                  #{index + 1}
                </div>

                {/* Name & Role overlay */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h4 className="text-sm font-bold truncate drop-shadow-xs">{member.name}</h4>
                  <p className="text-[11px] text-orange-300 font-medium truncate drop-shadow-xs">
                    {member.role}
                  </p>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-gray-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                  {member.bio}
                </p>

                {/* Action Buttons Toolbar */}
                <div className="pt-3 border-t border-stone-100 dark:border-neutral-800 flex items-center justify-between gap-1">
                  {/* Order controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0 || isSaving || !canManage}
                      onClick={() => handleMove(index, "up")}
                      title="Move Up"
                      className="size-7 rounded-lg border border-stone-200 dark:border-neutral-700 flex items-center justify-center text-stone-600 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <ArrowUpIcon className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === team.length - 1 || isSaving || !canManage}
                      onClick={() => handleMove(index, "down")}
                      title="Move Down"
                      className="size-7 rounded-lg border border-stone-200 dark:border-neutral-700 flex items-center justify-center text-stone-600 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <ArrowDownIcon className="size-3.5" />
                    </button>
                  </div>

                  {/* Edit / Delete */}
                  {canManage && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(member)}
                        disabled={isSaving}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-stone-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <PencilSquareIcon className="size-3.5 text-stone-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(member)}
                        disabled={isSaving}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                        title="Delete Member"
                      >
                        <TrashIcon className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================================================================== */}
      {/* Add / Edit Team Member Modal */}
      {/* ==================================================================== */}
      <Transition appear show={modalOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setModalOpen(false)}>
          <TransitionChild
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 p-6 sm:p-7 shadow-2xl transition-all">
                  <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-neutral-800">
                    <DialogTitle className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                      <UserGroupIcon className="size-5 text-orange-600" />
                      <span>{editingMember ? "Edit Team Member" : "Add New Team Member"}</span>
                    </DialogTitle>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="size-8 rounded-full hover:bg-stone-100 dark:hover:bg-neutral-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white transition cursor-pointer"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveMember} className="mt-5 space-y-4 text-xs">
                    {/* Full Name */}
                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Tanvirul Hasan, Sophia Chen"
                        className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Role / Designation */}
                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                        Role / Designation <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="e.g. Founder & Lead Product Specialist, Senior Patternmaker"
                        className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Avatar URL & Live Preview */}
                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                        Avatar Photo URL (Google Drive, CDN, or Web Link)
                      </label>
                      <div className="flex items-center gap-3">
                        {/* Live Thumbnail Preview */}
                        <div className="size-14 rounded-2xl bg-stone-100 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {formData.avatar ? (
                            <img
                              src={
                                normalizeGoogleDriveImageUrl(formData.avatar) ||
                                formData.avatar ||
                                FALLBACK_AVATAR
                              }
                              alt="Avatar Preview"
                              className="w-full h-full object-cover"
                              onError={() => setAvatarPreviewError(true)}
                              onLoad={() => setAvatarPreviewError(false)}
                            />
                          ) : (
                            <PhotoIcon className="size-6 text-stone-400" />
                          )}
                        </div>

                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.avatar}
                            onChange={(e) => {
                              setFormData({ ...formData, avatar: e.target.value });
                              setAvatarPreviewError(false);
                            }}
                            placeholder="https://drive.google.com/file/d/... or https://images.unsplash.com/..."
                            className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 dark:text-white font-mono text-[11px]"
                          />
                          <p className="text-[10px] text-gray-500 dark:text-neutral-400 mt-1">
                            Google Drive share links are automatically transformed into instant high-speed CDN URLs.
                          </p>
                        </div>
                      </div>

                      {avatarPreviewError && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
                          <ExclamationTriangleIcon className="size-3.5" />
                          <span>Could not preview image. SilkenDrift fallback image will be used if the URL fails.</span>
                        </p>
                      )}
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                        Short Bio &amp; Background <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Brief summary of their craft, textile expertise, role in Bangladesh garment production..."
                        className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 dark:text-white leading-relaxed resize-none"
                      />
                    </div>

                    {/* Modal Footer */}
                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => setModalOpen(false)}
                        disabled={isSaving}
                        className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-stone-700 dark:text-neutral-300 font-semibold cursor-pointer transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold shadow-md shadow-orange-500/20 transition flex items-center gap-2 cursor-pointer"
                      >
                        {isSaving && <Spinner className="size-3.5 text-white" />}
                        <span>{editingMember ? "Save Changes" : "Publish Member"}</span>
                      </button>
                    </div>
                  </form>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ==================================================================== */}
      {/* Delete Confirmation Modal */}
      {/* ==================================================================== */}
      <Transition appear show={deleteModalOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setDeleteModalOpen(false)}>
          <TransitionChild
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 p-6 shadow-2xl transition-all">
                  <div className="flex items-center gap-3 text-rose-600">
                    <div className="size-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center">
                      <TrashIcon className="size-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                        Remove Team Member?
                      </DialogTitle>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">
                        This member will be removed from the About Us page.
                      </p>
                    </div>
                  </div>

                  {memberToDelete && (
                    <div className="my-5 p-3.5 rounded-2xl bg-stone-50 dark:bg-neutral-800/80 border border-stone-200/80 dark:border-neutral-700 flex items-center gap-3">
                      <img
                        src={memberToDelete.avatar || FALLBACK_AVATAR}
                        alt={memberToDelete.name}
                        className="size-12 rounded-xl object-cover shrink-0"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.src = FALLBACK_AVATAR;
                        }}
                      />
                      <div className="truncate">
                        <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {memberToDelete.name}
                        </h5>
                        <p className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold truncate">
                          {memberToDelete.role}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteModalOpen(false)}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-xl border border-stone-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-xs font-semibold text-stone-700 dark:text-neutral-300 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSaving && <Spinner className="size-3.5 text-white" />}
                      <span>Delete Member</span>
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

export default AdminTeamTab;

