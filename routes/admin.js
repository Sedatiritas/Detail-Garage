const express = require("express");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

const router = express.Router();

// IP bazlı giriş denemesi sınırı: 15 dakika içinde 5 başarısız deneme.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const loginAttempts = new Map();

function getLoginAttempt(ip) {
    const now = Date.now();
    const attempt = loginAttempts.get(ip);

    if (!attempt || now >= attempt.resetAt) {
        const freshAttempt = {
            count: 0,
            resetAt: now + LOGIN_WINDOW_MS
        };
        loginAttempts.set(ip, freshAttempt);
        return freshAttempt;
    }

    return attempt;
}

// Süresi dolmuş kayıtları temizleyerek Map'in gereksiz büyümesini önle.
function cleanupLoginAttempts() {
    const now = Date.now();

    for (const [ip, attempt] of loginAttempts) {
        if (now >= attempt.resetAt) {
            loginAttempts.delete(ip);
        }
    }
}

router.post("/login", async (req, res) => {
    cleanupLoginAttempts();

    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const attempt = getLoginAttempt(ip);

    if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
        const remainingSeconds = Math.max(
            1,
            Math.ceil((attempt.resetAt - Date.now()) / 1000)
        );

        res.set("Retry-After", String(remainingSeconds));
        return res.status(429).json({
            success: false,
            message: "Çok fazla başarısız giriş denemesi. 15 dakika sonra tekrar deneyin."
        });
    }

    try {
        const email = typeof req.body.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";
        const password = typeof req.body.password === "string"
            ? req.body.password
            : "";

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "E-posta ve şifre alanları zorunludur."
            });
        }

        const admin = await Admin.findOne({ email });
        const passwordMatch = admin
            ? await bcrypt.compare(password, admin.password)
            : false;

        if (!admin || !passwordMatch) {
            attempt.count += 1;

            if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
                return res.status(429).json({
                    success: false,
                    message: "Çok fazla başarısız giriş denemesi. 15 dakika sonra tekrar deneyin."
                });
            }

            return res.status(401).json({
                success: false,
                message: "E-posta veya şifre hatalı."
            });
        }

        loginAttempts.delete(ip);

        // Başarılı girişten sonra oturum kimliğini yenile.
        req.session.regenerate((error) => {
            if (error) {
                console.error(error);
                return res.status(500).json({
                    success: false,
                    message: "Oturum oluşturulurken bir hata oluştu."
                });
            }

            req.session.adminId = admin._id;

            req.session.save((saveError) => {
                if (saveError) {
                    console.error(saveError);
                    return res.status(500).json({
                        success: false,
                        message: "Oturum kaydedilirken bir hata oluştu."
                    });
                }

                return res.json({ success: true });
            });
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Giriş sırasında bir hata oluştu."
        });
    }
});

router.post("/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: "Çıkış sırasında bir hata oluştu."
            });
        }

        res.clearCookie("connect.sid");
        return res.json({ success: true });
    });
});

module.exports = router;
