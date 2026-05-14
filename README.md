This is an npm package to authenticate the user using token based authentication. This package can be implemented to reduce the overhead of writing the same code of authentication for every application.



# @atithnj/jwt-auth-kit

A simple TypeScript-based npm package for token-based authentication using JWT and bcrypt.

This package helps you reduce the repeated work of writing authentication logic for every Node.js application. It provides reusable methods for user registration, login, password hashing, password comparison, JWT token generation, and JWT token verification.

The package is database-independent, which means it can be used with MongoDB, MySQL, PostgreSQL, Prisma, Sequelize, Mongoose, TypeORM, Firebase, Supabase, or any other database.

---

## Features

- Register users
- Login users
- Hash passwords using bcrypt
- Compare plain passwords with hashed passwords
- Generate JWT tokens
- Verify JWT tokens
- Supports configurable JWT expiry time
- Supports configurable bcrypt salt rounds
- Supports selected JWT algorithms
- Works with any database

---

## Installation

bash
npm install @atithnj/jwt-auth-kit

---

## Basic Usage

import { createAuthKit } from "@atithnj/jwt-auth-kit";

const users: any[] = [];

const auth = createAuthKit({
  jwtSecret: "my-secret-key",

  findUserByEmail: async (email: string) => {
    return users.find((user) => user.email === email) || null;
  },

  createUser: async (userData: any) => {
    const user = {
      id: String(users.length + 1),
      ...userData,
    };

    users.push(user);
    return user;
  },
});

async function main() {
  const registerResult = await auth.register({
    name: "Atith",
    email: "atith@gmail.com",
    password: "123456",
  });

  console.log("Registered:", registerResult);

  const loginResult = await auth.login({
    email: "atith@gmail.com",
    password: "123456",
  });

  console.log("Logged in:", loginResult);

  const decoded = auth.verifyToken(loginResult.token);

  console.log("Decoded token:", decoded);
}

main();


---

## Why this package is database-independent

This package does not directly connect to your database.

Instead, your application provides two functions:

findUserByEmail: async (email) => {
  // your database logic to find user
}

createUser: async (userData) => {
  // your database logic to create user
}

Because of this design, the package can work with any database or ORM.

---

## Example with MongoDB / Mongoose


import { createAuthKit } from "@atithnj/jwt-auth-kit";
import User from "./models/User";

const auth = createAuthKit({
  jwtSecret: process.env.JWT_SECRET!,

  findUserByEmail: async (email) => {
    return User.findOne({ email });
  },

  createUser: async (userData) => {
    return User.create(userData);
  },
});


---

## Example with MySQL


import { createAuthKit } from "@atithnj/jwt-auth-kit";
import db from "./db";

const auth = createAuthKit({
  jwtSecret: process.env.JWT_SECRET!,

  findUserByEmail: async (email) => {
    const [rows]: any = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    return rows[0] || null;
  },

  createUser: async (userData) => {
    const [result]: any = await db.query(
      "INSERT INTO users (email, passwordHash) VALUES (?, ?)",
      [userData.email, userData.passwordHash]
    );

    return {
      id: String(result.insertId),
      email: userData.email,
      passwordHash: userData.passwordHash,
    };
  },
});


---

## Example with Prisma


import { createAuthKit } from "@atithnj/jwt-auth-kit";
import { prisma } from "./prisma";

const auth = createAuthKit({
  jwtSecret: process.env.JWT_SECRET!,

  findUserByEmail: async (email) => {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  createUser: async (userData) => {
    return prisma.user.create({
      data: userData,
    });
  },
});


---

## Configuration Options


const auth = createAuthKit({
  jwtSecret: "your-secret-key",
  expiresIn: "7d",
  saltRounds: 10,
  algorithm: "HS256",
  findUserByEmail,
  createUser,
  getUserId,
});


### `jwtSecret`

Required.

The secret key used to sign and verify JWT tokens.

jwtSecret: process.env.JWT_SECRET!

For production, use a strong secret from environment variables.

Do not hardcode your JWT secret in production.

---

### `expiresIn`

Optional.

Defines how long the JWT token is valid.

Default: "7d"

Example:
expiresIn: "1h"
Common values:
"15m"
"1h"
"7d"

For production applications, shorter access token expiry such as `"15m"` or `"1h"` is recommended.

---

### `saltRounds`

Optional.

Defines the bcrypt cost factor used for password hashing.

Default: 10


Allowed range: 10 to 15


Example: saltRounds: 12

If the value is less than `10`, the package throws an error because the hashing strength will be too weak.

If the value is greater than `15`, the package throws an error because the cost factor may become too expensive.

---

### `algorithm`

Optional.

Defines the JWT signing algorithm.

Default: "HS256"

Supported algorithms:
"HS256"
"HS384"
"HS512"


Example: algorithm: "HS256"

If an unsupported algorithm is passed, the package throws an error.

---

### `findUserByEmail`

Required.

A function provided by your application to find a user by email.

Example:

findUserByEmail: async (email) => {
  return User.findOne({ email });
}

This package does not know your database structure, so your app must provide this function.

---

### `createUser`

Required.

A function provided by your application to create a new user.

Example:

createUser: async (userData) => {
  return User.create(userData);
}

The package hashes the password first and sends `passwordHash` to this function.

---

### `getUserId`

Optional.

Used when your user object has a custom ID field.

By default, the package checks:

user.id or user._id

If your user object uses another field, you can pass `getUserId`.

Example:

const auth = createAuthKit({
  jwtSecret: process.env.JWT_SECRET!,

  findUserByEmail,
  createUser,

  getUserId: (user) => user.userId,
});

---

## Methods

The `createAuthKit()` function returns the following methods:

auth.register()
auth.login()
auth.verifyToken()
auth.hashPassword()
auth.comparePassword()
auth.generateToken()

---

## `register()`

Registers a new user.

const result = await auth.register({
  name: "Atith",
  email: "atith@gmail.com",
  password: "123456",
});

Internally, this method:

1. Checks whether email and password are provided
2. Calls `findUserByEmail()` to check if the user already exists
3. Hashes the password using bcrypt
4. Calls `createUser()` to save the user
5. Generates a JWT token
6. Returns the created user and token

Example response:
{
  user: {
    id: "1",
    name: "Atith",
    email: "atith@gmail.com"
  },
  token: "jwt-token"
}

The returned user object does not include `password` or `passwordHash`.

---

## `login()`

Logs in an existing user.

const result = await auth.login({
  email: "atith@gmail.com",
  password: "123456",
});

Internally, this method:

1. Checks whether email and password are provided
2. Calls `findUserByEmail()` to find the user
3. Reads the stored password hash from `passwordHash` or `password`
4. Compares the plain password with the stored hash
5. Generates a JWT token
6. Returns the user and token

Example response:


{
  user: {
    id: "1",
    name: "Atith",
    email: "atith@gmail.com"
  },
  token: "jwt-token"
}


The returned user does not include `password` or `passwordHash`.

---

## `verifyToken()`

Verifies a JWT token.

const decoded = auth.verifyToken(token);

Example response:

{
  userId: "1",
  email: "atith@gmail.com",
  iat: 1777870000,
  exp: 1778474800
}

If the token is invalid or expired, this method throws an error.

---

## `hashPassword()`

Hashes a plain password.

const hash = await auth.hashPassword("123456");

This is useful when you want to write your own custom registration logic but still use this package for password hashing.

Example:

const passwordHash = await auth.hashPassword(req.body.password);

await User.create({
  email: req.body.email,
  passwordHash,
});

---

## `comparePassword()`

Compares a plain password with a hashed password.

const isValid = await auth.comparePassword("123456", user.passwordHash);

This is useful when you want to write your own custom login logic but still use this package for password comparison.

---

## `generateToken()`

Generates a JWT token for a user.

const token = auth.generateToken(user);

This is useful when you want custom authentication logic but still want to use this package for token generation.

The user object must have either:

id or _id or you must provide a custom `getUserId()` function.

---

## Full example of an ExpressJS server:

import express from "express";
import { createAuthKit } from "@atithnj/jwt-auth-kit";
import User from "./models/User";

const app = express();

app.use(express.json());

const auth = createAuthKit({
  jwtSecret: process.env.JWT_SECRET!,
  expiresIn: "1h",
  saltRounds: 12,
  algorithm: "HS256",

  findUserByEmail: async (email) => {
    return User.findOne({ email });
  },

  createUser: async (userData) => {
    return User.create(userData);
  },
});

app.post("/register", async (req, res) => {
  try {
    const result = await auth.register(req.body);

    res.status(201).json({
      message: "User registered successfully",
      user: result.user,
      token: result.token,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const result = await auth.login(req.body);

    res.status(200).json({
      message: "User logged in successfully",
      user: result.user,
      token: result.token,
    });
  } catch (error: any) {
    res.status(401).json({
      message: error.message,
    });
  }
});

app.get("/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization header missing",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const decoded = auth.verifyToken(token);

    res.status(200).json({
      message: "Token verified successfully",
      user: decoded,
    });
  } catch (error: any) {
    res.status(401).json({
      message: error.message,
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

---

## Authorization Header Format

For protected routes, send the token like this:

Authorization: Bearer your-jwt-token

Example using fetch:

fetch("/profile", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

---

## TypeScript Types

The package exports the following types:

AuthUser
AuthTokenPayload
CreateAuthKitOptions
RegisterUserCredentials
LoginUserCredentials
SupportedJwtAlgorithm

Example:

import {
  createAuthKit,
  AuthUser,
  SupportedJwtAlgorithm,
} from "@atithnj/jwt-auth-kit";


---

## User Object Shape

The package expects the user object to have at least:


{
  email: string;
}


And for token generation, it should have either:


id: string;

or:

_id: string;

Example with SQL-style user:

{
  id: "1",
  email: "test@gmail.com",
  passwordHash: "$2a$10$..."
}

Example with MongoDB-style user:

{
  _id: "65fabc123",
  email: "test@gmail.com",
  passwordHash: "$2a$10$..."
}

If your user has a custom ID field, use `getUserId`.

---

## Error Examples

### Missing JWT secret

createAuthKit({
  jwtSecret: "",
  findUserByEmail,
  createUser,
});

Throws: JWT secret key is required

---

### Weak salt rounds

createAuthKit({
  jwtSecret: "secret",
  saltRounds: 8,
  findUserByEmail,
  createUser,
});


Throws:

saltRounds is too weak. Minimum supported value is 10.

---

### Expensive salt rounds

createAuthKit({
  jwtSecret: "secret",
  saltRounds: 18,
  findUserByEmail,
  createUser,
});

Throws:

saltRounds cost factor is too expensive. Maximum supported value is 15.

---

### Unsupported algorithm

createAuthKit({
  jwtSecret: "secret",
  algorithm: "RS256" as any,
  findUserByEmail,
  createUser,
});

Throws:

Unsupported JWT algorithm "RS256". Supported algorithms are: HS256, HS384, HS512.

---

## Security Notes

This package follows basic authentication security practices:

* Passwords are hashed before storing
* Plain passwords are never returned
* `password` and `passwordHash` are removed from the returned user object
* JWT tokens are signed using supported HMAC algorithms
* JWT verification checks the expected algorithm
* Salt rounds are restricted to a safe practical range

For production usage:

* Use a strong JWT secret from environment variables
* Do not hardcode secrets
* Use HTTPS
* Use shorter access token expiry such as `"15m"` or `"1h"`
* Consider implementing refresh tokens separately
* Add rate limiting on login routes
* Add account lockout or suspicious login detection if required
* Validate email and password before passing data to this package

Example production config:

const auth = createAuthKit({
  jwtSecret: process.env.JWT_SECRET!,
  expiresIn: "1h",
  saltRounds: 12,
  algorithm: "HS256",
  findUserByEmail,
  createUser,
});

---

## Summary

`@atithnj/jwt-auth-kit` is a lightweight authentication helper package for Node.js applications.

It helps you avoid rewriting the same authentication logic in every project by providing reusable methods for:

* user registration
* user login
* password hashing
* password comparison
* JWT generation
* JWT verification

The package is flexible, TypeScript-friendly, and works with any database because the database logic is provided by the application using the package.