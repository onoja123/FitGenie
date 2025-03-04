import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import ProfileValidator from "../validators/profile.validator";
import AppError from "../utils/appError";
import ResponseHelper from "../utils/response";
import ProfileService from "../services/profile.service";
import { cloudinary } from "../config/cloudinary";
import multer from "multer";


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get profile
 * @route `/api/v1/profile/get-profile`
 * @access Private
 * @type GET
 **/
export const getProfile = catchAsync(async(req: Request, res: Response, next: NextFunction)=>{
  try {
      const profile = await ProfileService.getProfile(req.user?.id)

      if(!profile ) {
          return next(new AppError("No profile found", ResponseHelper.RESOURCE_NOT_FOUND))
      }

      ResponseHelper.sendSuccessResponse(res, { 
          statusCode: ResponseHelper.OK,
          data: profile ,  
      });

  } catch (error) {
    console.log(error)
    return next(new AppError("An error occurred while trying to get your profile. Please try again.", ResponseHelper.INTERNAL_SERVER_ERROR))
  }
})

/**
 * @author
 * @description Update profile
 * @route `/api/v1/profile/update-profile`
 * @access Private
 * @type PATCH
 **/
export const setProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  try {

    // const validationResult = ProfileValidator.setProfile(req.body);

    // // if error, send error response
    // if (validationResult.error) {
    //     return next(new AppError(validationResult.error.message, ResponseHelper.BAD_REQUEST));
    // }
  
    const profile = await ProfileService.setProfile(req.user?.id, req.body)

    if(!profile){
      return next(new AppError("User not found", ResponseHelper.RESOURCE_NOT_FOUND))
    }
  
    // send success response
    ResponseHelper.sendSuccessResponse(res, {
        message: 'Profile set successfully',
        statusCode: ResponseHelper.OK,
        data: profile,
    });

  } catch (error) {
    return next(new AppError("An error occurred while trying to set your profile. Please try again.", ResponseHelper.INTERNAL_SERVER_ERROR))
  }
})



/**
 * @author
 * @description Update profile
 * @route `/api/v1/profile/update-profile`
 * @access Private
 * @type PATCH
 **/
export const updateProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  try {

    const validationResult = ProfileValidator.updateProfile(req.body);

    // if error, send error response
    if (validationResult.error) {
        return next(new AppError(validationResult.error.message, ResponseHelper.BAD_REQUEST));
    }
  
    const profile = await ProfileService.updateUserProfile(req.user?.id, req.body)

    if(!profile){
      return next(new AppError("User not found", ResponseHelper.RESOURCE_NOT_FOUND))
    }
  
    // send success response
    ResponseHelper.sendSuccessResponse(res, {
        message: 'Updated profile successfully',
        statusCode: ResponseHelper.OK,
        data: profile,
    });

  } catch (error) {
    return next(new AppError("An error occurred while trying to update your profile. Please try again.", ResponseHelper.INTERNAL_SERVER_ERROR))
  }
})


/**
 * @author
 * @description Update profile picture
 * @route `/api/v1/profile/upload-image`
 * @access Private
 * @type PUT
 **/
export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const upload = multer().single('image');

    upload(req, res, async (err: any) => {
      if (err) {
        return next (new AppError('Error uploading image.', ResponseHelper.BAD_REQUEST));
      }
        if (!req.file) {
          return new AppError('No file uploaded.', ResponseHelper.BAD_REQUEST);
        }

        const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        const result = await cloudinary.uploader.upload(dataUrl, {
          folder: 'user_images',
        });

        const imageUrl = result.secure_url;

        const profile = await ProfileService.uploadImage(req.user?.id, { ...req.body, image: imageUrl });

        if (!profile) {
          return new AppError('User not found', ResponseHelper.RESOURCE_NOT_FOUND);
        }

        ResponseHelper.sendSuccessResponse(res, {
          message: 'Uploaded profile image successfully',
          statusCode: ResponseHelper.OK,
          data: { profile },
        });
    });
  } catch (error) {
    next(new AppError('An error occurred while trying to upload profile image. Please try again.', ResponseHelper.INTERNAL_SERVER_ERROR));
  }
};

/**
 * @author
 * @description Delete member
 * @route `/api/v1/profile/delete-member/:id`
 * @access Private
 * @type DELETE
 **/
export const deleteMember = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  try {

    const profile = await ProfileService.deleteMember(req.user?.id)
 
    if(!profile){
      return next(new AppError("User not found", ResponseHelper.RESOURCE_NOT_FOUND))
    }

    // send response
     ResponseHelper.sendResponse(res, {
      message: "Profile deleted successfully",
      statusCode: ResponseHelper.OK 
      });

  } catch (error) {
    return next(new AppError("An error occurred while trying to get your profile. Please try again.", ResponseHelper.INTERNAL_SERVER_ERROR))
  }
});