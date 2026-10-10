interface ErrorPageProps {
  status?: number;
  title?: string;
  message?: string;
  stack?: string;
  showActions?: boolean; // optional: show "home" / "support" links
}

export default function ErrorPage({
  status,
  title,
  message,
  stack,
  showActions = true,
}: ErrorPageProps) {
  const is404 = status === 404;
  console.log("ErrorPage Props:", {
    status,
    title,
    message,
    stack,
    showActions,
  });
  return (
    <main
      className={`min-h-screen flex flex-col justify-center items-center px-4 py-12 sm:py-16 ${
        is404 ? "bg-gray-900" : "bg-white"
      }`}
    >
      <div className="w-full flex flex-col items-center text-center">
        {/* Status code */}
        <p
          className={`text-base font-semibold break-words ${
            is404 ? "text-orange-700" : "text-red-500"
          }`}
        >
          {is404 ? "404" : status || "Error"}
        </p>

        {/* Title */}
        <h1
          className={`mt-2 font-bold tracking-tight text-3xl sm:text-4xl md:text-5xl text-center break-words ${
            is404 ? "text-white" : "text-red-600"
          }`}
        >
          {title || (is404 ? "Page not found" : "Something went wrong")}
        </h1>

        {/* Message */}
        <p
          className={`mt-3 text-sm sm:text-base md:text-lg text-center break-words whitespace-pre-wrap ${
            is404 ? "text-gray-400" : "text-gray-700"
          }`}
        >
          {message ||
            (is404
              ? "Sorry, we couldn’t find the page you’re looking for."
              : "An unexpected error occurred.")}
        </p>

        {/* Actions */}
        {is404 && showActions && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-full">
            <a
              href="/"
              className="flex-1 sm:flex-none w-full sm:w-auto text-center rounded-md bg-orange-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go back home
            </a>
            <a
              href="/support"
              className="flex-1 sm:flex-none w-full sm:w-auto text-center text-sm font-semibold text-white hover:underline"
            >
              Contact support <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        )}

        {/* Stack trace */}
        {!is404 && stack && (
          <pre className="w-full mt-6 p-3 overflow-x-auto rounded bg-gray-100 text-xs sm:text-sm text-red-600 break-words whitespace-pre-wrap">
            <code>{stack}</code>
          </pre>
        )}
      </div>
    </main>
  );
}
