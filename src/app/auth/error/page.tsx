"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "Access denied. You do not have permission to sign in.",
    Verification: "The sign in link is no longer valid. It may have been used already or it may have expired.",
    Default: "An error occurred during sign in. Please try again.",
  };

  const errorMessage = errorMessages[error || "Default"] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-slate-900/90 to-red-900/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-red-500/20">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Authentication Error</h1>
            <p className="text-slate-400 mb-6">{errorMessage}</p>
            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="block w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg transition-all text-center"
              >
                Try Again
              </Link>
              <Link
                href="/"
                className="block text-slate-400 hover:text-purple-400 transition-colors text-sm"
              >
                ← Back to Store
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-950 flex items-center justify-center p-4">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
