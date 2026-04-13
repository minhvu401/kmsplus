import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
cloudinary.uploader.upload_stream(
  {
    resource_type: 'raw',
    folder: 'kmsplus/attachments',
    public_id: 'test_file.txt'
  },
  (e, r) => console.log(r ? r.secure_url : e)
).end(Buffer.from('Hello world!'));
