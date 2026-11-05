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
        appointmentInterval: {
            type: Number,
            enum: [30, 60, 90],
            default: 60
        },
        workingHours: {
            type: [{
                day: { type: String, required: true },
                enabled: { type: Boolean, default: true },
                start: { type: String, default: "09:00" },
                end: { type: String, default: "18:00" }
            }],
            default: () => [
                { day: "monday", enabled: true, start: "09:00", end: "18:00" },
                { day: "tuesday", enabled: true, start: "09:00", end: "18:00" },
                { day: "wednesday", enabled: true, start: "09:00", end: "18:00" },
                { day: "thursday", enabled: true, start: "09:00", end: "18:00" },
                { day: "friday", enabled: true, start: "09:00", end: "18:00" },
                { day: "saturday", enabled: true, start: "09:00", end: "18:00" },
                { day: "sunday", enabled: true, start: "09:00", end: "18:00" }
            ]
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