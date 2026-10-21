const express = require("express");
const BusinessSetting = require("../models/BusinessSetting");
const adminAuth = require("../middleware/adminAuth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();


const logoUploadDir = path.join(__dirname, "..", "public", "uploads", "logo");
fs.mkdirSync(logoUploadDir, { recursive: true });

const logoUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, logoUploadDir),
        filename: (req, file, cb) => {
            const extension = path.extname(file.originalname).toLowerCase();
            cb(null, `business-logo-${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Logo için JPG, PNG, WEBP veya SVG dosyası seçin."));
        }
        cb(null, true);
    }
});

const handleLogoUpload = (req, res, next) => {
    logoUpload.single("logo")(req, res, error => {
        if (!error) return next();
        return res.status(400).json({
            success: false,
            message: error.message || "Logo yüklenemedi."
        });
    });
};


// ========================================
// GET - PUBLIC
// ========================================

router.get("/", async (req, res) => {
    try {
        let settings = await BusinessSetting.findOne();

        if (!settings) {
            settings = await BusinessSetting.create({});
        }

        res.json({
            success: true,
            settings
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "İşletme ayarları alınamadı."
        });
    }
});


// ========================================
// LOGO UPLOAD - SADECE ADMIN
// ========================================

router.post("/logo", adminAuth, handleLogoUpload, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Önce bir logo dosyası seçin."
            });
        }

        let settings = await BusinessSetting.findOne();
        if (!settings) settings = await BusinessSetting.create({});

        settings.logoUrl = `/uploads/logo/${req.file.filename}`;
        await settings.save();

        return res.json({
            success: true,
            message: "Logo başarıyla güncellendi.",
            logoUrl: settings.logoUrl
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Logo kaydedilemedi."
        });
    }
});


// ========================================
// PUT - SADECE ADMIN
// ========================================

router.put("/", adminAuth, async (req, res) => {
    try {
        const {
            businessName,
            phone,
            email,
            location,
            footerDescription,
            copyright,
            instagramUrl,
            tiktokUrl,
            whatsappUrl,
            mapUrl,
            appointmentsOpen
        } = req.body;

        let settings = await BusinessSetting.findOne();

        if (!settings) {
            settings = await BusinessSetting.create({});
        }

        settings.businessName =
            businessName?.trim() || "";

        settings.phone =
            phone?.trim() || "";

        settings.email =
            email?.trim() || "";

        settings.location =
            location?.trim() || "";

        settings.footerDescription =
            footerDescription?.trim() || "";

        settings.copyright =
            copyright?.trim() || "";

        settings.instagramUrl =
            instagramUrl?.trim() || "";

        settings.tiktokUrl =
            tiktokUrl?.trim() || "";

        settings.whatsappUrl =
            whatsappUrl?.trim() || "";

        settings.mapUrl =
            mapUrl?.trim() || settings.mapUrl;

        settings.appointmentsOpen =
            appointmentsOpen ?? true;

        await settings.save();

        res.json({
            success: true,
            message:
                "İşletme ayarları başarıyla kaydedildi.",
            settings
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "İşletme ayarları kaydedilemedi."
        });
    }
});

module.exports = router;