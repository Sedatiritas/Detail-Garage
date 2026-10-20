const express = require("express");
const webpush = require("web-push");

const PushSubscription = require("../models/PushSubscription");

const router = express.Router();

// --------------------------------------------------
// VAPID AYARLARI
// --------------------------------------------------

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// --------------------------------------------------
// PUBLIC KEY
// --------------------------------------------------

router.get("/public-key", (req, res) => {
    res.json({
        success: true,
        publicKey: process.env.VAPID_PUBLIC_KEY
    });
});

// --------------------------------------------------
// BİLDİRİM ABONELİĞİ KAYDET
// --------------------------------------------------

router.post("/subscribe", async (req, res) => {
    try {
        const subscription = req.body;

        if (
            !subscription ||
            !subscription.endpoint ||
            !subscription.keys?.p256dh ||
            !subscription.keys?.auth
        ) {
            return res.status(400).json({
                success: false,
                message: "Geçersiz bildirim aboneliği."
            });
        }

        await PushSubscription.findOneAndUpdate(
            {
                endpoint: subscription.endpoint
            },
            {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth
                },
                userAgent:
                    req.headers["user-agent"] || ""
            },
            {
                upsert: true,
                returnDocument: "after",
                setDefaultsOnInsert: true
            }
        );

        res.json({
            success: true,
            message: "Bildirim aboneliği kaydedildi."
        });

    } catch (error) {
        console.error(
            "Bildirim aboneliği kaydedilemedi:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Bildirim aboneliği kaydedilemedi."
        });
    }
});

// --------------------------------------------------
// BİLDİRİM ABONELİĞİ SİL
// --------------------------------------------------

router.post("/unsubscribe", async (req, res) => {
    try {
        const { endpoint } = req.body;

        if (!endpoint) {
            return res.status(400).json({
                success: false,
                message: "Endpoint bulunamadı."
            });
        }

        await PushSubscription.findOneAndDelete({
            endpoint
        });

        res.json({
            success: true,
            message: "Bildirim aboneliği silindi."
        });

    } catch (error) {
        console.error(
            "Bildirim aboneliği silinemedi:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Bildirim aboneliği silinemedi."
        });
    }
});

// --------------------------------------------------
// TÜM CİHAZLARA PUSH GÖNDER
// --------------------------------------------------

async function sendPushNotification(payload) {

    const subscriptions =
        await PushSubscription.find();

    const deadSubscriptions = [];

    for (const subscription of subscriptions) {

        try {

            await webpush.sendNotification(
                {
                    endpoint:
                        subscription.endpoint,

                    keys: {
                        p256dh:
                            subscription.keys.p256dh,

                        auth:
                            subscription.keys.auth
                    }
                },
                JSON.stringify(payload)
            );

        } catch (error) {

            console.error(
                "Push gönderilemedi:",
                error.statusCode,
                error.message
            );

            // Artık geçerli olmayan abonelikleri temizle
            if (
                error.statusCode === 404 ||
                error.statusCode === 410
            ) {
                deadSubscriptions.push(
                    subscription._id
                );
            }
        }
    }

    if (deadSubscriptions.length > 0) {

        await PushSubscription.deleteMany({
            _id: {
                $in: deadSubscriptions
            }
        });

    }

}


// --------------------------------------------------
// EXPORT
// --------------------------------------------------

module.exports = router;
module.exports.sendPushNotification =
    sendPushNotification;