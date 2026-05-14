"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  createAuthKit: () => createAuthKit
});
module.exports = __toCommonJS(index_exports);

// src/auth.ts
var import_bcryptjs = __toESM(require("bcryptjs"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var SUPPORTED_ALGORITHMS = [
  "HS256",
  "HS384",
  "HS512"
];
var MIN_SALT_ROUNDS = 10;
var MAX_SALT_ROUNDS = 15;
function createAuthKit(options) {
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
  if (!Number.isInteger(saltRounds)) throw new Error("Salt rounds should be a number");
  if (saltRounds < MIN_SALT_ROUNDS) {
    throw new Error(`Salt rounds cost factor is too weak. Minimum supported cost factor is ${MIN_SALT_ROUNDS}`);
  }
  if (saltRounds > MAX_SALT_ROUNDS) {
    throw new Error(`Salt rounds cost factor is too expensive. Maximum supported cost factor is ${MAX_SALT_ROUNDS}`);
  }
  if (!SUPPORTED_ALGORITHMS.includes(algorithm)) {
    throw new Error(
      `Unsupported JWT algorithm "${algorithm}". Supported algorithms are: ${SUPPORTED_ALGORITHMS.join(
        ", "
      )}.`
    );
  }
  const sanitizeUser = (user) => {
    const { password, passwordHash, ...safeUser } = user;
    return safeUser;
  };
  const resolveUserId = (user) => {
    if (getUserId) return getUserId(user);
    let id = user.id || user._id;
    if (!id) throw new Error("User id is not found.");
    return String(id);
  };
  const generateToken = (user) => {
    let payload = {
      userId: resolveUserId(user),
      email: user.email
    };
    return import_jsonwebtoken.default.sign(payload, jwtSecret, {
      expiresIn: expiresIn ?? "7d",
      algorithm
    });
  };
  return {
    async register(registerCredentials) {
      const { email, password, ...rest } = registerCredentials;
      if (!email) throw new Error("Email is required");
      if (!password) throw new Error("Password is required");
      const existingUser = await findUserByEmail(email);
      if (existingUser) throw new Error("User already exists");
      const passwordHash = await import_bcryptjs.default.hash(password, saltRounds);
      const user = await createUser({
        email,
        ...rest,
        passwordHash
      });
      const token = generateToken(user);
      return {
        user: sanitizeUser(user),
        token
      };
    },
    async login(loginCredentials) {
      const { email, password } = loginCredentials;
      if (!email) throw new Error("Email is required");
      if (!password) throw new Error("Password is required");
      const user = await findUserByEmail(email);
      if (!user) throw new Error("Invalid email or password or user does not exist");
      const storedPassword = user.passwordHash || user.password;
      if (!storedPassword) throw new Error("Internal server error while fetching the password");
      const isPasswordValid = await import_bcryptjs.default.compare(password, storedPassword);
      if (!isPasswordValid) throw new Error("Invalid credentials passed");
      const token = generateToken(user);
      return {
        user: sanitizeUser(user),
        token
      };
    },
    verifyToken(token) {
      if (!token) throw new Error("Token is required");
      return import_jsonwebtoken.default.verify(token, jwtSecret, {
        algorithms: [algorithm]
      });
    },
    hashPassword(password) {
      return import_bcryptjs.default.hash(password, saltRounds);
    },
    comparePassword(password, hash) {
      return import_bcryptjs.default.compare(password, hash);
    },
    generateToken
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createAuthKit
});
//# sourceMappingURL=index.js.map