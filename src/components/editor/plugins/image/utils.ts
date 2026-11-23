const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const isImageFile = (file: File): boolean =>
  ALLOWED_IMAGE_MIME_TYPES.has(file.type.toLowerCase()) &&
  file.size <= MAX_IMAGE_FILE_SIZE_BYTES;

export const getImageFiles = (files: Iterable<File>): File[] => {
  const validFiles: File[] = [];
  for (const file of files) {
    if (isImageFile(file)) {
      validFiles.push(file);
    }
  }
  return validFiles;
};

export const getFirstImageFile = (files: Iterable<File>): File | null => {
  for (const file of files) {
    if (isImageFile(file)) {
      return file;
    }
  }

  return null;
};

export const readFileAsDataUrl = async (file: File): Promise<string> =>
  await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Image file could not be read as a data URL."));
    });

    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("Failed to read image file."));
    });

    reader.readAsDataURL(file);
  });
