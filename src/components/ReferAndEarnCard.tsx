'use client'

import { Copy, Users, Gift, CreditCard, X, Check } from "lucide-react"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"

interface ReferAndEarnModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ReferAndEarnModal({
  isOpen,
  onClose,
}: ReferAndEarnModalProps) {
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before using portal
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen) return null

  const referralLink = "https://flashfirejobs.com/ref/FFJ123"

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md overflow-y-auto-hidden"
      onClick={onClose}
    >
      <div 
        className="min-h-screen flex items-center justify-center px-4 py-8"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* CARD */}
        <div className="relative w-full max-w-md mx-auto rounded-2xl bg-white shadow-2xl overflow-hidden animate-in zoom-in duration-300">
          
          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-full p-2 text-gray-400 hover:text-[#ff4c00] hover:bg-orange-50 transition-all duration-200"
          >
            <X size={18} />
          </button>

          {/* CONTENT */}
          <div className="p-6">
            
            {/* HEADER */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Refer & Earn Free Applications
              </h2>
              <p className="text-sm text-gray-600">
                Invite friends to Flashfire and get{" "}
                <span className="font-semibold text-[#ff4c00]">
                  bonus job applications added to your plan automatically.
                </span>
              </p>
            </div>

            {/* REFERRAL LINK */}
            {/* <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Your FlashFire Referral Link
              </label>

              <div className="flex items-center gap-2 group">
                <input
                  readOnly
                  value={referralLink}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs bg-gray-50 text-gray-700 focus:outline-none focus:border-[#ff4c00] focus:bg-white transition-all duration-200 group-hover:border-[#ff4c00]/50"
                />

                <button
                  onClick={copyLink}
                  className={`flex items-center justify-center rounded-lg px-3 py-2 transition-all duration-300 ${
                    copied
                      ? "bg-green-500 text-white"
                      : "bg-[#ff4c00] text-white hover:bg-[#e64400] active:scale-95"
                  }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div> */}

            {/* HOW IT WORKS */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                How it works (3 steps)
              </h3>

              <div className="space-y-2">
                {/* Step 1 */}
                <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-orange-50/50 transition-colors duration-200">
                  <div className="w-6 h-6 rounded-full bg-[#ff4c00]/10 flex items-center justify-center mt-0.5">
                    <Users size={14} className="text-[#ff4c00]" />
                  </div>
                  <p className="text-xs font-medium text-gray-900">
                    <span className="font-semibold">Share your referral link</span> with a friend who’s actively job searching.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-orange-50/50 transition-colors duration-200">
                  <div className="w-6 h-6 rounded-full bg-[#ff4c00]/10 flex items-center justify-center mt-0.5">
                    <Gift size={14} className="text-[#ff4c00]" />
                  </div>
                  <p className="text-xs font-medium text-gray-900">
                    <span className="font-semibold">Friend enrolls</span> in an eligible Flashfire plan.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-orange-50/50 transition-colors duration-200">
                  <div className="w-6 h-6 rounded-full bg-[#ff4c00]/10 flex items-center justify-center mt-0.5">
                    <CreditCard size={14} className="text-[#ff4c00]" />
                  </div>
                  <p className="text-xs font-medium text-gray-900">
                    <span className="font-semibold">Bonus applications are added</span> to your job tracker automatically.
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-orange-50 px-3 py-2 text-[11px] text-gray-700">
                <p className="font-semibold text-[#ff4c00] mb-1">
                  Referral rewards
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <span className="font-semibold">Professional plan:</span> +200 applications per referral
                  </li>
                  <li>
                    <span className="font-semibold">Executive plan:</span> +300 applications per referral
                  </li>
                </ul>
              </div>

              <p className="text-[11px] text-gray-500 pt-2 text-center">
                Refer a friend. Get free applications. We’ll handle the tracking and credits for you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render modal using portal to document.body to ensure it's above everything
  return mounted ? createPortal(modalContent, document.body) : null
}
