const express = require("express");
const router = express.Router();

const Service = require("../models/Service");
const adminAuth = require("../middleware/adminAuth");

// HİZMET EKLE
router.post("/", adminAuth, async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            icon,
            status
        } = req.body;

        const service = new Service({
            name,
            description,
            price,
            icon,
            status
        });

        await service.save();

        res.status(201).json({
            success: true,
            message: "Hizmet başarıyla eklendi.",
            service
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Hizmet eklenirken bir hata oluştu."
        });
    }
});


// HİZMET GÜNCELLE
router.put("/:id", adminAuth, async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            icon,
            status
        } = req.body;

        const service = await Service.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                price,
                icon,
                status
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Hizmet bulunamadı."
            });
        }

        res.json({
            success: true,
            message: "Hizmet başarıyla güncellendi.",
            service
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Hizmet güncellenirken bir hata oluştu."
        });
    }
});


// HİZMET SİL
router.delete("/:id", adminAuth, async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(
            req.params.id
        );

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Hizmet bulunamadı."
            });
        }

        res.json({
            success: true,
            message: "Hizmet başarıyla silindi."
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Hizmet silinirken bir hata oluştu."
        });
    }
});


module.exports = router;