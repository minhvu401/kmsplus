/**
 * API Route: Delete image from Cloudinary
 * 
 * POST /api/cloudinary/delete
 * Body: { publicId: string }
 * 
 * Yêu cầu authentication và CLOUDINARY_API_SECRET trong .env
 */

import { v2 as cloudinary } from 'cloudinary';
import { requireAuth } from '@/lib/auth';

// Configure Cloudinary với API Secret
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await requireAuth();
    if (!user) {
      return Response.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { publicId } = await request.json();

    if (!publicId) {
      return Response.json(
        { success: false, message: 'publicId is required' },
        { status: 400 }
      );
    }

    // Delete image from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    return Response.json(
      {
        success: result.result === 'ok',
        message: result.result === 'ok' ? 'Image deleted successfully' : 'Failed to delete image',
        result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    return Response.json(
      { success: false, message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
