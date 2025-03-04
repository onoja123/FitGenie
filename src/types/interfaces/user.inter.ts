import { Document } from "mongoose";

interface IOtp {
    code: number | null;
    expiresAt: Date | null;
}


export interface Iuser extends Document{
    firstname: string;
    lastname: string;
    gender: string;
    email: string;
    password: string;
    image?: string | '';
    passwordConfirm: string;
    isActive: boolean;
    onlineStatus: boolean;
    verificationToken: string;
    verificationTokenExpires: Date;
    otp: IOtp;
    resetPasswordToken: number;
    resetPasswordExpire: Date;
    verifyEmailToken: string;
    correctPassword(candidatePassword: string, userPassword: string): Promise<boolean>;
    generateAuthToken(): string;
    changedPasswordAfter(JWTTimestamp: any): boolean;
    createdAt: Date;
}
