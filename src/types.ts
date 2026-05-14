import type { SignOptions } from "jsonwebtoken";

export type SupportedJwtAlgorithm = "HS256" | "HS384" | "HS512";

export type LoginUserCredentials = {
    email: string;
    password: string;
}

export type RegisterUserCredentials = {
    name?: string;
    email: string;
    password: string;
    [key: string]: any;
}

export type AuthUser = {
    id?: string;
    _id?: string;
    email:string;
    password?: string;
    passwordHash?:string;
    [key: string]: any; 
}

export type CreateAuthKitOptions<TUser extends AuthUser> = {
    jwtSecret: string;
    expiresIn?:  SignOptions["expiresIn"];
    saltRounds?: number;
    algorithm?: SupportedJwtAlgorithm;

    findUserByEmail: (email: string) => Promise<TUser | null>

    createUser: (userData: Omit<RegisterUserCredentials, "password"> & {
        passwordHash: string;
    }) => Promise<TUser>;

    getUserId?: (user: TUser) => string;
}

export type AuthTokenPayload = {
    userId: string;
    email: string;
}