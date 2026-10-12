import {
  CalendarDaysIcon,
  CheckBadgeIcon,
  HandRaisedIcon,
  XCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import { createNewsletter } from "~/redux/features/newsletterSlice";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";

export default function NewsLetter() {
  const [formData, setFormData] = useState({
    email: "",
  });
  const dispatch = useAppDispatch();
  const { loading, Data } = useAppSelector((state) => state.newsletter);
  const token = "";
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"success" | "info" | "error" | null>(
    null
  );

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setShow(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailToSubmit = formData.email.trim();
    if (!emailToSubmit) return;

    const formPayload = new FormData();
    formPayload.append("email", emailToSubmit);

    try {
      const resultAction = await dispatch(
        createNewsletter({ token, formPayload, email: emailToSubmit })
      );

      if (createNewsletter.fulfilled.match(resultAction)) {
        const payload = resultAction.payload;
        if (payload?.alreadySubscribed) {
          toast.info(payload.message || "You are already subscribed!");
          setStatus("info");
          setMessage(payload.message || "You are already subscribed to our newsletter!");
        } else {
          toast.success(payload?.message || "Thank you for subscribing!");
          setStatus("success");
          setMessage(payload?.message || "Thank you for subscribing to our newsletter!");
          setFormData({ email: "" });
        }
        setShow(true);
      } else if (createNewsletter.rejected.match(resultAction)) {
        const errMsg =
          (resultAction.payload as string) || "Failed to subscribe to newsletter.";
        toast.error(errMsg);
        setStatus("error");
        setMessage(errMsg);
        setShow(true);
      }
    } catch (err: unknown) {
      const error = err as Error;
      const errMsg = error.message || "An unexpected error occurred.";
      toast.error(errMsg);
      setStatus("error");
      setMessage(errMsg);
      setShow(true);
    }
  };

  return (
    <div className="relative isolate overflow-hidden bg-white px-0 py-10 sm:py-16 lg:py-24 ">
      <div className="mx-auto ">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
          <form onSubmit={handleSubmit}>
            <div className="max-w-xl lg:max-w-2xl">
              <h2 className="text-4xl font-semibold tracking-tight text-black">
                Subscribe to our{" "}
                <span className="text-orange-700">Newsletter</span>
              </h2>
              <p className="mt-4 text-lg text-gray-500 leading-relaxed text-justify whitespace-pre-line">
                Join thousands of readers who receive the latest industry
                insights, helpful resources, and exclusive updates delivered
                straight to their inbox.
              </p>

              {show && message && (
                <div
                  className={`mt-4 flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm border transition-all duration-300 ${
                    status === "error"
                      ? "border-red-200 bg-red-50 text-red-800"
                      : status === "info"
                      ? "border-blue-200 bg-blue-50 text-blue-800"
                      : "border-green-200 bg-green-50 text-green-800"
                  }`}
                >
                  {status === "error" ? (
                    <XCircleIcon className="size-5 text-red-600 shrink-0" />
                  ) : status === "info" ? (
                    <InformationCircleIcon className="size-5 text-blue-600 shrink-0" />
                  ) : (
                    <CheckBadgeIcon className="size-5 text-green-600 shrink-0" />
                  )}
                  <span className="font-medium">{message}</span>
                </div>
              )}

              <div className="mt-6 flex max-w-md gap-x-4 items-center">
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="min-w-0 flex-auto rounded-md bg-white px-3.5 py-2 text-base border border-gray-300 text-black outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-700 sm:text-sm/6 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-none rounded-md bg-orange-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-orange-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Spinner className="size-4 text-white" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </div>
            </div>
          </form>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:pt-2">
            <div className="flex flex-col items-start">
              <div className="rounded-md bg-white/5 p-2 ring-1 ring-white/10">
                <CalendarDaysIcon
                  aria-hidden="true"
                  className="size-6 text-black"
                />
              </div>
              <dt className="mt-4 text-base font-semibold text-black">
                Weekly articles
              </dt>
              <dd className="mt-2 text-base/7 text-gray-500 leading-relaxed text-justify whitespace-pre-line">
                Get fresh content every week, including expert tips, case
                studies, and industry news to help you stay ahead.
              </dd>
            </div>
            <div className="flex flex-col items-start">
              <div className="rounded-md bg-white/5 p-2 ring-1 ring-white/10">
                <HandRaisedIcon
                  aria-hidden="true"
                  className="size-6 text-red-500"
                />
              </div>
              <dt className="mt-4 text-base font-semibold text-black">
                No <span className="text-orange-700">spam</span>
              </dt>
              <dd className="mt-2 text-base/7 text-gray-500 leading-relaxed text-justify whitespace-pre-line">
                We respect your inbox. You’ll only receive valuable content,
                never irrelevant promotions or spam.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
