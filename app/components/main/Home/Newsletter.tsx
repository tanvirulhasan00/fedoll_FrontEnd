import {
  CalendarDaysIcon,
  CheckBadgeIcon,
  HandRaisedIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Spinner } from "~/components/ui/spinner";
import { createNewsletter } from "~/redux/features/newsletterSlice";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";

export default function NewsLetter() {
  const [formData, setFormData] = useState({
    email: "",
  });
  const dispatch = useAppDispatch();
  const { loading, Data } = useAppSelector((state) => state.newsletter);
  console.log("newsletter", Data);
  const token = "";
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShow(false);
    }, 2000);
  }, [show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formPayload = new FormData();
    Object.entries(formData).forEach(([k, v]) =>
      formPayload.append(k, String(v ?? "")),
    );

    dispatch(createNewsletter({ token, formPayload }));
    setFormData({ email: "" });
    setShow(true);
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
              <div className="mt-6">
                {show ? (
                  <CheckBadgeIcon className="size-5 text-green-500 " />
                ) : (
                  ""
                )}
              </div>
              <div className=" flex max-w-md gap-x-4 items-center">
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
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="min-w-0 flex-auto rounded-md bg-white/5 px-3.5 py-2 text-base border text-black outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-700 sm:text-sm/6"
                />
                <button
                  type="submit"
                  className="flex-none rounded-md bg-orange-700 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-orange-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
                >
                  {loading ? <Spinner /> : "Subscribe"}
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
