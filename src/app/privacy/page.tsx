import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Collector Card Giveaway",
  description: "Privacy Policy for Collector Card Giveaway - how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-purple-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-white">Privacy Policy</span>
        </nav>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-slate-500 mb-8">Last updated: December 2024</p>

          <div className="prose prose-invert prose-purple max-w-none space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p>
                Collector Card Giveaway (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your 
                privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard 
                your information when you use our website and services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">Personal Information</h3>
              <p>We collect information you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li><strong>Account Information:</strong> Email address, display name, and avatar</li>
                <li><strong>Shipping Address:</strong> Name, street address, city, state, ZIP code, and country (retained for order fulfillment)</li>
                <li><strong>Payment Information:</strong> Processed securely through PayPal - we do not store payment card details</li>
                <li><strong>Communications:</strong> Messages you send through our contact form</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Automatically Collected Information</h3>
              <p>When you use our Service, we automatically collect:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>IP address and approximate location</li>
                <li>Browser type and device information</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referring website or source</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>Create and manage your account</li>
                <li>Process orders and ship products to you</li>
                <li>Operate giveaways and notify winners</li>
                <li>Communicate with you about orders, giveaways, and updates</li>
                <li>Improve our Service and develop new features</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Data Retention</h2>
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-4">
                <p className="text-amber-200">
                  <strong>Important:</strong> We retain your shipping address information to 
                  facilitate future orders and prize shipments. This information is stored 
                  securely and can be deleted upon request.
                </p>
              </div>
              <p>We retain your information for as long as:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>Your account is active</li>
                <li>Needed to provide you services</li>
                <li>Required by law or for legitimate business purposes</li>
                <li>Necessary to resolve disputes or enforce agreements</li>
              </ul>
              <p className="mt-4">
                You may request deletion of your account and personal data by contacting us. 
                Some information may be retained as required by law or for legitimate business 
                purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Information Sharing</h2>
              <p>We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li><strong>Service Providers:</strong> Companies that help us operate our business (payment processors, shipping carriers, email services)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you give us permission to share</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>Keep you signed in to your account</li>
                <li>Remember your preferences</li>
                <li>Analyze how our Service is used</li>
                <li>Improve user experience</li>
              </ul>
              <p className="mt-4">
                You can control cookies through your browser settings. Disabling cookies may 
                affect your ability to use certain features.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your 
                personal information against unauthorized access, alteration, disclosure, or 
                destruction. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Your Rights</h2>
              <p>Depending on your location, you may have the right to:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>Access the personal information we hold about you</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Object to or restrict certain processing</li>
                <li>Data portability</li>
                <li>Withdraw consent where applicable</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please{" "}
                <Link href="/contact" className="text-purple-400 hover:text-purple-300 underline">
                  contact us
                </Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Children&apos;s Privacy</h2>
              <p>
                Our Service is not intended for children under 18 years of age. We do not 
                knowingly collect personal information from children. If we learn we have 
                collected information from a child, we will delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Third-Party Links</h2>
              <p>
                Our Service may contain links to third-party websites. We are not responsible 
                for the privacy practices of these sites. We encourage you to read their 
                privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of 
                significant changes by posting the new policy on this page and updating the 
                &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our data practices, please{" "}
                <Link href="/contact" className="text-purple-400 hover:text-purple-300 underline">
                  contact us
                </Link>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

