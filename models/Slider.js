const mongoose = require("mongoose");

const sliderSchema = new mongoose.Schema(
    {
        eyebrow: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80
        },

        titleBefore: {
            type: String,
            default: "",
            trim: true,
            maxlength: 150
        },

        titleHighlight: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80
        },

        titleAfter: {
            type: String,
            default: "",
            trim: true,
            maxlength: 150
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 250
        },

        imageUrl: {
            type: String,
            required: true,
            trim: true
        },

        sortOrder: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Slider", sliderSchema);