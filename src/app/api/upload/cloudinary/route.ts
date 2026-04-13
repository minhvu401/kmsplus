import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "Lỗi: Không tìm thấy file" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Lấy tên gốc của file
    const originalName = file.name
    const parts = originalName.split('.')
    const ext = parts.length > 1 ? parts.pop()?.toLowerCase() || '' : ''
    
    // Tách tên hiển thị an toàn
    const safeBaseName = parts.join('.').replace(/[^a-zA-Z0-9-]/g, '_').substring(0, 40)
    
    // Đảm bảo public_id phải chứa đúng định dạng
    const publicId = ext ? `${safeBaseName}_${Date.now()}.${ext}` : `${safeBaseName}_${Date.now()}`

    const uploadResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          resource_type: "raw", // BẮT BUỘC dùng 'raw' để nó không tự ý cắt bỏ đuôi mở rộng của file
          folder: "kmsplus/attachments",
          public_id: publicId,
          use_filename: true,
          unique_filename: false
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    return NextResponse.json({
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      bytes: uploadResult.bytes,
      format: uploadResult.format || file.name.split('.').pop(),
      original_filename: uploadResult.original_filename || file.name
    })

  } catch (error: any) {
    console.error("[Cloudinary Upload Error]", error)
    return NextResponse.json({ error: "Táº£i lÃªn tháº¥t báº¡i", details: error.message }, { status: 500 })
  }
}
