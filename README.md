# Detail Garage

Single page oto yıkama / pasta cila sitesi ve aynı klasörde yönetim paneli.

## Yapı

- `index.html` → müşteri-facing single page site
- `admin.html` → admin paneli
- `css/style.css` → iki tarafın ortak stylesheet'i
- `js/script.js` → iki tarafın ortak JavaScript'i

Admin tarafındaki CSS `body.admin-page` altında scope edilmiştir. Admin JavaScript'i de aynı nedenle yalnızca `admin.html` üzerinde çalışır; public slider, scroll reveal, galeri modalı ve form davranışları etkilenmez.

## Çalıştırma

`index.html` veya `admin.html` dosyasını Live Server ile açabilirsin.
