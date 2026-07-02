import { ApiError } from "./ApiError.js";

const asyncHandler = (requestHandler) => async (req, res, next) => {
    try {
        return await requestHandler(req, res, next);
    } catch (error) {
        if (error instanceof ApiError) {
            res.status(error.statusCode).json({
                success: error.success,
                message: error.message,
                errors: error.errors
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }
};

export { asyncHandler }