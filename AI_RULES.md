# AI Development Rules & Guidelines

> **Chú ý cho AI**: Đọc kỹ file này trước khi thực hiện bất kỳ task nào!

## 🚫 **KHÔNG ĐƯỢC LÀM:**

### Architecture & Structure

- ❌ **KHÔNG** thay đổi cấu trúc folder mà không hỏi
- ❌ **KHÔNG** move/rename files trong `src/lib/`
- ❌ **KHÔNG** tạo thêm validators centralized
- ❌ **KHÔNG** merge/split files mà không được yêu cầu
- ❌ **KHÔNG** thay đổi middleware logic
- ❌ **KHÔNG** tạo file ngoài folder `src` mà không hỏi

### Import & Dependencies

- ❌ **KHÔNG** thay đổi từ `jsonwebtoken` sang `jose`
- ❌ **KHÔNG** update import paths mà không check
- ❌ **KHÔNG** cài packages mới mà không hỏi
- ❌ **KHÔNG** thay đổi React version (giữ ở 18.x)

### Code Style

- ❌ **KHÔNG** thay đổi naming convention hiện tại
- ❌ **KHÔNG** thay đổi lặp lại logic code cho cùng 1 flow xử lý cụ thể
- ❌ **KHÔNG** refactor code mà không được yêu cầu
- ❌ **KHÔNG** thêm comments dài dòng không cần thiết

## ✅ **ĐƯỢC PHÉP LÀM:**

### Development Tasks

- ✅ Tạo/sửa individual files theo yêu cầu
- ✅ Fix bugs/errors cụ thể
- ✅ Thêm features mới theo feature-based structure
- ✅ Tạo DTOs riêng cho từng action/feature
- ✅ Update imports khi có file mới

### Best Practices

- ✅ Hỏi trước khi thay đổi lớn
- ✅ Giữ validation logic trong DTOs riêng
- ✅ Follow existing patterns
- ✅ Check imports sau khi thay đổi

## 📁 **CURRENT STRUCTURE (KHÔNG THAY ĐỔI):**

```
src/
├── lib/                    # Core utilities ONLY
│   ├── auth.ts            # JWT + server auth (jsonwebtoken)
│   ├── config.ts          # Environment validation
│   └── database.ts        # Neon client
├── action/                # Server actions với DTOs riêng
│   ├── auth/
│   │   ├── authActions.ts
│   │   └── dto/           # Auth-specific validation
│   └── user/
│       ├── userActions.ts
│       └── dto/           # User-specific validation
├── service/               # Business logic
└── ...
```

## 🎯 **VALIDATION STRATEGY:**

- Mỗi feature có DTOs riêng trong folder `dto/`
- KHÔNG tạo centralized validators
- KHÔNG duplicate validation logic

## 📝 **NOTES:**

- Middleware đang stable - tránh động vào
- React 18.x for Ant Design compatibility
- Feature-based organization cho DTOs
- Import paths: `@/lib/auth`, `@/lib/database`, `@/lib/config`

---

**Last Updated:** October 21, 2025  
**Version:** 1.0
