import React from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ProfileLink } from "../types/ResumeTypes";

interface PersonalInfoProps {
    data: {
        name: string;
        title: string;
        phone: string;
        email: string;
        location: string;
        linkedin: string;
        portfolio: string;
        github: string;
        publications: string;
        profileLinks?: ProfileLink[];
    };
    onChange: (field: string, value: string) => void;
    onProfileLinksChange?: (links: ProfileLink[]) => void;
}

export const PersonalInfo: React.FC<PersonalInfoProps> = ({
    data,
    onChange,
    onProfileLinksChange,
}) => {
    const profileLinks = data.profileLinks ?? [];

    const handleAddProfileLink = () => {
        if (!onProfileLinksChange) return;
        const newLink: ProfileLink = {
            id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            label: "",
            url: "",
        };
        onProfileLinksChange([...profileLinks, newLink]);
    };

    const handleRemoveProfileLink = (id: string) => {
        if (!onProfileLinksChange) return;
        onProfileLinksChange(profileLinks.filter((l) => l.id !== id));
    };

    const handleProfileLinkChange = (id: string, field: "label" | "url", value: string) => {
        if (!onProfileLinksChange) return;
        onProfileLinksChange(
            profileLinks.map((l) =>
                l.id === id ? { ...l, [field]: value } : l
            )
        );
    };
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Personal Information
            </h3>

            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                    </label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => onChange("name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your full name"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Professional Title
                    </label>
                    <input
                        type="text"
                        value={data.title}
                        onChange={(e) => onChange("title", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Product Manager | Customer-Centric Solutions"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={data.phone}
                            onChange={(e) => onChange("phone", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="+1 (555) 123-4567"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => onChange("email", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="your.email@example.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                    </label>
                    <input
                        type="text"
                        value={data.location}
                        onChange={(e) => onChange("location", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="City, State, Country"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        LinkedIn URL
                    </label>
                    <input
                        type="url"
                        value={data.linkedin}
                        onChange={(e) => onChange("linkedin", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://linkedin.com/in/yourprofile"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Portfolio URL
                    </label>
                    <input
                        type="url"
                        value={data.portfolio}
                        onChange={(e) => onChange("portfolio", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://yourportfolio.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        GitHub URL (Optional)
                    </label>
                    <input
                        type="url"
                        value={data.github}
                        onChange={(e) => onChange("github", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://github.com/yourusername"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Publications (Optional)
                    </label>
                    <input
                        type="url"
                        value={data.publications}
                        onChange={(e) => onChange("publications", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://yourpublications.com"
                    />
                </div>

                {/* Additional profile links (LeetCode, etc.) – scalable */}
                {onProfileLinksChange && (
                    <div className="border-t border-gray-200 pt-4 mt-2">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Additional profile links
                            </label>
                            <button
                                type="button"
                                onClick={handleAddProfileLink}
                                className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title="Add link (e.g. LeetCode)"
                            >
                                <Plus className="w-4 h-4" aria-hidden />
                                Add link
                            </button>
                        </div>
                        {profileLinks.length > 0 && (
                            <div className="space-y-3">
                                {profileLinks.map((link) => (
                                    <div
                                        key={link.id}
                                        className="flex gap-2 items-start flex-wrap"
                                    >
                                        <input
                                            type="text"
                                            value={link.label}
                                            onChange={(e) =>
                                                handleProfileLinkChange(link.id, "label", e.target.value)
                                            }
                                            className="flex-1 min-w-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Label (e.g. LeetCode)"
                                        />
                                        <input
                                            type="url"
                                            value={link.url}
                                            onChange={(e) =>
                                                handleProfileLinkChange(link.id, "url", e.target.value)
                                            }
                                            className="flex-1 min-w-[140px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="https://..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveProfileLink(link.id)}
                                            className="p-2 text-gray-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 rounded"
                                            title="Remove link"
                                            aria-label="Remove link"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
