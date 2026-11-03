# Build CSS Tailwind

`public/css/tailwind.css` adalah file **hasil build** (dikomit ke repo supaya Vercel/PHP tidak perlu Node).
Jalankan ulang setiap kali menambah/mengubah class Tailwind di `resources/views/**` atau `public/js/**`:

```bash
npx tailwindcss@3.4.17 -c tools/tailwind/tailwind.config.js -i tools/tailwind/input.css -o public/css/tailwind.css --minify
```

Catatan: class Tailwind harus ditulis utuh di sumber (mis. `text-red-600`), jangan dirakit dari
potongan string (`'text-' + warna`), karena scanner hanya membaca teks literal.
