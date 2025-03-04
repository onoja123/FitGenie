import express from "express";
import { 
    getProfile, 
    updateProfile, 
    uploadImage, 
    deleteMember,
    setProfile,
} from "../controllers/profile.controller";
import MiddlewareService from "../middlewares/auth.middleware";


const ProfileRouter = express.Router()

ProfileRouter.use(MiddlewareService.protect)

ProfileRouter.get('/get-profile', getProfile)

ProfileRouter.put('/set-profile', setProfile);

ProfileRouter.patch('/update-profile', updateProfile);

ProfileRouter.put('/upload-image', uploadImage);

ProfileRouter.delete('/delete-profile', deleteMember)

export default ProfileRouter;