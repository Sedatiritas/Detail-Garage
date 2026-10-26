const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const BeforeAfter = require("../models/BeforeAfter");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();


// ========================================
// UPLOAD KLASÖRÜ
// ========================================

const uploadDir = path.join(
    __dirname,
    "..",
    "public",
    "uploads",
    "before-after"
);

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    });
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
            `before-after-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

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
                    "Sadece JPG, PNG veya WEBP görseller yüklenebilir."
                )
            );

        }

        cb(null, true);
    }

});


// ========================================
// MULTER HATA YÖNETİMİ
// ========================================

const handleUpload = (req, res, next) => {

    upload.fields([
        {
            name: "beforeImage",
            maxCount: 1
        },
        {
            name: "afterImage",
            maxCount: 1
        }
    ])(req, res, error => {

        if (!error) {
            return next();
        }

        console.error(error);

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Before/After görselleri yüklenemedi."
        });

    });

};


// ========================================
// DOSYA SİLME YARDIMCISI
// ========================================

const deleteFile = filePath => {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

// Yalnızca bu özelliğin kendi uploads klasöründeki dosyaları hedefle.
const getBeforeAfterFilePath = imageUrl => {
    if (typeof imageUrl !== "string") return null;

    const cleanUrl = imageUrl.split("?")[0].split("#")[0];
    const prefix = "/uploads/before-after/";

    if (!cleanUrl.startsWith(prefix)) return null;

    const filename = cleanUrl.slice(prefix.length);
    if (!filename || path.basename(filename) !== filename) return null;

    return path.join(uploadDir, filename);
};


// ========================================
// GET - BEFORE / AFTER
// PUBLIC
// ========================================

router.get("/", async (req, res) => {

    try {

        let beforeAfter =
            await BeforeAfter.findOne({
                key: "main"
            });

        if (!beforeAfter) {

            beforeAfter =
                await BeforeAfter.create({
                    key: "main"
                });

        }

        res.json({
            success: true,
            beforeAfter
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "Before/After bilgileri alınamadı."
        });

    }

});


// ========================================
// PUT - BEFORE / AFTER KAYDET
// SADECE ADMIN
// ========================================

router.put(
    "/",
    adminAuth,
    handleUpload,
    async (req, res) => {

        try {

            const beforeFile =
                req.files?.beforeImage?.[0] || null;

            const afterFile =
                req.files?.afterImage?.[0] || null;


            let beforeAfter =
                await BeforeAfter.findOne({
                    key: "main"
                });


            // ========================================
            // İLK KAYIT
            // ========================================

            if (!beforeAfter) {

                if (
                    !beforeFile ||
                    !afterFile
                ) {

                    if (beforeFile) {
                        deleteFile(
                            beforeFile.path
                        );
                    }

                    if (afterFile) {
                        deleteFile(
                            afterFile.path
                        );
                    }

                    return res.status(400).json({
                        success: false,
                        message:
                            "İlk kayıtta hem Before hem After fotoğrafı yüklemelisiniz."
                    });

                }


                beforeAfter =
                    await BeforeAfter.create({

                        key: "main",

                        beforeImageUrl:
                            `/uploads/before-after/${beforeFile.filename}`,

                        afterImageUrl:
                            `/uploads/before-after/${afterFile.filename}`

                    });


                return res.status(201).json({

                    success: true,

                    message:
                        "Before/After görselleri başarıyla kaydedildi.",

                    beforeAfter

                });

            }


            // ========================================
            // MEVCUT KAYIT GÜNCELLEME
            // ========================================

            const oldBeforeImage =
                beforeAfter.beforeImageUrl;

            const oldAfterImage =
                beforeAfter.afterImageUrl;


            if (beforeFile) {
                beforeAfter.beforeImageUrl =
                    `/uploads/before-after/${beforeFile.filename}`;
            }

            if (afterFile) {
                beforeAfter.afterImageUrl =
                    `/uploads/before-after/${afterFile.filename}`;
            }

            // Önce yeni adresleri veritabanına kaydet; kayıt başarılı olduktan
            // sonra değiştirilen eski dosyaları diskten kaldır.
            await beforeAfter.save();

            if (beforeFile && oldBeforeImage !== beforeAfter.beforeImageUrl) {
                const oldBeforePath = getBeforeAfterFilePath(oldBeforeImage);
                const newBeforePath = getBeforeAfterFilePath(beforeAfter.beforeImageUrl);

                if (oldBeforePath && oldBeforePath !== newBeforePath) {
                    deleteFile(oldBeforePath);
                }
            }

            if (afterFile && oldAfterImage !== beforeAfter.afterImageUrl) {
                const oldAfterPath = getBeforeAfterFilePath(oldAfterImage);
                const newAfterPath = getBeforeAfterFilePath(beforeAfter.afterImageUrl);

                if (oldAfterPath && oldAfterPath !== newAfterPath) {
                    deleteFile(oldAfterPath);
                }
            }

            res.json({

                success: true,

                message:
                    "Before/After görselleri başarıyla güncellendi.",

                beforeAfter

            });

        } catch (error) {

            console.error(error);


            // Hata olursa yeni yüklenenleri sil
            if (req.files?.beforeImage?.[0]) {

                deleteFile(
                    req.files.beforeImage[0].path
                );

            }

            if (req.files?.afterImage?.[0]) {

                deleteFile(
                    req.files.afterImage[0].path
                );

            }


            res.status(500).json({

                success: false,

                message:
                    "Before/After görselleri kaydedilemedi."

            });

        }

    }
);


module.exports = router;