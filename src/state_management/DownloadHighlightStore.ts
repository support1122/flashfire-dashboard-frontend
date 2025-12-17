import { create } from "zustand";

interface DownloadHighlightState {
    isHighlighting: boolean;
    triggerHighlight: () => void;
    clearHighlight: () => void;
}

export const useDownloadHighlightStore = create<DownloadHighlightState>((set) => ({
    isHighlighting: false,
    triggerHighlight: () => {
        set({ isHighlighting: true });
    },
    clearHighlight: () => {
        set({ isHighlighting: false });
    },
}));

