const IMAGE_MIME_PREFIX = "image/";

export const isImageFile = (file: File): boolean => {
  return file.type.startsWith(IMAGE_MIME_PREFIX);
};

export const getFirstImageFile = (files: Iterable<File>): File | null => {
  for (const file of files) {
    if (isImageFile(file)) {
      return file;
    }
  }

  return null;
};

export const readFileAsDataUrl = async (file: File): Promise<string> => {
  return await new Promise((resolve, reject) => {
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
};
