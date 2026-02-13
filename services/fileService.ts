
/**
 * Note: Browser File System Access API might be blocked in cross-origin iframes.
 * We provide a fallback using standard anchor-based downloads.
 */

export const saveFileToLocal = async (directoryHandle: FileSystemDirectoryHandle, fileName: string, content: Blob | string) => {
  try {
    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch (err) {
    console.error("Failed to save file via File System API:", err);
    return false;
  }
};

/**
 * Triggers a standard browser download as a fallback.
 */
export const downloadBlob = (blob: Blob | string, fileName: string) => {
  const url = typeof blob === 'string' 
    ? URL.createObjectURL(new Blob([blob], { type: 'text/plain' }))
    : URL.createObjectURL(blob);
    
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const pickDirectory = async (): Promise<FileSystemDirectoryHandle | null> => {
  try {
    // Check if the API is supported and not blocked by permissions/iframe
    if (!('showDirectoryPicker' in window)) {
      throw new Error("File System Access API not supported in this browser.");
    }
    // @ts-ignore
    return await window.showDirectoryPicker();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log("User cancelled directory picker.");
    } else {
      console.error("Directory picker error:", err.message);
      // Re-throw to allow component to handle specifically (e.g. show alert)
      throw err;
    }
    return null;
  }
};
