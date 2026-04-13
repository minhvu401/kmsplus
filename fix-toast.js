const fs = require('fs');
let file = 'src/app/(main)/documents/management/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

if (!txt.includes('notification,')) {
  txt = txt.replace('  message,', '  message,\n  notification,');
}

// Support encoded format and literal format
if (txt.includes('message.success("Thêm danh m?c thành công!")')) {
  txt = txt.replace(
    'message.success("Thêm danh m?c thành công!")',
    'notification.success({ message: "Thêm m?i thành công!", description: "Danh m?c dã du?c t?o thành công và s?n sàng trên h? th?ng.", placement: "topRight" })'
  );
} else {
  txt = txt.replace(
    /message\.success\(\"Th.m danh m.c th.nh c.ng\!\"\)/,
    'notification.success({ message: "T?o danh m?c tài li?u thành công!", description: "Danh m?c v?a m?i du?c thêm thành công và hi?n th? bên du?i.", placement: "topRight" })'
  );
}

fs.writeFileSync(file, txt, 'utf8');
console.log('Fixed up the success messages!');
