import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Collector Card Giveaway",
  description: "Terms of Service for Collector Card Giveaway website and services.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-purple-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-white">Terms of Service</span>
        </nav>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-slate-500 mb-8">Last updated: December 2024</p>

          <div className="prose prose-invert prose-purple max-w-none space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Collector Card Giveaway (&quot;the Service&quot;), you agree to be
                bound by these Terms of Service. If you do not agree to these terms, please do
                not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Eligibility</h2>
              <p>
                To use our Service, you must:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>Be at least 18 years of age or the age of majority in your jurisdiction</li>
                <li>Have a valid email address for account registration</li>
                <li>Not be prohibited from using our services under applicable law</li>
                <li>Reside in a jurisdiction where participation in our giveaways is legal</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Account Registration</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and for
                all activities that occur under your account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>Provide accurate and complete information during registration</li>
                <li>Keep your account information up to date</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Not share your account or transfer it to another person</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Giveaway Rules</h2>
              <p>
                Our giveaways are subject to the following rules:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>No purchase is necessary to enter giveaways (free entries are provided)</li>
                <li>Winners are determined by the Ohio Lottery Pick 3 Evening drawing</li>
                <li>Each user may only have one account - multiple accounts will result in disqualification</li>
                <li>Giveaway Credits are non-transferable and have no cash value</li>
                <li>We reserve the right to cancel giveaways and refund credits at our discretion</li>
                <li>Winners are responsible for any applicable taxes on prizes</li>
                <li>Prizes must be claimed within 30 days of the draw date</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Store Purchases</h2>
              <p>
                When making purchases from our store:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>All prices are in USD unless otherwise stated</li>
                <li>We reserve the right to refuse or cancel orders</li>
                <li>Product availability is not guaranteed until payment is confirmed</li>
                <li>Shipping times are estimates and not guarantees</li>
                <li>Returns are accepted within 14 days for unopened products in original condition</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Prohibited Conduct</h2>
              <p>
                You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>Create multiple accounts or use automated systems to enter giveaways</li>
                <li>Attempt to manipulate or cheat in any giveaway</li>
                <li>Use the Service for any illegal purpose</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
              </ul>
              <p className="mt-4">
                Violation of these rules may result in account suspension or termination.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Intellectual Property</h2>
              <p>
                All content on this Service, including text, graphics, logos, and software, is
                the property of Collector Card Giveaway or its licensors. Trading card game names,
                logos, and related marks are trademarks of their respective owners.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Disclaimer of Warranties</h2>
              <p>
                THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. WE DO NOT
                GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, COLLECTOR CARD GIVEAWAY SHALL NOT BE
                LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES
                ARISING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the
                Service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Contact</h2>
              <p>
                If you have questions about these Terms, please{" "}
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
