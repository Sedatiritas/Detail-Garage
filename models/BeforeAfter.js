const mongoose = require("mongoose");

const beforeAfterSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            default: "main",
            unique: true,
            immutable: true
        },

        beforeImageUrl: {
            type: String,
            default: "",
            trim: true
        },

        afterImageUrl: {
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
    "BeforeAfter",
    beforeAfterSchema
);