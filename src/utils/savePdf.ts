
export async function savePdf(blob: Blob, defaultFilename: string) {
    // Try to use the File System Access API (supported in Chrome/Edge/Opera)
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: defaultFilename,
                types: [{
                    description: 'PDF Document',
                    accept: { 'application/pdf': ['.pdf'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return true; // Success
        } catch (err: any) {
            // User cancelled or error
            if (err.name === 'AbortError') {
                return false; // User cancelled
            }
            console.warn('showSaveFilePicker failed, falling back to download link:', err);
            // Fallback to link click
        }
    }

    // Fallback for Firefox/Safari or if API failed
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
}
