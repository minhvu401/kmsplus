/**
 * Cloudinary Utility Functions
 * 
 * Chứa các hàm để upload ảnh lên Cloudinary
 * 
 * Yêu cầu các environment variables:
 * - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 * - NEXT_PUBLIC_CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET (chỉ dùng trên server)
 */

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey) {
  console.warn(
    'Cloudinary configuration missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_API_KEY in .env.local'
  );
}

/**
 * Upload ảnh lên Cloudinary từ client-side thông qua API route
 * @param file - File object từ input
 * @param folder - Folder name trong Cloudinary (ví dụ: "articles", "article-thumbnails")
 * @returns Object với url, public_id, và thông tin khác
 */
export async function uploadImageToCloudinary(
  file: File,
  folder: string = 'articles'
): Promise<{
  url: string;
  public_id: string;
  secure_url: string;
  [key: string]: any;
}> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await fetch('/api/cloudinary/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Upload failed');
    }

    return {
      url: result.url,
      public_id: result.public_id,
      secure_url: result.secure_url,
      ...result.data,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Xóa ảnh từ Cloudinary (cần gọi từ server-side hoặc API route)
 * @param publicId - Public ID của ảnh từ Cloudinary
 */
export async function deleteImageFromCloudinary(
  publicId: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

/**
 * Tạo URL cho ảnh thumbnail với kích thước và transformations tùy chỉnh
 * @param publicId - Public ID của ảnh
 * @param options - Tùy chỉnh kích thước, quality, format, v.v.
 */
export function getCloudinaryImageUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  }
): string {
  if (!cloudName) return '';

  const {
    width = 400,
    height = 300,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = options || {};

  return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},h_${height},c_${crop},q_${quality},f_${format}/${publicId}`;
}

/**
 * Tạo URL cho ảnh trong content với kích thước tùy chỉnh
 * @param publicId - Public ID của ảnh
 */
export function getCloudinaryContentImageUrl(publicId: string): string {
  return getCloudinaryImageUrl(publicId, {
    width: 800,
    height: 600,
    crop: 'fit',
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Tạo URL cho thumbnail với kích thước nhỏ để hiển thị trong list
 * @param publicId - Public ID của ảnh
 */
export function getCloudinaryThumbnailUrl(publicId: string): string {
  return getCloudinaryImageUrl(publicId, {
    width: 300,
    height: 200,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
}
