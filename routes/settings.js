const express = require("express");
const BusinessSetting = require("../models/BusinessSetting");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();


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