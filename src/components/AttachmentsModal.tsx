import { X } from "lucide-react";
import { optimizeImageUrl } from "../utils/imageCache";

type AttachmentsModalProps = {
    imageLink: string;
    setAttachmentsModalActiveStatus: (open: boolean) => void;
};

export default function AttachmentsModal({
    imageLink,
    setAttachmentsModalActiveStatus,
}: AttachmentsModalProps) {
    const close = () => setAttachmentsModalActiveStatus(false);

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
            onClick={close}
            role="presentation"
        >
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    close();
                }}
                className="absolute top-4 right-4 z-10 cursor-pointer rounded-full border-0 bg-white/90 p-2 shadow-md hover:bg-white"
                aria-label="Close preview"
            >
                <X className="h-5 w-5" />
            </button>
            <div
                className="max-h-[90vh] max-w-[90vw] shrink-0"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={optimizeImageUrl(imageLink)}
                    alt="Attachment preview"
                    className="max-h-[90vh] max-w-[90vw] object-contain"
                />
            </div>
        </div>
    );
}
