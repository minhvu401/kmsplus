/**
 * API Route: Upload image to Cloudinary (server-side)
 * 
 * POST /api/cloudinary/upload
 * Body: FormData with 'file' field
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'articles';

    if (!file) {
      return Response.json(
        { success: false, message: 'File is required' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64, {
      folder: folder,
      resource_type: 'image',
    });

    return Response.json(
      {
        success: true,
        message: 'Image uploaded successfully',
        url: result.url,
        secure_url: result.secure_url,
        public_id: result.public_id,
        data: result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return Response.json(
      { success: false, message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
