const mongoose = require("mongoose");

const gallerySettingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            default: "",
            trim: true
        },

        description: {
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
    "GallerySetting",
    gallerySettingSchema
);