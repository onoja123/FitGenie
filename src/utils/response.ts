import { Response } from "express";

export default class ResponseHelper {
    static OK = 200;
    static RESOURCE_CREATED = 201;
    static ACCEPTED = 202;
    static NO_CONTENT = 204;
    static UNAUTHORIZED = 401;
    static RESOURCE_NOT_FOUND = 404;
    static BAD_REQUEST = 400;
    static FORBIDDEN = 403;
    static INTERNAL_SERVER_ERROR = 500;

    static sendResponse(
        res: Response,
        {
            message,
            data,
            statusCode,
        }: {
            message?: string;
            data?: { [key: string]: any };
            statusCode: number;
        }
    ) {
        const body: { [key: string]: any } = {
            success:
                statusCode <= 199
                    ? "info"
                    : statusCode > 199 && statusCode <= 299
                    ? true
                    : statusCode > 299 && statusCode <= 399
                    ? "redirection"
                    : statusCode > 399 && statusCode <= 499
                    ? "fail"
                    : "error",
        };
        if (message) body.message = message;
        if (data) body.data = data;
        res.status(statusCode).json(body);
    }

    static sendSuccessResponse(
        res: Response,
        {
            message,
            data,
            statusCode,
        }: {
            message?: string;
            data?: { [key: string]: any };
            statusCode?: number;
        }
    ) {
        ResponseHelper.sendResponse(res, {
            message,
            data,
            statusCode: statusCode || ResponseHelper.OK,
        });
    }
    
    static sendErrorResponse(
        res: Response,
        {
            message,
            statusCode,
        }: {
            message: string;
            statusCode: number;
        }
    ) {
        ResponseHelper.sendResponse(res, {
            message,
            statusCode,
        });
    }
    
}
