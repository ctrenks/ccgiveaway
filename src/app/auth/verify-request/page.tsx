import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-slate-900/90 to-purple-900/30 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-purple-500/20">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30 animate-pulse">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Check Your Email</h1>
            <p className="text-slate-400 mb-6">
              A sign-in link has been sent to your email address. Click the link to continue.
            </p>
            <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-300">
                💡 <span className="font-medium">Tip:</span> Check your spam folder if you don&apos;t see the email.
              </p>
            </div>
            <Link
              href="/auth/signin"
              className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
            >
              ← Try a different email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
