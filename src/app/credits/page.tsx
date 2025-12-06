import Link from "next/link";

export default function CreditsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/giveaways"
            className="text-slate-400 hover:text-white transition-colors mb-4 inline-block"
          >
            ← Back to Giveaways
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">💰 Giveaway Credits</h1>
          <p className="text-xl text-slate-400">
            Learn about all the ways to earn credits and enter our giveaways!
          </p>
        </div>

        {/* What Are Credits */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">What Are Giveaway Credits?</h2>
          <p className="text-slate-300 mb-4">
            Giveaway credits are used to enter picks in our giveaways. Each pick typically costs <strong>1 credit</strong>, 
            and you can use as many picks as you want to increase your chances of winning!
          </p>
          <p className="text-slate-300">
            Credits <strong>never expire</strong> and can be used in any active giveaway.
          </p>
        </div>

        {/* Ways to Get Credits */}
        <h2 className="text-2xl font-bold text-white mb-6">How to Get Credits</h2>

        <div className="grid gap-6 mb-8">
          {/* Free Credits */}
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🎁</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Free Credits (Per Giveaway)</h3>
                <p className="text-green-200/80 mb-3">
                  Every user gets <strong>10 free picks</strong> per giveaway - no purchase necessary!
                </p>
                <p className="text-sm text-green-300/60">
                  ✓ Automatically available when you sign in<br />
                  ✓ Use them in any active giveaway<br />
                  ✓ Refresh with each new giveaway
                </p>
              </div>
            </div>
          </div>

          {/* Store Purchases */}
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🛒</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Store Purchases</h3>
                <p className="text-purple-200/80 mb-3">
                  Earn <strong>1 credit for every $1 spent</strong> in our card store!
                </p>
                <p className="text-sm text-purple-300/60 mb-3">
                  ✓ Automatic with every purchase<br />
                  ✓ Credits added instantly to your account<br />
                  ✓ Minimum 1 credit per purchase
                </p>
                <Link
                  href="/store"
                  className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  Browse Store →
                </Link>
              </div>
            </div>
          </div>

          {/* VIP Membership */}
          <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⭐</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">VIP Membership (Best Value!)</h3>
                <p className="text-amber-200/80 mb-4">
                  Get <strong>monthly credits that never expire</strong> plus exclusive benefits!
                </p>
                
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-blue-400 font-bold mb-1">Basic</div>
                    <div className="text-white text-2xl font-bold mb-1">100</div>
                    <div className="text-slate-400 text-sm">credits/month</div>
                    <div className="text-amber-400 text-xs mt-2">$20/mo</div>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-4 border-2 border-purple-500/50">
                    <div className="text-purple-400 font-bold mb-1">Plus ⭐</div>
                    <div className="text-white text-2xl font-bold mb-1">200</div>
                    <div className="text-slate-400 text-sm">credits/month</div>
                    <div className="text-amber-400 text-xs mt-2">$40/mo</div>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-amber-400 font-bold mb-1">Premium</div>
                    <div className="text-white text-2xl font-bold mb-1">340</div>
                    <div className="text-slate-400 text-sm">credits/month</div>
                    <div className="text-amber-400 text-xs mt-2">$65/mo</div>
                  </div>
                </div>

                <div className="text-sm text-amber-300/70 mb-4">
                  <strong>Plus VIP Benefits:</strong><br />
                  ✓ Up to 7% off all store purchases<br />
                  ✓ Free shipping on store orders<br />
                  ✓ Credits never expire<br />
                  ✓ Priority customer support
                </div>

                <Link
                  href="/subscribe"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-lg transition-all"
                >
                  Join VIP Now →
                </Link>
              </div>
            </div>
          </div>

          {/* Referral Program */}
          <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🔗</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Refer Friends</h3>
                <p className="text-blue-200/80 mb-3">
                  Earn <strong>100 credits</strong> for each friend who signs up using your referral link!
                </p>
                <p className="text-sm text-blue-300/60 mb-3">
                  ✓ Unlimited referrals<br />
                  ✓ Credits awarded when friend completes registration<br />
                  ✓ Track your referrals in your profile
                </p>
                <Link
                  href="/profile"
                  className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  Get Your Referral Link →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Do credits expire?</h3>
              <p className="text-slate-400">
                No! Your giveaway credits never expire and can be used in any future giveaway.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Can I use credits in any giveaway?</h3>
              <p className="text-slate-400">
                Yes! Your credit balance works across all giveaways. Use them whenever and wherever you want.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">How do free entries work?</h3>
              <p className="text-slate-400">
                Each giveaway gives you 10 free picks. These are separate from your credit balance and refresh for each new giveaway.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">What's the best way to get credits?</h3>
              <p className="text-slate-400">
                VIP membership gives you the best value! Premium members get 340 credits per month for just $65 - 
                that's less than $0.20 per credit compared to buying individually.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Can I transfer credits to another account?</h3>
              <p className="text-slate-400">
                No, credits are non-transferable and tied to your account for fairness.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/giveaways"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors"
          >
            View Active Giveaways
          </Link>
        </div>
      </div>
    </div>
  );
}

