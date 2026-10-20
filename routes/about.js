const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const AboutSetting = require("../models/AboutSetting");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();


// ========================================
// FOTOĞRAF KLASÖRÜ
// ========================================

const uploadDir = path.join(
    __dirname,
    "..",
    "public",
    "uploads",
    "about"
);

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


// ========================================
// MULTER
// ========================================

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


// ========================================
// GET
// PUBLIC
// ========================================

router.get("/", async (req, res) => {

    try {

        let settings =
            await AboutSetting.findOne();

        if (!settings) {

            settings =
                await AboutSetting.create({});

        }

        res.json({
            success: true,
            settings
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "Hakkımızda ayarları alınamadı."
        });

    }

});


// ========================================
// PUT
// SADECE ADMIN
// ========================================

router.put(
    "/",
    adminAuth,
    upload.single("image"),
    async (req, res) => {

        try {

            const {
                title,
                description1,
                description2,
                experienceYears,
                completedWorks
            } = req.body;


            let settings =
                await AboutSetting.findOne();


            if (!settings) {

                settings =
                    new AboutSetting();

            }


            // ================================
            // METİNLER
            // ================================

            settings.title =
                title?.trim() || "";

            settings.description1 =
                description1?.trim() || "";

            settings.description2 =
                description2?.trim() || "";

            settings.experienceYears =
                experienceYears?.trim() || "";

            settings.completedWorks =
                completedWorks?.trim() || "";


            // ================================
            // YENİ FOTOĞRAF
            // ================================

            if (req.file) {

                // Eski fotoğrafı sil
                if (settings.imageUrl) {

                    const oldFilePath =
                        path.join(
                            __dirname,
                            "..",
                            "public",
                            settings.imageUrl
                        );

                    if (fs.existsSync(oldFilePath)) {

                        fs.unlinkSync(
                            oldFilePath
                        );

                    }

                }


                // Yeni fotoğrafın URL'si
                settings.imageUrl =
                    `/uploads/about/${req.file.filename}`;

            }


            await settings.save();


            res.json({
                success: true,
                message:
                    "Hakkımızda ayarları başarıyla kaydedildi.",
                settings
            });

        } catch (error) {

            // Hata olursa yeni yüklenen dosyayı sil
            if (
                req.file?.path &&
                fs.existsSync(req.file.path)
            ) {

                fs.unlinkSync(
                    req.file.path
                );

            }


            console.error(error);

            res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Hakkımızda ayarları kaydedilemedi."
            });

        }

    }
);
module.exports = router;