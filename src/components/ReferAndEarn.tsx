import { Share2, Gift, CheckCircle2, Copy, Check } from "lucide-react"
import { useState, useContext } from "react"
import { UserContext } from "../state_management/UserContext"
import { PAGE_CONTAINER, PAGE_MAIN } from "../styles/layout"

const STEPS = [
  {
    icon: Share2,
    title: "Share your referral link",
    description: "Send your unique link to a friend who's actively job searching.",
  },
  {
    icon: Gift,
    title: "Friend joins a plan",
    description: "Your friend enrolls in an eligible Flashfire plan using your link.",
  },
  {
    icon: CheckCircle2,
    title: "Applications added automatically",
    description: "Bonus applications appear in your job tracker — no action needed.",
  },
]

const REWARDS = [
  { amount: 200, plan: "Professional plan" },
  { amount: 300, plan: "Executive plan" },
]

export default function ReferAndEarn() {
  const [copied, setCopied] = useState(false)
  const context = useContext(UserContext)
  const userDetails = context?.userDetails

  const slug = (userDetails?.name || "flashfire-user")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  const suffixSeed = userDetails?.email || userDetails?.name || slug
  const suffix = Array.from(suffixSeed as string)
    .reduce((acc: number, ch: string) => (acc * 31 + ch.charCodeAt(0)) % 46656, 7)
    .toString(36)
    .padStart(4, "0")
  const referralLink = `flashfire.io/ref/${slug}-${suffix}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${referralLink}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard API unavailable — no-op
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className={`${PAGE_CONTAINER} py-5`}>
        <h1 className="text-lg font-bold text-gray-900 leading-tight">Refer n Earn</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Invite friends to Flashfire and get bonus job applications added to your plan automatically.
        </p>
        </div>
      </div>

      <div className={PAGE_MAIN}>
        <main className="bg-white border border-gray-300 p-3 sm:p-4 md:p-6">
          {/* HOW IT WORKS */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">How it works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="border border-gray-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center bg-orange-50 border border-orange-100 text-orange-600">
                      <step.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Step {i + 1}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gray-900">{step.title}</p>
                  <p className="mt-1 text-xs text-gray-500">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* REFERRAL REWARDS */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Referral rewards</h3>
            <div className="flex flex-wrap gap-4">
              {REWARDS.map((reward) => (
                <div
                  key={reward.plan}
                  className="border border-gray-900 p-4 w-40 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <p className="text-3xl font-bold text-gray-900">{reward.amount}</p>
                  <p className="text-xs text-gray-500 mt-1">applications per referral</p>
                  <p className="text-xs font-semibold text-orange-600 mt-1">{reward.plan}</p>
                </div>
              ))}
            </div>
          </div>

          {/* REFERRAL LINK */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Your referral link</h3>
            <div className="flex max-w-xl">
              <input
                readOnly
                value={referralLink}
                className="flex-1 min-w-0 border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none"
              />
              <button
                onClick={copyLink}
                className="flex items-center gap-2 border border-l-0 border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
