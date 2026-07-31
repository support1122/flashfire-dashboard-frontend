'use client'

import React from "react"
import { Users, Gift, CreditCard, X, Copy, Check } from "lucide-react"
import { useState, useEffect, useContext } from "react"
import { createPortal } from "react-dom"
import { UserContext } from "../state_management/UserContext"


interface ReferAndEarnModalProps {
  isOpen: boolean
  onClose: () => void
}


export default function ReferAndEarnModal({
  isOpen,
  onClose,
}: ReferAndEarnModalProps) {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const context = useContext(UserContext)
  // The client's own name is the referral code — friends type it during onboarding.
  const referralName = (context?.userDetails?.name || "").trim()

  const copyName = async () => {
    if (!referralName) return
    try {
      await navigator.clipboard.writeText(referralName)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard API unavailable — no-op
    }
  }


  // Ensure component is mounted before using portal
  useEffect(() => {
    setMounted(true)
  }, [])


  if (!isOpen) return null


  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md overflow-y-auto-hidden"
      onClick={onClose}
    >
      <div 
        className="min-h-screen flex items-center justify-center px-4 py-8"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
                Your name is your referral code. Every friend who names you at
                signup adds{" "}
                <span className="font-semibold text-[#ff4c00]">
                  bonus job applications to your plan automatically.
                </span>
              </p>
            </div>


            {/* REFERRAL NAME */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Your referral name
              </label>

              {referralName ? (
                <>
                  <div className="flex items-center gap-2 group">
                    <input
                      readOnly
                      value={referralName}
                      aria-label="Your referral name"
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium bg-gray-50 text-gray-900 focus:outline-none focus:border-[#ff4c00] focus:bg-white transition-all duration-200 group-hover:border-[#ff4c00]/50"
                    />

                    <button
                      onClick={copyName}
                      aria-label="Copy referral name"
                      className={`flex items-center justify-center rounded-lg px-3 py-2 transition-all duration-300 ${
                        copied
                          ? "bg-green-500 text-white"
                          : "bg-[#ff4c00] text-white hover:bg-[#e64400] active:scale-95"
                      }`}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-gray-500">
                    Ask your friend to enter this exactly as it appears here.
                  </p>
                </>
              ) : (
                <p className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500">
                  Add your name in your profile and it will show up here as your referral name.
                </p>
              )}
            </div>


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
                    Share your name with a friend who's actively job searching.
                  </p>
                </div>


                {/* Step 2 */}
                <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-orange-50/50 transition-colors duration-200">
                  <div className="w-6 h-6 rounded-full bg-[#ff4c00]/10 flex items-center justify-center mt-0.5">
                    <Gift size={14} className="text-[#ff4c00]" />
                  </div>
                  <p className="text-xs font-medium text-gray-900">
                    They enter your name at signup and join an eligible plan.
                  </p>
                </div>


                {/* Step 3 */}
                <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-orange-50/50 transition-colors duration-200">
                  <div className="w-6 h-6 rounded-full bg-[#ff4c00]/10 flex items-center justify-center mt-0.5">
                    <CreditCard size={14} className="text-[#ff4c00]" />
                  </div>
                  <p className="text-xs font-medium text-gray-900">
                    Bonus applications are added to your job tracker automatically.
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
                Refer a friend. Get free applications. We'll handle the tracking and credits for you.
              </p>
              <p className="text-[11px] text-gray-500 pt-1 text-center">
                * Applicable from 24th jan 2026
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
