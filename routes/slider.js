const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Slider = require("../models/Slider");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// --------------------------------------------------
// UPLOAD KLASÖRÜ
// --------------------------------------------------

const uploadDir = path.join(
    __dirname,
    "../public/uploads/slider"
);

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    });
}

// --------------------------------------------------
// MULTER
// --------------------------------------------------

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extension =
            path.extname(file.originalname).toLowerCase();

        const filename =
            `slider-${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;

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
                    "Sadece JPG, PNG veya WEBP görseller yükleyebilirsiniz."
                )
            );
        }

        cb(null, true);
    }
});

// --------------------------------------------------
// MULTER HATA YÖNETİMİ
// --------------------------------------------------

const handleUpload = (req, res, next) => {
    upload.single("image")(req, res, error => {
        if (!error) {
            return next();
        }

        console.error(error);

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Slider görseli yüklenemedi."
        });
    });
};

// --------------------------------------------------
// GET - TÜM SLIDERLAR
// PUBLIC
// --------------------------------------------------

router.get("/", async (req, res) => {
    try {
        const sliders = await Slider
            .find()
            .sort({
                sortOrder: 1,
                createdAt: 1
            });

        res.json({
            success: true,
            sliders
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Sliderlar alınamadı."
        });
    }
});

// --------------------------------------------------
// POST - YENİ SLIDER EKLE
// SADECE ADMIN
// --------------------------------------------------

router.post(
    "/",
    adminAuth,
    handleUpload,
    async (req, res) => {
        try {
            const {
                eyebrow,
                titleBefore,
                titleHighlight,
                titleAfter,
                description
            } = req.body;

            // Zorunlu alan kontrolü
            if (
                !eyebrow?.trim() ||
                !titleHighlight?.trim() ||
                !description?.trim()
            ) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    success: false,
                    message:
                        "Üst etiket, yeşil vurgu ve açıklama alanları zorunludur."
                });
            }

            // Görsel kontrolü
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Slider görseli seçmelisiniz."
                });
            }

            // Maksimum 5 slider
            const sliderCount =
                await Slider.countDocuments();

            if (sliderCount >= 5) {
                fs.unlinkSync(req.file.path);

                return res.status(400).json({
                    success: false,
                    message:
                        "En fazla 5 slider ekleyebilirsiniz."
                });
            }

            // Yeni sıra numarası
            const lastSlider = await Slider
                .findOne()
                .sort({
                    sortOrder: -1
                });

            const sortOrder =
                lastSlider
                    ? lastSlider.sortOrder + 1
                    : 0;

            const slider = await Slider.create({
                eyebrow:
                    eyebrow.trim(),

                titleBefore:
                    titleBefore?.trim() || "",

                titleHighlight:
                    titleHighlight.trim(),

                titleAfter:
                    titleAfter?.trim() || "",

                description:
                    description.trim(),

                imageUrl:
                    `/uploads/slider/${req.file.filename}`,

                sortOrder
            });

            res.status(201).json({
                success: true,
                message:
                    "Slider başarıyla eklendi.",
                slider
            });

        } catch (error) {
            console.error(error);

            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch {}
            }

            res.status(500).json({
                success: false,
                message:
                    "Slider eklenirken bir hata oluştu."
            });
        }
    }
);

// --------------------------------------------------
// PUT - SLIDER DÜZENLE
// SADECE ADMIN
// --------------------------------------------------

router.put(
    "/:id",
    adminAuth,
    handleUpload,
    async (req, res) => {
        try {
            const {
                eyebrow,
                titleBefore,
                titleHighlight,
                titleAfter,
                description
            } = req.body;

            const slider =
                await Slider.findById(
                    req.params.id
                );

            if (!slider) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(404).json({
                    success: false,
                    message:
                        "Slider bulunamadı."
                });
            }

            // Zorunlu alanlar
            if (
                !eyebrow?.trim() ||
                !titleHighlight?.trim() ||
                !description?.trim()
            ) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    success: false,
                    message:
                        "Üst etiket, yeşil vurgu ve açıklama alanları zorunludur."
                });
            }

            slider.eyebrow =
                eyebrow.trim();

            slider.titleBefore =
                titleBefore?.trim() || "";

            slider.titleHighlight =
                titleHighlight.trim();

            slider.titleAfter =
                titleAfter?.trim() || "";

            slider.description =
                description.trim();

            // Yeni görsel geldiyse
            if (req.file) {
                const oldImagePath =
                    path.join(
                        __dirname,
                        "../public",
                        slider.imageUrl
                    );

                // Eski görseli sil
                if (
                    slider.imageUrl &&
                    fs.existsSync(oldImagePath)
                ) {
                    fs.unlinkSync(
                        oldImagePath
                    );
                }

                slider.imageUrl =
                    `/uploads/slider/${req.file.filename}`;
            }

            await slider.save();

            res.json({
                success: true,
                message:
                    "Slider başarıyla güncellendi.",
                slider
            });

        } catch (error) {
            console.error(error);

            if (req.file) {
                try {
                    fs.unlinkSync(
                        req.file.path
                    );
                } catch {}
            }

            res.status(500).json({
                success: false,
                message:
                    "Slider güncellenirken bir hata oluştu."
            });
        }
    }
);

// --------------------------------------------------
// DELETE - SLIDER SİL
// SADECE ADMIN
// --------------------------------------------------

router.delete(
    "/:id",
    adminAuth,
    async (req, res) => {
        try {
            const slider =
                await Slider.findById(
                    req.params.id
                );

            if (!slider) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Slider bulunamadı."
                });
            }

            // Görseli sil
            if (slider.imageUrl) {
                const imagePath =
                    path.join(
                        __dirname,
                        "../public",
                        slider.imageUrl
                    );

                if (
                    fs.existsSync(imagePath)
                ) {
                    fs.unlinkSync(
                        imagePath
                    );
                }
            }

            // MongoDB kaydını sil
            await Slider.findByIdAndDelete(
                req.params.id
            );

            res.json({
                success: true,
                message:
                    "Slider başarıyla silindi."
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message:
                    "Slider silinirken bir hata oluştu."
            });
        }
    }
);

module.exports = router;