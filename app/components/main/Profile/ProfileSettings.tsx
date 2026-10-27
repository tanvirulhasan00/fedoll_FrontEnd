import React, { useState, useEffect } from "react";
import {
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import { updateUserProfile } from "~/redux/features/auth/authSlice";
import { updateUserProfileInFirestore } from "~/firebase";
import { Spinner } from "~/components/ui/spinner";

export const ProfileSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [street, setStreet] = useState(user?.deliveryAddress?.street || "");
  const [city, setCity] = useState(user?.deliveryAddress?.city || "Dhaka");
  const [district, setDistrict] = useState(user?.deliveryAddress?.district || "Dhaka");
  const [postalCode, setPostalCode] = useState(user?.deliveryAddress?.postalCode || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhoneNumber(user.phoneNumber || "");
      if (user.deliveryAddress) {
        setStreet(user.deliveryAddress.street || "");
        setCity(user.deliveryAddress.city || "Dhaka");
        setDistrict(user.deliveryAddress.district || "Dhaka");
        setPostalCode(user.deliveryAddress.postalCode || "");
      }
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    if (!displayName.trim()) {
      toast.error("Please provide your full name.");
      return;
    }

    setIsSaving(true);
    const updatedData = {
      displayName: displayName.trim(),
      phoneNumber: phoneNumber.trim(),
      deliveryAddress: {
        street: street.trim(),
        city: city.trim(),
        district: district.trim(),
        postalCode: postalCode.trim(),
      },
    };

    try {
      await updateUserProfileInFirestore(user.uid, updatedData);
      dispatch(updateUserProfile(updatedData));
      toast.success("Profile and default delivery details updated successfully!");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-gray-100 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            Customer Profile &amp; Preferences
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            Manage your personal contact info and default Bangladesh courier address
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckBadgeIcon className="size-4" />
            <span>Role: {user?.role || "customer"}</span>
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
            Account Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Tanvirul Hasan"
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50/50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">
                Email Address (Registered)
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-100 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 dark:text-neutral-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">
                Mobile Phone Number (for Couriers)
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50/50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">
                Account Status &amp; Role
              </label>
              <div className="relative">
                <ShieldCheckIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-emerald-600" />
                <input
                  type="text"
                  disabled
                  value={`Verified ${user?.role || "customer"} account`}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-100 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-xl text-emerald-700 dark:text-emerald-400 font-semibold cursor-not-allowed capitalize"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Default Shipping Address */}
        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
          <h3 className="font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400 flex items-center gap-1.5">
            <MapPinIcon className="size-4 text-orange-600" />
            <span>Default Delivery Address (Nationwide Delivery)</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">
                Street Address / House / Flat / Road
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Flat 4B, House 12, Road 7, Sector 3, Uttara"
                className="w-full px-3 py-2.5 bg-stone-50/50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">
                  District
                </label>
                <select
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setCity(e.target.value);
                  }}
                  className="w-full px-3 py-2.5 bg-stone-50/50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600 cursor-pointer"
                >
                  <option value="Dhaka">Dhaka</option>
                  <option value="Chattogram">Chattogram</option>
                  <option value="Sylhet">Sylhet</option>
                  <option value="Rajshahi">Rajshahi</option>
                  <option value="Khulna">Khulna</option>
                  <option value="Barishal">Barishal</option>
                  <option value="Rangpur">Rangpur</option>
                  <option value="Mymensingh">Mymensingh</option>
                  <option value="Gazipur">Gazipur</option>
                  <option value="Narayanganj">Narayanganj</option>
                  <option value="Other">Other of 64 Districts</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">
                  City / Area
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Uttara / Banani / Agrabad"
                  className="w-full px-3 py-2.5 bg-stone-50/50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 1230"
                  className="w-full px-3 py-2.5 bg-stone-50/50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            {isSaving && <Spinner className="size-4 text-white" />}
            <span>Save Profile Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
