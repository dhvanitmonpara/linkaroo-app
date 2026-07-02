import "dotenv/config"
import connectDB from "./db/index.js"
import { app } from "./app.js"

const port = process.env.PORT || 8000

connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server is listening to port ${port}`)
    })
    app.on("error", (error) => {
        console.log("ERROR: ", error)
        throw error
    })
}).catch((error) => {
    console.log("MongoDB connection failed: ", error)
})