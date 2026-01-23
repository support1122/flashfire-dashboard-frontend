import React, { useState, useContext } from "react";
import { X, Copy, Check, Gift, Users, Share2, Award } from "lucide-react";
import { UserContext } from "../state_management/UserContext";
import { useUserProfile } from "../state_management/ProfileContext";
import { generateReferralIdentifier } from "../utils/generateUsername";
import { toastUtils } from "../utils/toast";

interface ReferAndEarnCardProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReferAndEarnCard: React.FC<ReferAndEarnCardProps> = ({ isOpen, onClose }) => {
  const { userDetails } = useContext(UserContext);
  const { userProfile } = useUserProfile();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate referral code from user's name
  const firstName = userProfile?.firstName || userDetails?.name?.split(" ")?.[0] || "";
  const lastName = userProfile?.lastName || userDetails?.name?.split(" ")?.[1] || "";
  const referralCode = generateReferralIdentifier(firstName, lastName);

  // Construct referral link
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toastUtils.success("Referral link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toastUtils.error("Failed to copy link");
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toastUtils.success("Referral code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toastUtils.error("Failed to copy code");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] mt-68 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5">
          <button
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Refer and Earn</h2>
              <p className="text-orange-100 text-sm">Share FlashFire and earn rewards!</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* How it works */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-5 border border-orange-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              How It Works
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">1.</span>
                <span>Share your unique referral link with friends and colleagues</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">2.</span>
                <span>They sign up using your link and get started</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">3.</span>
                <span>You both earn rewards when they become active users!</span>
              </li>
            </ul>
          </div>

          {/* Referral Code */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Your Referral Code
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={referralCode}
                readOnly
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-lg font-mono font-semibold text-gray-900"
              />
              <button
                onClick={handleCopyCode}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Your Referral Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 break-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Rewards Info */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-5 border border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600" />
              Rewards
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p className="font-medium">🎁 For You:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Get premium features when your referrals become active</li>
                <li>Earn credits for every successful referral</li>
                <li>Unlock exclusive benefits as you refer more users</li>
              </ul>
              <p className="font-medium mt-3">🎁 For Your Friends:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Special welcome bonus when they sign up</li>
                <li>Access to premium features at a discount</li>
                <li>Priority support during onboarding</li>
              </ul>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopyLink}
              className="flex-1 min-w-[140px] px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <Share2 className="w-4 h-4" />
              Share Link
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferAndEarnCard;
