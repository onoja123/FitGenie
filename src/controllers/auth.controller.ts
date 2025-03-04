import { NextFunction, Request, Response } from 'express';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
const { promisify } = require('util');
import { Iuser } from '../types/interfaces/user.inter';
import AuthValidator from '../validators/auth.validator';
import ResponseHelper from '../utils/response';
import AuthService from '../services/auth.service';



declare global {
  namespace Express {
    interface Request {
      user: Iuser;
    }
  }
}


  
/**
 * @author 
 * @description Signup individual controller
 * @route `/api/v1/auth/signup-individual`
 * @access Public
 * @type POST
 */
export const signup = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  let newUser: Iuser | null = null; 
  
  try {
    const validationResult = AuthValidator.signup(req.body);
    
    if (validationResult.error) {
      return next(new AppError(validationResult.error.message, ResponseHelper.BAD_REQUEST));
    }
    
    const { 
      firstname, 
      lastname,
      gender,
      email, 
      password,

    } = req.body;
    
    const existingEmail = await AuthService.findUserByEmail(email);
    
    if (existingEmail) {
      return next(new AppError("This email is already taken, please try signing up with a different email.", ResponseHelper.BAD_REQUEST));
    }


    newUser = await AuthService.createUser({
      firstname, 
      lastname,
      gender,
      email, 
      password,
    });

    // await sendEmail({
    //   to: newUser.email,
    //   subject: 'Welcome 🚀',
    //   templateName: 'welcome',
    //   placeholders: {
    //     firstname: newUser.firstname,
    //     otp: otp
    //   },
    // });


    await AuthService.createSendToken(newUser, 201, res);
    
  } catch (err) {

    
    if (newUser) {
      await AuthService.deleteUserById(newUser._id as string);
    }
    console.log("error", err);
    return next(new AppError("Couldn't create the user. Please try again.", ResponseHelper.INTERNAL_SERVER_ERROR));
  }
});


/**
 * @author 
 * @description Verify users email controller
 * @route `/api/v1/auth/verify`
 * @access Public
 * @type POST
 */
export const verify = catchAsync(async(req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = AuthValidator.verify(req.body);

    if (validationResult.error) {
      return next(new AppError(validationResult.error.message, ResponseHelper.BAD_REQUEST));
    }
  
    const { otpCode } = req.body;
  
    if (!otpCode) {
      return next(new AppError("Please provide an OTP code", ResponseHelper.UNAUTHORIZED));
    }
  
    const user = await AuthService.findUserfindOTP(otpCode)
  
  
    if (!user) {
      return next(new AppError("This otp code has expired or is invalid, please check and try again.", ResponseHelper.BAD_REQUEST))
    }
  
    if (user.otp.expiresAt && user.otp.expiresAt < new Date()) {
      return next(new AppError("This otp code has expired", ResponseHelper.BAD_REQUEST));
    }
  
    if (user.isActive === true) {
      user.otp.code = null;
      return next(new AppError("Your account has already been verified.", ResponseHelper.BAD_REQUEST))
    }

    await AuthService.verifyUser(user);

    await user.save({ validateBeforeSave: false });

    // await sendEmail({
    //   to: user.email,
    //   subject: 'Email Verification 🚀',
    //   templateName: 'account-activation',
    //   placeholders: {
    //     firstname: user.firstname ,
    //   },
    // });
  
    ResponseHelper.sendSuccessResponse(res, {
        statusCode: ResponseHelper.OK, 
        message: 'Otp verified successfully 🚀!',
    });
    
  } catch (error) {
    return next(new AppError("An error occurred while verify the otp", ResponseHelper.INTERNAL_SERVER_ERROR))
  }
})

/**
 * @author 
 * @description Login user controller
 * @route `/api/v1/auth/login`
 * @access Public
 * @type POST
 */
export const login = catchAsync(async(req: Request, res: Response, next: NextFunction) => {

  const validationResult = AuthValidator.login(req.body);

  if (validationResult.error) {
    return next(new AppError(validationResult.error.message, ResponseHelper.BAD_REQUEST));
  }

  const { email, password } = req.body;


  const user = await AuthService.findUserByEmail(email)

  if (!user) {
      return next(new AppError("User does not exist", ResponseHelper.RESOURCE_NOT_FOUND))
  }

  if (user.isActive === false) {
    return next(new AppError("Please verify your email and try again.", ResponseHelper.BAD_REQUEST))
  }

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password.", ResponseHelper.UNAUTHORIZED))    
  }



  await AuthService.createSendToken(user, 201, res);
})


/**
 * @author 
 * @description Resend verification otp to users email Controller
 * @route `/api/v1/auth/resendverification`
 * @access Public
 * @type POST
 */
export const resendVerification = catchAsync(async(req: Request, res: Response, next: NextFunction)=>{

  const user = await AuthService.findUserByEmail(req.body.email)

    if (!user) {
      return next(new AppError("User does not exist", ResponseHelper.RESOURCE_NOT_FOUND))
    }
  
    if (user.isActive === true) {
      return next(new AppError("Account has already been verified", ResponseHelper.BAD_REQUEST));
    }
  
    const otp = await AuthService.generateOTP()

    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  };

  await user.save({ validateBeforeSave: false });

  
    try {

      // await sendEmail({
      //   to: user.email,
      //   subject: 'Verification Link 🚀!',
      //   templateName: 'forgot-password',
      //   placeholders: {
      //     firstname: user.firstname,
      //   },
      // });

      ResponseHelper.sendSuccessResponse(res, {
        statusCode: ResponseHelper.OK, 
        message: 'Verification code sent successfully🚀!',
    });

    } catch (err) {
        user.otp.code = null;
      await user.save({ validateBeforeSave: false });
  
      return next(new AppError("Couldn't send the verification email", ResponseHelper.INTERNAL_SERVER_ERROR));
    }
})

/**
 * @author 
 * @description Forogot password controller
 * @route `/api/v1/auth/forgotPassword`
 * @access Public
 * @type POST
 */
export const forgotPassword = catchAsync(async(req:Request, res:Response, next: NextFunction) => {

  const validationResult = AuthValidator.forgotPassword(req.body);

  if (validationResult.error) {
    return next(new AppError(validationResult.error.details[0].message, ResponseHelper.BAD_REQUEST));
  }

  const user = await AuthService.findUserByEmail(req.body.email)

  if (!user) {
    return next(new AppError("There is no user with this email address.", ResponseHelper.RESOURCE_NOT_FOUND))
  }
  

    const otp = await AuthService.generateOTP()

    user.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    };

    // Save user
    await user.save({ validateBeforeSave: false });


  try {

    // await sendEmail({
    //   to: user.email,
    //   subject: 'Verification Link 🚀!',
    //   templateName: 'forgot-password',
    //   placeholders: {
    //     firstname: user.firstname,
    //   },
    // });

    ResponseHelper.sendSuccessResponse(res, {
      statusCode: ResponseHelper.OK, 
      message: 'Email sent sucessfully 🚀!',
  });
  } catch (err) {
    user.otp.code= null;
    await user.save({ validateBeforeSave: false });

    return next(new AppError("An error occurred while resetting the password", ResponseHelper.INTERNAL_SERVER_ERROR))
  }
})

/**
 * @author 
 * @description Reset Password Controller
 * @route `/api/v1/auth/resetpassword`
 * @access Public
 * @type POST
 */
export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const validationResult = AuthValidator.resetPassword(req.body);

        if (validationResult.error) {
            return next(new AppError(validationResult.error.details[0].message, ResponseHelper.BAD_REQUEST));
        }

        const { otpCode } = req.body;

        if (!otpCode) {
            return next(new AppError("Please provide an OTP code and try again.", ResponseHelper.BAD_REQUEST));
        }

        const user = await AuthService.findUserfindOTP(otpCode)

        if (!user) {
            return next(new AppError("This OTP code has expired or is invalid", ResponseHelper.BAD_REQUEST));
        }

        if (user.otp.expiresAt && user.otp.expiresAt < new Date()) {
            return next(new AppError("This OTP code has expired", ResponseHelper.BAD_REQUEST));
        }

        await AuthService.updatePassword(req.user?.id, req.body.password, req.body.confirmPassword);
        
        ResponseHelper.sendSuccessResponse(res, {
            statusCode: ResponseHelper.OK,
            message: 'Password updated successfully!',
        });

    } catch (error) {
        return next(new AppError("An error occurred while resetting the password", ResponseHelper.INTERNAL_SERVER_ERROR));
    }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Update Password Controller
 * @route `/api/auth/updatepassword`
 * @access Public
 * @type POST
 */
export const updatePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  try {

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(
        new AppError(
          'Please provide current password, new password, and confirm password',
          400
        )
      );
    }

    const user = await AuthService.findUserById(req.user?.id);


    if (!user) {
      return next(new AppError("User not found", ResponseHelper.RESOURCE_NOT_FOUND));
    }
  
    if (!(await user.correctPassword(currentPassword, user.password))) {
      return next(
        new AppError(
          'Current password is incorrect', 
          401
        )
      );
    }
  
    if (newPassword !== confirmPassword) {
      return next(
        new AppError(
          "New password and confirm password don't match", 
          400
        )
      );
    }
  
    await AuthService.updatePassword(req.user?.id, newPassword, confirmPassword);
  
    ResponseHelper.sendSuccessResponse(res, {
      statusCode: ResponseHelper.OK ,
      message: 'Password updated successfully!',
  });
  } catch (error) {
    return next(new AppError("An error occurred while resetting the password", ResponseHelper.INTERNAL_SERVER_ERROR));
  }
});


export const logOut = catchAsync(async(req: Request, res: Response, next: NextFunction) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });

    ResponseHelper.sendSuccessResponse(res, {
        message: 'Successfully logged out',
    })
})

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError("You are not logged in! Please log in to get access.", ResponseHelper.UNAUTHORIZED));
    }

    try {

        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY || 'mysecret');

        const currentUser = await AuthService.findUserById(decoded.id);

        if (!currentUser) {
            return next(new AppError("The user belonging to this token does no longer exist.", ResponseHelper.UNAUTHORIZED));
        }

        if (currentUser.changedPasswordAfter(decoded.iat)) {
            return next(new AppError("User recently changed password, please login again!", ResponseHelper.UNAUTHORIZED));
        }

        req.user = currentUser;
        next();
    } catch (err) {
        if (err instanceof TokenExpiredError) {

            return next(new AppError("Your token has expired. Please log in again to get a new token.", ResponseHelper.UNAUTHORIZED));
        } else {
            return next(new AppError("Invalid token. Please log in again to get a new token.", ResponseHelper.UNAUTHORIZED));
        }
    }
});
