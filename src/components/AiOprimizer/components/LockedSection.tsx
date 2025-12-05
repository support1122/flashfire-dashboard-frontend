import { useState } from "react";
import UnlockModal from "./UnlockModal";

interface LockedSectionProps {
    isLocked: boolean;
    sectionName: string;
    children: React.ReactNode;
}

export default function LockedSection({
    isLocked,
    sectionName,
    children,
}: LockedSectionProps) {
    const [showUnlockModal, setShowUnlockModal] = useState(false);

    if (!isLocked) {
        return <>{children}</>;
    }

    return (
        <div className="relative">
            {/* Original content with overlay */}
            <div className="relative">
                {/* Blurred content */}
                <div className="filter blur-sm pointer-events-none select-none">
                    {children}
                </div>

                {/* Lock overlay */}
                <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
                    <div className="text-center p-6">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 mb-4">
                            <svg
                                className="h-6 w-6 text-yellow-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {sectionName} Locked
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 max-w-sm">
                            This section is currently locked. Enter the unlock
                            key to edit resume content.
                        </p>
                        <button
                            onClick={() => setShowUnlockModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                                />
                            </svg>
                            Unlock Section
                        </button>
                    </div>
                </div>
            </div>

            {/* Unlock Modal */}
            <UnlockModal
                isOpen={showUnlockModal}
                onClose={() => setShowUnlockModal(false)}
            />
        </div>
    );
}
