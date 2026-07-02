import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    clerkId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    useFullTypeFormAdder: {
        type: Boolean,
        default: true
    },
    isQuickSearchEnabled: {
        type: Boolean,
        default: true
    },
    theme: {
        type: String,
        default: "dark"
    },
    font: {
        type: String,
        default: "font-helvetica"
    },
}, { timestamps: true })

export const User = mongoose.model("User", userSchema)