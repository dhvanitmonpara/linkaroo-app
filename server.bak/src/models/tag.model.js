import mongoose, { Schema } from "mongoose";

const tagSchema = new Schema({

    tagname: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
    
}, { timestamps: true })

export const Tag = mongoose.model("Tag", tagSchema)