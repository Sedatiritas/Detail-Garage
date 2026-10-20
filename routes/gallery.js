const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

const Gallery = require("../models/Gallery");
const GallerySetting = require("../models/GallerySetting");
const adminAuth = require("../middleware/adminAuth");


// UPLOADS/GALLERY KLASÖRÜ
const uploadDir = path.join(
    __dirname,
    "..",
    "public",
    "uploads",
    "gallery"
);

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


/* =========================================================
   GALERİ AYARLARI
   ========================================================= */

// PUBLIC - Galeri ayarlarını getir
router.get("/settings", async (req, res) => {

    try {

        let settings =
            await GallerySetting.findOne();

        if (!settings) {

            settings =
                await GallerySetting.create({});

        }

        res.json({
            success: true,
            settings
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Galeri ayarları alınamadı."
        });

    }

});


// SADECE ADMIN - Galeri ayarlarını güncelle
router.put("/settings", adminAuth, async (req, res) => {

    try {

        const { title, description } = req.body;

        let settings =
            await GallerySetting.findOne();

        if (!settings) {

            settings =
                await GallerySetting.create({
                    title: title?.trim(),
                    description: description?.trim()
                });

        } else {

            settings.title =
                title?.trim();

            settings.description =
                description?.trim();

            await settings.save();

        }

        res.json({

            success: true,

            message:
                "Galeri ayarları başarıyla güncellendi.",

            settings

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Galeri ayarları güncellenemedi."

        });

    }

});


// MULTER AYARLARI
const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {

        const extension =
            path.extname(file.originalname).toLowerCase();

        const filename =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

        cb(null, filename);
    }

});


const upload = multer({

    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new Error(
                    "Sadece JPG, PNG veya WEBP dosyaları yüklenebilir."
                )
            );
        }

        cb(null, true);
    }

});


// SADECE ADMIN - FOTOĞRAF EKLE
router.post(
    "/",
    adminAuth,
    upload.single("image"),
    async (req, res) => {

        try {

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Lütfen bir fotoğraf seçin."
                });
            }


            // MAKSİMUM 8 FOTOĞRAF
            const galleryCount =
                await Gallery.countDocuments();

            if (galleryCount >= 8) {

                fs.unlinkSync(req.file.path);

                return res.status(400).json({
                    success: false,
                    message:
                        "Galeride en fazla 8 fotoğraf olabilir."
                });

            }


            const caption =
                req.body.caption?.trim();


            if (!caption) {

                fs.unlinkSync(req.file.path);

                return res.status(400).json({
                    success: false,
                    message:
                        "Fotoğraf açıklaması boş bırakılamaz."
                });
            }


            const gallery = new Gallery({

                imageUrl:
                    `/uploads/gallery/${req.file.filename}`,

                caption

            });


            await gallery.save();


            res.status(201).json({
                success: true,
                message: "Fotoğraf başarıyla yüklendi.",
                gallery
            });


        } catch (error) {

            if (
                req.file?.path &&
                fs.existsSync(req.file.path)
            ) {
                fs.unlinkSync(req.file.path);
            }

            console.error(error);

            res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Fotoğraf yüklenirken bir hata oluştu."
            });

        }

    }
);


// SADECE ADMIN - FOTOĞRAF SİL
router.delete(
    "/:id",
    adminAuth,
    async (req, res) => {

        try {

            const gallery =
                await Gallery.findById(req.params.id);


            if (!gallery) {

                return res.status(404).json({
                    success: false,
                    message: "Fotoğraf bulunamadı."
                });

            }


            // DOSYA YOLUNU BUL
            const filePath =
                path.join(
                    __dirname,
                    "..",
                    "public",
                    gallery.imageUrl
                );


            // DOSYAYI SİL
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }


            // MONGODB KAYDINI SİL
            await Gallery.findByIdAndDelete(
                req.params.id
            );


            res.json({
                success: true,
                message: "Fotoğraf başarıyla silindi."
            });


        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message:
                    "Fotoğraf silinirken bir hata oluştu."
            });

        }

    }
);


module.exports = router;