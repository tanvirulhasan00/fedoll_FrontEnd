import React, { useState, useEffect, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  XMarkIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import {
  signInWithGoogle,
  loginWithEmail,
  registerWithEmail,
  resetPassword,
  formatAuthError,
} from "~/firebase";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "login" | "signup";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = "login",
}) => {
  const [activeTab, setActiveTab] = useState<"login" | "signup" | "forgot">(
    initialTab
  );
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync tab with initialTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialTab]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleResetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleModalClose = () => {
    if (loading || googleLoading) return;
    handleResetForm();
    onClose();
  };

  // Google Sign In handler
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setGoogleLoading(true);

    try {
      const res = await signInWithGoogle();
      const name = res.user.displayName || res.user.email?.split("@")[0] || "User";
      toast.success(`Welcome back, ${name}!`);
      handleModalClose();
    } catch (err: unknown) {
      const message = formatAuthError(err);
      // Don't show toast if user merely closed popup
      const errObj = err as { code?: string };
      if (errObj?.code !== "auth/popup-closed-by-user") {
        setErrorMessage(message);
        toast.error(message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Email / Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithEmail(email, password);
      const name = res.user.displayName || res.user.email?.split("@")[0] || "User";
      toast.success(`Welcome back, ${name}!`);
      handleModalClose();
    } catch (err: unknown) {
      const message = formatAuthError(err);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Email / Password Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const name = formData.name.trim();
    const email = formData.email.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!email || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerWithEmail(email, password, name);
      const displayName = res.user.displayName || name || "User";
      toast.success(`Account created successfully! Welcome, ${displayName}.`);
      handleModalClose();
    } catch (err: unknown) {
      const message = formatAuthError(err);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const email = formData.email.trim();
    if (!email) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMessage(
        "Password reset instructions have been sent to your email."
      );
      toast.success("Password reset email sent!");
    } catch (err: unknown) {
      const message = formatAuthError(err);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleModalClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                {/* Header with Title and Close Button */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <DialogTitle
                    as="h3"
                    className="text-xl font-bold tracking-tight text-gray-900"
                  >
                    {activeTab === "login" && "Welcome Back"}
                    {activeTab === "signup" && "Create an Account"}
                    {activeTab === "forgot" && "Reset Password"}
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="size-5" />
                  </button>
                </div>

                <div className="p-6">
                  {/* Tab Selector (Login / Sign Up) */}
                  {activeTab !== "forgot" && (
                    <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("login");
                          setErrorMessage(null);
                        }}
                        className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                          activeTab === "login"
                            ? "bg-white text-orange-700 shadow-xs"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Log In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("signup");
                          setErrorMessage(null);
                        }}
                        className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                          activeTab === "signup"
                            ? "bg-white text-orange-700 shadow-xs"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Sign Up
                      </button>
                    </div>
                  )}

                  {/* Error Alert */}
                  {errorMessage && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <ExclamationCircleIcon className="size-5 shrink-0 text-red-600" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Success Alert */}
                  {successMessage && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                      <CheckCircleIcon className="size-5 shrink-0 text-green-600" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  {/* Google Sign In Button */}
                  {activeTab !== "forgot" && (
                    <>
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading || loading}
                        className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-xs hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-orange-700 focus:ring-offset-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {googleLoading ? (
                          <Spinner className="size-5 text-gray-600" />
                        ) : (
                          <svg className="size-5" viewBox="0 0 24 24">
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                              fill="#EA4335"
                            />
                          </svg>
                        )}
                        <span>
                          {googleLoading
                            ? "Connecting to Google..."
                            : activeTab === "login"
                            ? "Continue with Google"
                            : "Sign up with Google"}
                        </span>
                      </button>

                      {/* Divider */}
                      <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-3 text-gray-500 font-medium">
                            Or with email
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* LOGIN FORM */}
                  {activeTab === "login" && (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label
                          htmlFor="login-email"
                          className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                        >
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                            <EnvelopeIcon className="size-5 text-gray-400" />
                          </div>
                          <input
                            id="login-email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className="block w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-700 focus:outline-hidden focus:ring-1 focus:ring-orange-700 transition"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label
                            htmlFor="login-password"
                            className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                          >
                            Password
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab("forgot");
                              setErrorMessage(null);
                            }}
                            className="text-xs font-medium text-orange-700 hover:text-orange-800 transition hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                            <LockClosedIcon className="size-5 text-gray-400" />
                          </div>
                          <input
                            id="login-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="block w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-700 focus:outline-hidden focus:ring-1 focus:ring-orange-700 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="size-5" />
                            ) : (
                              <EyeIcon className="size-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || googleLoading}
                        className="mt-2 flex w-full items-center justify-center rounded-xl bg-orange-700 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-orange-800 focus:outline-hidden focus:ring-2 focus:ring-orange-700 focus:ring-offset-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <Spinner className="size-4 text-white" />
                            <span>Signing In...</span>
                          </div>
                        ) : (
                          "Sign In"
                        )}
                      </button>

                      <p className="mt-4 text-center text-xs text-gray-500">
                        Don't have an account?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("signup");
                            setErrorMessage(null);
                          }}
                          className="font-semibold text-orange-700 hover:text-orange-800 transition hover:underline"
                        >
                          Sign up for free
                        </button>
                      </p>
                    </form>
                  )}

                  {/* SIGN UP FORM */}
                  {activeTab === "signup" && (
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div>
                        <label
                          htmlFor="signup-name"
                          className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                        >
                          Full Name
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                            <UserIcon className="size-5 text-gray-400" />
                          </div>
                          <input
                            id="signup-name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            className="block w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-700 focus:outline-hidden focus:ring-1 focus:ring-orange-700 transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="signup-email"
                          className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                        >
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                            <EnvelopeIcon className="size-5 text-gray-400" />
                          </div>
                          <input
                            id="signup-email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className="block w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-700 focus:outline-hidden focus:ring-1 focus:ring-orange-700 transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="signup-password"
                          className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                            <LockClosedIcon className="size-5 text-gray-400" />
                          </div>
                          <input
                            id="signup-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="At least 6 characters"
                            className="block w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-700 focus:outline-hidden focus:ring-1 focus:ring-orange-700 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="size-5" />
                            ) : (
                              <EyeIcon className="size-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="signup-confirm-password"
                          className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                        >
                          Confirm Password
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                            <LockClosedIcon className="size-5 text-gray-400" />
                          </div>
                          <input
                            id="signup-confirm-password"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            className="block w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-700 focus:outline-hidden focus:ring-1 focus:ring-orange-700 transition"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? (
                              <EyeSlashIcon className="size-5" />
                            ) : (
                              <EyeIcon className="size-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || googleLoading}
                        className="mt-2 flex w-full items-center justify-center rounded-xl bg-orange-700 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-orange-800 focus:outline-hidden focus:ring-2 focus:ring-orange-700 focus:ring-offset-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <Spinner className="size-4 text-white" />
                            <span>Creating Account...</span>
                          </div>
                        ) : (
                          "Create Account"
                        )}
                      </button>

                      <p className="mt-4 text-center text-xs text-gray-500">
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("login");
                            setErrorMessage(null);
                          }}
                          className="font-semibold text-orange-700 hover:text-orange-800 transition hover:underline"
                        >
                          Log in instead
                        </button>
                      </p>
                    </form>
                  )}

                  {/* FORGOT PASSWORD FORM */}
                  {activeTab === "forgot" && (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <p className="text-sm text-gray-500">
                        Enter the email associated with your account and we’ll
                        send you a link to reset your password.
                      </p>

                      <div>
                        <label
                          htmlFor="forgot-email"
                          className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                        >
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                            <EnvelopeIcon className="size-5 text-gray-400" />
                          </div>
                          <input
                            id="forgot-email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className="block w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-700 focus:outline-hidden focus:ring-1 focus:ring-orange-700 transition"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center rounded-xl bg-orange-700 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-orange-800 focus:outline-hidden focus:ring-2 focus:ring-orange-700 focus:ring-offset-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <Spinner className="size-4 text-white" />
                            <span>Sending Reset Link...</span>
                          </div>
                        ) : (
                          "Send Reset Link"
                        )}
                      </button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("login");
                            setErrorMessage(null);
                            setSuccessMessage(null);
                          }}
                          className="text-xs font-semibold text-orange-700 hover:text-orange-800 transition hover:underline"
                        >
                          Back to Log In
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AuthModal;
