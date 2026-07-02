import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionString = process.env.ENVIRONMENT === "production" ? `${process.env.MONGODB_URI}/${DB_NAME}` : process.env.MONGODB_URI
        await mongoose.connect(connectionString)
        // const connectionInstance = await mongoose.connect(connectionString)
        // console.log('MongoDB connected! Instance is ', connectionInstance)
    } catch (error) {
        console.log("MongoDB connection error: ", error)
        process.exit(1)
    }
}

export default connectDB