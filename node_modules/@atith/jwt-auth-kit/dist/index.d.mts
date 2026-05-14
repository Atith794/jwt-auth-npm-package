import { SignOptions } from 'jsonwebtoken';

type SupportedJwtAlgorithm = "HS256" | "HS384" | "HS512";
type LoginUserCredentials = {
    email: string;
    password: string;
};
type RegisterUserCredentials = {
    name?: string;
    email: string;
    password: string;
    [key: string]: any;
};
type AuthUser = {
    id?: string;
    _id?: string;
    email: string;
    password?: string;
    passwordHash?: string;
    [key: string]: any;
};
type CreateAuthKitOptions<TUser extends AuthUser> = {
    jwtSecret: string;
    expiresIn?: SignOptions["expiresIn"];
    saltRounds?: number;
    algorithm?: SupportedJwtAlgorithm;
    findUserByEmail: (email: string) => Promise<TUser | null>;
    createUser: (userData: Omit<RegisterUserCredentials, "password"> & {
        passwordHash: string;
    }) => Promise<TUser>;
    getUserId?: (user: TUser) => string;
};
type AuthTokenPayload = {
    userId: string;
    email: string;
};

declare function createAuthKit<TUser extends AuthUser>(options: CreateAuthKitOptions<TUser>): {
    register(registerCredentials: RegisterUserCredentials): Promise<{
        user: Omit<TUser, "password" | "passwordHash">;
        token: string;
    }>;
    login(loginCredentials: LoginUserCredentials): Promise<{
        user: Omit<TUser, "password" | "passwordHash">;
        token: string;
    }>;
    verifyToken(token: string): AuthTokenPayload;
    hashPassword(password: string): Promise<string>;
    comparePassword(password: string, hash: string): Promise<boolean>;
    generateToken: (user: TUser) => string;
};

export { type AuthTokenPayload, type AuthUser, type CreateAuthKitOptions, type LoginUserCredentials, type RegisterUserCredentials, createAuthKit };
