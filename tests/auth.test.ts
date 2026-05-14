import { describe, it, expect } from "vitest";
import { createAuthKit } from "../src";

type TestUser = {
  id: string;
  name?: string;
  email: string;
  passwordHash?: string;
};

function createTestAuth() {
  const users: TestUser[] = [];

  const auth = createAuthKit<TestUser>({
    jwtSecret: "test-secret-key",
    expiresIn: "1h",
    saltRounds: 10,
    algorithm: "HS256",

    findUserByEmail: async (email: string) => {
      return users.find((user) => user.email === email) || null;
    },

    createUser: async (userData) => {
      const user: TestUser = {
        id: String(users.length + 1),
        ...userData,
      };

      users.push(user);

      return user;
    },
  });

  return {
    auth,
    users,
  };
}

describe("createAuthKit", () => {
  it("should register a new user and return token", async () => {
    const { auth } = createTestAuth();

    const result = await auth.register({
      name: "Atith",
      email: "atith@gmail.com",
      password: "12345678",
    });

    expect(result.user.email).toBe("atith@gmail.com");
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe("string");
  });

  it("should not return passwordHash in registered user response", async () => {
    const { auth } = createTestAuth();

    const result = await auth.register({
      name: "Atith",
      email: "atith@gmail.com",
      password: "12345678",
    });

    expect(result.user).not.toHaveProperty("password");
    expect(result.user).not.toHaveProperty("passwordHash");
  });

  it("should store hashed password internally", async () => {
    const { auth, users } = createTestAuth();

    await auth.register({
      name: "Atith",
      email: "atith@gmail.com",
      password: "12345678",
    });

    expect(users[0].passwordHash).toBeDefined();
    expect(users[0].passwordHash).not.toBe("12345678");
  });

  it("should not register duplicate user", async () => {
    const { auth } = createTestAuth();

    await auth.register({
      name: "Atith",
      email: "atith@gmail.com",
      password: "12345678",
    });

    await expect(
      auth.register({
        name: "Atith",
        email: "atith@gmail.com",
        password: "12345678",
      })
    ).rejects.toThrow("User already exists");
  });

  it("should login user with valid credentials", async () => {
    const { auth } = createTestAuth();

    await auth.register({
      name: "Atith",
      email: "atith@gmail.com",
      password: "12345678",
    });

    const result = await auth.login({
      email: "atith@gmail.com",
      password: "12345678",
    });

    expect(result.user.email).toBe("atith@gmail.com");
    expect(result.token).toBeDefined();
  });

  it("should not return passwordHash in login response", async () => {
    const { auth } = createTestAuth();

    await auth.register({
      name: "Atith",
      email: "atith@gmail.com",
      password: "12345678",
    });

    const result = await auth.login({
      email: "atith@gmail.com",
      password: "12345678",
    });

    expect(result.user).not.toHaveProperty("password");
    expect(result.user).not.toHaveProperty("passwordHash");
  });

  it("should reject login with wrong password", async () => {
    const { auth } = createTestAuth();

    await auth.register({
      name: "Atith",
      email: "atith@gmail.com",
      password: "12345678",
    });

    await expect(
      auth.login({
        email: "atith@gmail.com",
        password: "wrong-password",
      })
    ).rejects.toThrow("Invalid credentials passed");
  });

  it("should reject login for non-existing user", async () => {
    const { auth } = createTestAuth();

    await expect(
      auth.login({
        email: "unknown@gmail.com",
        password: "12345678",
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("should verify valid token", async () => {
    const { auth } = createTestAuth();

    const registerResult = await auth.register({
      name: "Atith",
      email: "atith@gmail.com",
      password: "12345678",
    });

    const decoded = auth.verifyToken(registerResult.token);

    expect(decoded.userId).toBe("1");
    expect(decoded.email).toBe("atith@gmail.com");
  });

  it("should reject invalid token", () => {
    const { auth } = createTestAuth();

    expect(() => auth.verifyToken("invalid-token")).toThrow();
  });

  it("should hash password manually", async () => {
    const { auth } = createTestAuth();

    const hash = await auth.hashPassword("12345678");

    expect(hash).toBeDefined();
    expect(hash).not.toBe("12345678");
  });

  it("should compare password manually", async () => {
    const { auth } = createTestAuth();

    const hash = await auth.hashPassword("12345678");

    const isValid = await auth.comparePassword("12345678", hash);

    expect(isValid).toBe(true);
  });

  it("should reject wrong password during manual comparison", async () => {
    const { auth } = createTestAuth();

    const hash = await auth.hashPassword("12345678");

    const isValid = await auth.comparePassword("wrong-password", hash);

    expect(isValid).toBe(false);
  });
});

describe("createAuthKit validations", () => {
  const baseOptions = {
    jwtSecret: "test-secret-key",

    findUserByEmail: async () => null,

    createUser: async (userData: any) => ({
      id: "1",
      email: userData.email,
      passwordHash: userData.passwordHash,
    }),
  };

  it("should throw error if jwtSecret is missing", () => {
    expect(() =>
      createAuthKit({
        ...baseOptions,
        jwtSecret: "",
      })
    ).toThrow("JWT secret key is required");
  });

  it("should throw error if saltRounds is less than 10", () => {
    expect(() =>
      createAuthKit({
        ...baseOptions,
        saltRounds: 8,
      })
    ).toThrow("Salt rounds cost factor is too weak");
  });

  it("should throw error if saltRounds is greater than 15", () => {
    expect(() =>
      createAuthKit({
        ...baseOptions,
        saltRounds: 18,
      })
    ).toThrow("Salt rounds cost factor is too expensive");
  });

  it("should throw error if saltRounds is not integer", () => {
    expect(() =>
      createAuthKit({
        ...baseOptions,
        saltRounds: 10.5,
      })
    ).toThrow("Salt rounds should be a number");
  });

  it("should throw error for unsupported JWT algorithm", () => {
    expect(() =>
      createAuthKit({
        ...baseOptions,
        algorithm: "RS256" as any,
      })
    ).toThrow("Unsupported JWT algorithm");
  });

  it("should allow HS256 algorithm", () => {
    expect(() =>
      createAuthKit({
        ...baseOptions,
        algorithm: "HS256",
      })
    ).not.toThrow();
  });

  it("should allow HS384 algorithm", () => {
    expect(() =>
      createAuthKit({
        ...baseOptions,
        algorithm: "HS384",
      })
    ).not.toThrow();
  });

  it("should allow HS512 algorithm", () => {
    expect(() =>
      createAuthKit({
        ...baseOptions,
        algorithm: "HS512",
      })
    ).not.toThrow();
  });
});