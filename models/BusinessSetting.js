const mongoose = require("mongoose");

const businessSettingSchema = new mongoose.Schema(
    {
        // LOGO
        logoUrl: {
            type: String,
            default: "/tamLogo.png",
            trim: true
        },

        // GOOGLE MAPS
        mapUrl: {
            type: String,
            default:
                "https://www.google.com/maps?q=Adana%20Merkez&output=embed",
            trim: true
        },

        // FOOTER / İŞLETME BİLGİLERİ
        businessName: {
            type: String,
            default: "",
            trim: true
        },

        phone: {
            type: String,
            default: "",
            trim: true
        },

        email: {
            type: String,
            default: "",
            trim: true
        },

        location: {
            type: String,
            default: "",
            trim: true
        },

        footerDescription: {
            type: String,
            default: "",
            trim: true
        },

        copyright: {
            type: String,
            default: "",
            trim: true
        },

        // SOSYAL MEDYA
        instagramUrl: {
            type: String,
            default: "",
            trim: true
        },

        tiktokUrl: {
            type: String,
            default: "",
            trim: true
        },

        whatsappUrl: {
            type: String,
            default: "",
            trim: true
        },
        appointmentsOpen: {
            type: Boolean,
            default: true
        },
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model(
        "BusinessSetting",
        businessSettingSchema
    );