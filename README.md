## Getting Started

- Project dùng Nextjs cho cả FE và BE nhé, ngoài ra làm việc với pnpm, không làm việc với npm (đã setup sẵn r)
- Nếu chưa cài pnpm thì dùng lệnh dưới:

```bash
npm install -g pnpm
```

- Sau khi clone về nhớ checkout sang nhánh development để pull code mới nhất về (ưu tiên dùng các Git GUI Client như con rùa,... or lệnh dưới)

```bash
# checkout nhánh development
gỉt checkout development

# pull source mới nhất
git pull origin development

# chuyển sang nhánh bản thân
# tải thử viện/ dependency
pnpm i

# run
pnpm dev

# lỗi tính sau
```

- à nhớ format code

```bash
pnpm format
```

## Setup môi trường

- mở project, clone file .env.example ra và đổi tên thành .env.local
- thông tin key ib vùng kín để nhận nhé

## Vài cái cần notice

- Không dùng cú pháp React.FC
  ❌ vì nó không hỗ trợ server component
  🟢 thay vào đó dùng cú pháp function, và nếu trang đấy cần cái gì thì khai báo interface

=> Không dùng cú pháp export default

## Quy tắc đặt tên

Với component 💣💀🐖🐖🐖🐖 NEW!!!!! 25/10/2025

- tên component phải theo chuẩn PascalCase
- tên component phải có ý nghĩa
- tên component phải dễ hiểu

Với api:

- code trong page/api, chức năng chia theo feature
- mỗi file route.js tương ứng với CHỈ 1 api
- đặt tên folder chưa file route.js theo chuẩn kebab-case, ví dụ: user/get-all-user/route.js

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
