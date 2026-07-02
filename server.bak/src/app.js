import { clerkMiddleware } from '@clerk/express';
import http from 'http'
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { Server } from 'socket.io';

const app = express()
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ACCESS_CONTROL_ORIGIN, // Replace with your frontend URL
    methods: ["GET", "POST"],
  },
});
const corsOptions = {
    origin: process.env.ACCESS_CONTROL_ORIGIN,
    credentials: true,
    optionsSuccessStatus: 200
}

// cors middleware
app.use(cors(corsOptions))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())
app.use(clerkMiddleware())
app.options('*', cors()); 

const onlineUsers = new Map();

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;

    onlineUsers.set(userId, socket);
    console.log(`User ${userId} connected`);

    io.emit('userConnected', { userId });

    sendPendingNotifications(userId);

    socket.on('disconnect', () => {
        onlineUsers.delete(userId); // Remove user from online list
        console.log(`User ${userId} disconnected`);

        io.emit('userDisconnected', { userId });
    });

    socket.on('markNotificationRead', (notificationId) => {
        markNotificationAsRead(notificationId);
        socket.emit('notificationUpdated', { notificationId });
    });
});

async function sendPendingNotifications(userId) {
    const notifications = await getPendingNotificationsFromDB(userId);
    if (notifications.length > 0) {
        onlineUsers.get(userId).emit('pendingNotifications', notifications);
    }
}

//routes import
import userRouter from './routes/user.routes.js'
import linkRouter from "./routes/link.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tagRouter from "./routes/tag.routes.js"
import searchRouter from "./routes/search.routes.js"
import collectionRouter from "./routes/collection.routes.js"

//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/links", linkRouter)
app.use("/api/v1/tags", tagRouter)
app.use("/api/v1/collections", collectionRouter)
app.use("/api/v1/search", searchRouter)

// http://localhost:8000/api/v1/users/register

export { app }