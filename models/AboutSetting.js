const mongoose = require("mongoose");

const aboutSettingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            default: "",
            trim: true
        },

        description1: {
            type: String,
            default: "",
            trim: true
        },

        description2: {
            type: String,
            default: "",
            trim: true
        },

        imageUrl: {
            type: String,
            default: "",
            trim: true
        },

        experienceYears: {
            type: String,
            default: "",
            trim: true
        },

        completedWorks: {
            type: String,
            default: "",
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "AboutSetting",
    aboutSettingSchema
);