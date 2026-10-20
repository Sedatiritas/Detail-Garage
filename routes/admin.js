const express = require("express");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

const router = express.Router();

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "E-posta veya şifre hatalı."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            admin.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "E-posta veya şifre hatalı."
            });
        }

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
