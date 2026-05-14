import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
    AuthTokenPayload,
    AuthUser,
    CreateAuthKitOptions,
    RegisterUserCredentials,
    LoginUserCredentials,
    SupportedJwtAlgorithm
} from "./types";

const SUPPORTED_ALGORITHMS: SupportedJwtAlgorithm[] = [
    "HS256",
    "HS384",
    "HS512"
]

const MIN_SALT_ROUNDS = 10;
const MAX_SALT_ROUNDS = 15;

export function createAuthKit<TUser extends AuthUser>(
    options: CreateAuthKitOptions<TUser>
) {
    const {
        jwtSecret,
        expiresIn,
        saltRounds = 10,
        algorithm = "HS256",
        findUserByEmail,
        createUser,
        getUserId
    } = options;

    if (!jwtSecret) throw new Error("JWT secret key is required");

    if(!Number.isInteger(saltRounds)) throw new Error("Salt rounds should be a number");

    if(saltRounds < MIN_SALT_ROUNDS){
        throw new Error(`Salt rounds cost factor is too weak. Minimum supported cost factor is ${MIN_SALT_ROUNDS}`);
    }

    if(saltRounds > MAX_SALT_ROUNDS){
        throw new Error(`Salt rounds cost factor is too expensive. Maximum supported cost factor is ${MAX_SALT_ROUNDS}`);
    }

    if(!SUPPORTED_ALGORITHMS.includes(algorithm)) {
        throw new Error(`Unsupported JWT algorithm "${algorithm}". Supported algorithms are: ${SUPPORTED_ALGORITHMS.join(
                ", "
            )}.`
        )
    }
    const sanitizeUser = (user: TUser) => {
        const { password, passwordHash, ...safeUser } = user;
        return safeUser;
    };

    const resolveUserId = (user: TUser): string => {

        if (getUserId) return getUserId(user);

        let id = user.id || user._id;

        if (!id) throw new Error("User id is not found.")

        return String(id);
    }

    const generateToken = (user: TUser): string => {
        let payload: AuthTokenPayload = {
            userId: resolveUserId(user),
            email: user.email
        }

        return jwt.sign(payload, jwtSecret, {
            expiresIn: expiresIn ?? "7d",
            algorithm,
        })
    }

    return {
        async register(registerCredentials: RegisterUserCredentials) {
            const { email, password, ...rest } = registerCredentials;

            if (!email) throw new Error("Email is required");

            if (!password) throw new Error("Password is required");

            const existingUser = await findUserByEmail(email);

            if (existingUser) throw new Error("User already exists");

            const passwordHash = await bcrypt.hash(password, saltRounds);

            const user = await createUser({
                email,
                ...rest,
                passwordHash
            })

            const token = generateToken(user)

            return {
                user: sanitizeUser(user),
                token
            };
        },

        async login(loginCredentials: LoginUserCredentials) {
            const { email, password } = loginCredentials;

            if (!email) throw new Error("Email is required");

            if (!password) throw new Error("Password is required");

            const user = await findUserByEmail(email);

            if (!user) throw new Error("Invalid email or password or user does not exist");

            const storedPassword = user.passwordHash || user.password;

            if (!storedPassword) throw new Error("Internal server error while fetching the password")

            const isPasswordValid = await bcrypt.compare(password, storedPassword);

            if (!isPasswordValid) throw new Error("Invalid credentials passed");

            const token = generateToken(user);

            return {
                user: sanitizeUser(user),
                token,
            }
        },

        verifyToken(token: string): AuthTokenPayload {
            if (!token) throw new Error("Token is required");

            return jwt.verify(token, jwtSecret, {
                algorithms: [algorithm],
            }) as AuthTokenPayload;
        },

        hashPassword(password: string) {
            return bcrypt.hash(password, saltRounds)
        },

        comparePassword(password: string, hash: string) {
            return bcrypt.compare(password, hash);
        },

        generateToken,
    };
}