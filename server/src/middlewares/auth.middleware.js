import { requireAuth } from '@clerk/express';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const verifyJWT = [
    requireAuth(),
    asyncHandler(async (req, res, next) => {
        if (!req.auth || !req.auth.userId) {
            throw new ApiError(401, "Unauthorized request");
        }

        const user = await User.findOne({ clerkId: req.auth.userId });

        if (!user) {
            throw new ApiError(401, "User not found in database");
        }

        req.user = user;
        next();
    })
];
