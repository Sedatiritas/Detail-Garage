const express = require("express");
const router = express.Router();

const Appointment = require("../models/Appointment");
const adminAuth = require("../middleware/adminAuth");

const {
    sendPushNotification
} = require("./notifications");



// --------------------------------------------------
// RANDEVU OLUŞTUR
// --------------------------------------------------

router.post("/", async (req, res) => {

    try {

        const {
            name,
            phone,
            vehicle,
            service,
            date,
            time,
            message
        } = req.body;


        // Aynı tarih ve saat dolu mu?
        const existingAppointment =
            await Appointment.findOne({

                date,

                time,

                status: {
                    $in: [
                        "pending",
                        "confirmed",
                        "completed"
                    ]
                }

            });


        if (existingAppointment) {

            return res.redirect(
                "/?error=slot-full#appointment"
            );

        }


        // RANDEVUYU OLUŞTUR
        const appointment =
            new Appointment({

                name,
                phone,
                vehicle,
                service,
                date,
                time,
                message

            });


        await appointment.save();

        // --------------------------------------------------
        // ADMIN CİHAZLARINA BİLDİRİM GÖNDER
        // --------------------------------------------------

        try {

            await sendPushNotification({

                title: "Yeni Randevu",

                body:
                    `${name} • ${service} • ${date} • ${time}`,

                url:
                    "/admin#appointments"

            });

        } catch (notificationError) {

            // Bildirim başarısız olsa bile
            // randevu başarıyla oluşturulmuş kabul edilir.

            console.error(
                "Randevu bildirimi gönderilemedi:",
                notificationError
            );

        }


        // BAŞARILI
        res.redirect(
            "/?success=appointment#appointment"
        );


    } catch (error) {

        console.error(error);

        res.redirect(
            "/?error=server#appointment"
        );

    }

});


// --------------------------------------------------
// ADMIN PANELİ İÇİN RANDEVU LİSTESİ (YENİ VERİLERİ ÇEK)
// --------------------------------------------------
router.get("/admin/list", adminAuth, async (req, res) => {
    try {
        const appointments = await Appointment.find().sort({
            date: -1,
            time: -1,
            createdAt: -1
        });

        return res.json({
            success: true,
            appointments
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Randevular alınırken bir hata oluştu."
        });
    }
});


// --------------------------------------------------
// RANDEVU MÜSAİTLİK KONTROLÜ
// --------------------------------------------------

router.get("/availability", async (req, res) => {

    try {

        const {
            date
        } = req.query;


        if (!date) {

            return res.status(400).json({

                success: false,

                message:
                    "Tarih bilgisi gerekli."

            });

        }


        const appointments =
            await Appointment.find({

                date,

                status: {
                    $in: [
                        "pending",
                        "confirmed",
                        "completed"
                    ]
                }

            }).select("time -_id");


        const bookedTimes =
            appointments.map(
                appointment =>
                    appointment.time
            );


        res.json({

            success: true,

            bookedTimes

        });


    } catch (error) {

        console.error(error);


        res.status(500).json({

            success: false,

            message:
                "Müsaitlik kontrol edilirken hata oluştu."

        });

    }

});


// --------------------------------------------------
// RANDEVU DURUMUNU GÜNCELLE
// --------------------------------------------------

router.patch(
    "/:id/status",
    adminAuth,
    async (req, res) => {

        try {

            const {
                status
            } = req.body;


            const allowedStatuses = [
                "pending",
                "confirmed",
                "rejected",
                "completed"
            ];


            if (!allowedStatuses.includes(status)) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Geçersiz randevu durumu."

                });

            }


            const appointment =
                await Appointment.findByIdAndUpdate(
                    req.params.id,
                    {
                        status
                    },
                    {
                        new: true
                    }
                );


            if (!appointment) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Randevu bulunamadı."

                });

            }


            res.json({

                success: true,

                message:
                    "Randevu durumu güncellendi.",

                appointment

            });


        } catch (error) {

            console.error(error);


            res.status(500).json({

                success: false,

                message:
                    "Randevu güncellenirken hata oluştu."

            });

        }

    }
);


// --------------------------------------------------
// RANDEVU SİL
// --------------------------------------------------

router.delete(
    "/:id",
    adminAuth,
    async (req, res) => {

        try {

            const appointment =
                await Appointment.findByIdAndDelete(
                    req.params.id
                );


            if (!appointment) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Randevu bulunamadı."

                });

            }


            res.json({

                success: true,

                message:
                    "Randevu başarıyla silindi."

            });


        } catch (error) {

            console.error(error);


            res.status(500).json({

                success: false,

                message:
                    "Randevu silinirken bir hata oluştu."

            });

        }

    }
);


// --------------------------------------------------
// ADMIN PANELİNDEN RANDEVU OLUŞTUR
// --------------------------------------------------

router.post(
    "/admin",
    adminAuth,
    async (req, res) => {

        try {

            const {
                name,
                phone,
                vehicle,
                service,
                date,
                time,
                message
            } = req.body;


            // Aynı tarih + saat dolu mu?
            const existingAppointment =
                await Appointment.findOne({

                    date,

                    time,

                    status: {
                        $in: [
                            "pending",
                            "confirmed",
                            "completed"
                        ]
                    }

                });


            if (existingAppointment) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Bu tarih ve saat zaten dolu."

                });

            }


            const appointment =
                new Appointment({

                    name,
                    phone,
                    vehicle,
                    service,
                    date,
                    time,
                    message

                });


            await appointment.save();


            res.status(201).json({

                success: true,

                message:
                    "Randevu başarıyla oluşturuldu.",

                appointment

            });


        } catch (error) {

            console.error(error);


            res.status(500).json({

                success: false,

                message:
                    "Randevu oluşturulurken bir hata oluştu."

            });

        }

    }
);
module.exports = router;