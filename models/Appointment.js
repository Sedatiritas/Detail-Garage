const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        vehicle: {
            type: String,
            required: true,
            trim: true
        },

        service: {
            type: String,
            required: true,
            trim: true
        },

        date: {
            type: String,
            required: true
        },

        time: {
            type: String,
            required: true
        },

        message: {
            type: String,
            trim: true
        },

        status: {
            type: String,
            enum: ["pending", "confirmed", "rejected", "completed"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Appointment", appointmentSchema);