import { useState, useEffect } from "react";
import {
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  SparklesIcon,
  TagIcon,
  BoltIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import { createNewsletter } from "~/redux/features/newsletterSlice";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";

export default function NewsLetter() {
  const [email, setEmail] = useState("");
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.newsletter);
  const token = "";

  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"success" | "info" | "error" | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailToSubmit = email.trim();
    if (!emailToSubmit) return;

    const formPayload = new FormData();
    formPayload.append("email", emailToSubmit);

    try {
      const resultAction = await dispatch(
        createNewsletter({ token, formPayload, email: emailToSubmit }),
      );

      if (createNewsletter.fulfilled.match(resultAction)) {
        const payload = resultAction.payload;
        if (payload?.alreadySubscribed) {
          toast.info(payload.message || "You are already subscribed to our newsletter!");
          setStatus("info");
          setMessage(payload.message || "You are already subscribed to our VIP insider club!");
        } else {
          toast.success(payload?.message || "Thank you for subscribing! Check your inbox.");
          setStatus("success");
          setMessage(
            payload?.message || "Welcome to SilkenDrift VIP club! Use code WELCOME10 for 10% off your order.",
          );
          setEmail("");
        }
        setShowNotification(true);
      } else if (createNewsletter.rejected.match(resultAction)) {
        const errMsg =
          (resultAction.payload as string) || "Failed to subscribe to the newsletter.";
        toast.error(errMsg);
        setStatus("error");
        setMessage(errMsg);
        setShowNotification(true);
      }
    } catch (err: unknown) {
      const error = err as Error;
      const errMsg = error.message || "An unexpected error occurred.";
      toast.error(errMsg);
      setStatus("error");
      setMessage(errMsg);
      setShowNotification(true);
    }
  };

  return (
    <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-b from-stone-50 via-white to-stone-100/70 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 border border-stone-200/90 dark:border-neutral-800 p-8 sm:p-12 lg:p-16 shadow-xl dark:shadow-2xl transition-colors duration-200">
      {/* Decorative ambient glowing gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-orange-500/10 dark:bg-orange-600/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl"
      />

      <div className="relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
        {/* Left Column: Headline, Description & Subscription Form */}
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 dark:border-orange-500/30 bg-orange-100/80 dark:bg-orange-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-800 dark:text-orange-400">
            <SparklesIcon className="size-4 text-orange-600 dark:text-orange-400" />
            <span>Exclusive VIP Circle</span>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
            Stay Ahead. <br />
            <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 dark:from-orange-400 dark:via-orange-500 dark:to-amber-400 bg-clip-text text-transparent">
              Enjoy 10% Off
            </span>{" "}
            Your Next Order.
          </h2>

          <p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-gray-600 dark:text-neutral-400">
            Join thousands of global fashion enthusiasts. Receive private seasonal drops,
            limited denim releases, textile craftsmanship stories, and members-only promotions.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 max-w-xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 dark:text-neutral-400">
                  <EnvelopeIcon className="size-5" />
                </div>
                <input
                  id="newsletter-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Enter your email address..."
                  autoComplete="email"
                  className="w-full rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/90 py-3.5 pl-11 pr-4 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-400 shadow-xs outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 px-7 py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg shadow-orange-700/25 transition-all duration-200 hover:from-orange-500 hover:to-orange-600 hover:shadow-orange-600/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                {loading ? (
                  <>
                    <Spinner className="size-4 text-white" />
                    <span>Subscribing...</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>

            {/* Notification alert banner */}
            {showNotification && message && (
              <div
                className={`mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 text-sm transition-all animate-in fade-in duration-300 ${
                  status === "error"
                    ? "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300"
                    : status === "info"
                    ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {status === "error" ? (
                    <ExclamationCircleIcon className="size-5 shrink-0 text-red-500 dark:text-red-400" />
                  ) : status === "info" ? (
                    <InformationCircleIcon className="size-5 shrink-0 text-amber-500 dark:text-amber-400" />
                  ) : (
                    <CheckCircleIcon className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span className="font-medium">{message}</span>
                </div>
                {status === "success" && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("WELCOME10");
                      toast.success("Voucher code WELCOME10 copied to clipboard!");
                    }}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-mono font-bold text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
                  >
                    <span>Copy WELCOME10</span>
                  </button>
                )}
              </div>
            )}

            <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400">
              <ShieldCheckIcon className="size-4 text-gray-400 dark:text-neutral-400" />
              <span>We value your privacy. Strictly zero spam. Unsubscribe anytime with 1 click.</span>
            </p>
          </form>
        </div>

        {/* Right Column: 3 Value Props Micro-Cards */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="group rounded-2xl border border-stone-200/90 dark:border-neutral-800 bg-white/80 dark:bg-neutral-800/40 p-4 sm:p-5 backdrop-blur-xs transition-all duration-300 hover:border-orange-300 dark:hover:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800/70 shadow-xs dark:shadow-none">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-1 ring-orange-200 dark:ring-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                <TagIcon className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Instant 10% Welcome Voucher</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
                  Receive a personal welcome code for your very first outerwear, workwear, or denim order.
                </p>
              </div>
            </div>
          </div>

          <div className="group rounded-2xl border border-stone-200/90 dark:border-neutral-800 bg-white/80 dark:bg-neutral-800/40 p-4 sm:p-5 backdrop-blur-xs transition-all duration-300 hover:border-amber-300 dark:hover:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800/70 shadow-xs dark:shadow-none">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                <BoltIcon className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">VIP Early Drop Access</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
                  Shop limited-run collections and seasonal drops 24 hours before they open to the public.
                </p>
              </div>
            </div>
          </div>

          <div className="group rounded-2xl border border-stone-200/90 dark:border-neutral-800 bg-white/80 dark:bg-neutral-800/40 p-4 sm:p-5 backdrop-blur-xs transition-all duration-300 hover:border-emerald-300 dark:hover:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800/70 shadow-xs dark:shadow-none">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                <ShieldCheckIcon className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Sustainable Craft Stories</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
                  Go behind the scenes into our certified Bangladeshi factories, ethical cotton sourcing, and artisan stitchers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
