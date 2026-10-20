# Detail Garage — Randevu ve Araç Detaylandırma Sistemi

Detail Garage; oto yıkama, pasta-cila ve araç detaylandırma işletmeleri için geliştirilmiş, randevu yönetimi ve içerik düzenleme özelliklerine sahip web uygulamasıdır.

## Özellikler

- **Online randevu sistemi:** Müşterilerin randevu taleplerini web sitesi üzerinden iletmesi.
- **Yönetim paneli:** Randevuları görüntüleme ve yönetme.
- **Hizmet yönetimi:** Sunulan hizmetleri panel üzerinden düzenleme.
- **Galeri yönetimi:** İşletmenin fotoğraflarını ve görsel içeriklerini yönetme.
- **Slider yönetimi:** Ana sayfadaki slider görsellerini düzenleme.
- **Hakkımızda ve işletme ayarları:** İşletme bilgilerini ve tanıtım içeriklerini güncelleme.
- **Öncesi / sonrası alanı:** Araç uygulamalarının sonuçlarını görsel olarak sergileme.
- **Ziyaret sayacı:** Günlük site ziyaretlerini takip etme.
- **Bildirim altyapısı:** Bildirim rotaları ve push abonelik modeli.
- **EJS şablonları:** Sunucu tarafında dinamik sayfa oluşturma.

## Teknolojiler

- Node.js
- Express
- MongoDB ve Mongoose
- EJS
- HTML, CSS ve JavaScript
- express-session
- dotenv

## Proje yapısı

- `app.js` — Express uygulaması, middleware'ler ve ana rotalar
- `routes/` — Randevu, hizmet, galeri, ayar, admin ve bildirim rotaları
- `models/` — MongoDB/Mongoose veri modelleri
- `middleware/` — Admin kimlik doğrulama middleware'i
- `views/` — EJS sayfa şablonları
- `public/` — CSS, JavaScript, görseller ve yüklenen medya dosyaları

## Yerel ortamda çalıştırma

1. Depoyu bilgisayarına klonla.
2. Proje klasöründe bağımlılıkları yükle:

   ```bash
   npm install
   ```

3. Proje kök dizininde `.env` dosyası oluştur ve gerekli ortam değişkenlerini tanımla:

   ```env
   MONGO_URI=your_mongodb_connection_string
   SESSION_SECRET=replace_with_a_long_random_secret
   PORT=3000
   ```

4. Uygulamayı başlat:

   ```bash
   npm start
   ```

5. Tarayıcıda `http://localhost:3000` adresini aç.

> Not: Gerçek MongoDB bağlantı bilgilerini, oturum sırlarını veya diğer gizli bilgileri depoya yükleme. Yönetim panelini kullanmak için uygulamanın veritabanında geçerli bir admin hesabı bulunmalıdır.

## Geliştirme durumu

Bu proje, oto bakım ve detaylandırma işletmeleri için randevu ve içerik yönetimi sunan bir web uygulaması olarak geliştirilmektedir.
