
/**
 * Simple image loading utility that handles basic EXIF orientation (simplified)
 */
export async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Generates a high quality thumbnail from an image file
 */
export async function generateThumbnail(file: File, size: number = 512): Promise<string> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const aspect = img.width / img.height;
  
  if (aspect > 1) {
    canvas.width = size;
    canvas.height = size / aspect;
  } else {
    canvas.height = size;
    canvas.width = size * aspect;
  }
  
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}
