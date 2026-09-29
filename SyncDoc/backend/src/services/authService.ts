import mongoose from "mongoose";
import User, { type IUser, type UserDocument } from "../models/User.js";

// In-memory fallback store for users when MongoDB is unavailable
import bcrypt from "bcryptjs";

const inMemoryUsersMap = new Map<string, IUser & { _hashedPassword: string }>();

function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

function generateId(): string {
  return new mongoose.Types.ObjectId().toHexString();
}

/** Generate a simple base64 token (adequate for college demo) */
function generateToken(userId: string, email: string): string {
  const payload = { userId, email, iat: Date.now() };
  return btoa(JSON.stringify(payload));
}

/** Strip password from user object for API responses */
function sanitizeUser(user: Record<string, unknown>): Record<string, unknown> {
  const obj = { ...user };
  delete obj.password;
  delete obj._hashedPassword;
  delete obj.__v;
  return obj;
}

export interface RegisterInput {
  name: string;
  email: string;
  username: string;
  phone?: string;
  password: string;
}

const authService = {
  async register(input: RegisterInput): Promise<{ user: Record<string, unknown> }> {
    const { name, email, username, phone, password } = input;

    if (isDbConnected()) {
      // Check uniqueness
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        throw Object.assign(new Error("An account with this email already exists."), { status: 409 });
      }
      const existingUsername = await User.findOne({ username: username.toLowerCase() });
      if (existingUsername) {
        throw Object.assign(new Error("This username is already taken."), { status: 409 });
      }

      const user = new User({ name, email, username, phone: phone || "", password });
      const saved = await user.save();
      const userObj = saved.toObject();
      return { user: sanitizeUser(userObj as unknown as Record<string, unknown>) };
    }

    // In-memory fallback
    const emailLower = email.toLowerCase();
    const usernameLower = username.toLowerCase();

    for (const u of inMemoryUsersMap.values()) {
      if (u.email === emailLower) {
        throw Object.assign(new Error("An account with this email already exists."), { status: 409 });
      }
      if (u.username === usernameLower) {
        throw Object.assign(new Error("This username is already taken."), { status: 409 });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const now = new Date();
    const userId = generateId();

    const newUser: IUser & { _hashedPassword: string } = {
      _id: userId,
      name,
      email: emailLower,
      username: usernameLower,
      phone: phone || "",
      password: hashedPassword,
      _hashedPassword: hashedPassword,
      createdAt: now,
      updatedAt: now,
    };

    inMemoryUsersMap.set(userId, newUser);
    return { user: sanitizeUser(newUser as unknown as Record<string, unknown>) };
  },

  async login(identifier: string, password: string): Promise<{ user: Record<string, unknown>; token: string }> {
    const identifierLower = identifier.toLowerCase().trim();

    if (isDbConnected()) {
      const user = await User.findOne({
        $or: [{ email: identifierLower }, { username: identifierLower }],
      }) as UserDocument | null;

      if (!user) {
        throw Object.assign(new Error("Account not found."), { status: 404 });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw Object.assign(new Error("Incorrect password."), { status: 401 });
      }

      const userObj = user.toObject();
      const token = generateToken(String(userObj._id), userObj.email);
      return { user: sanitizeUser(userObj as unknown as Record<string, unknown>), token };
    }

    // In-memory fallback
    let foundUser: (IUser & { _hashedPassword: string }) | null = null;
    for (const u of inMemoryUsersMap.values()) {
      if (u.email === identifierLower || u.username === identifierLower) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      throw Object.assign(new Error("Account not found."), { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, foundUser._hashedPassword);
    if (!isMatch) {
      throw Object.assign(new Error("Incorrect password."), { status: 401 });
    }

    const token = generateToken(String(foundUser._id), foundUser.email);
    return { user: sanitizeUser(foundUser as unknown as Record<string, unknown>), token };
  },

  async getUserById(id: string): Promise<Record<string, unknown> | null> {
    if (isDbConnected()) {
      const user = await User.findById(id).select("-password").lean();
      return user as unknown as Record<string, unknown> | null;
    }
    const user = inMemoryUsersMap.get(id);
    if (!user) return null;
    return sanitizeUser(user as unknown as Record<string, unknown>);
  },

  async updateProfile(id: string, updates: { name?: string; phone?: string; username?: string }): Promise<Record<string, unknown> | null> {
    if (isDbConnected()) {
      if (updates.username) {
        const existing = await User.findOne({ username: updates.username.toLowerCase(), _id: { $ne: id } });
        if (existing) {
          throw Object.assign(new Error("This username is already taken."), { status: 409 });
        }
      }
      const user = await User.findById(id);
      if (!user) return null;
      if (updates.name !== undefined) user.name = updates.name;
      if (updates.phone !== undefined) user.phone = updates.phone;
      if (updates.username !== undefined) user.username = updates.username.toLowerCase();
      const saved = await user.save();
      const obj = saved.toObject();
      return sanitizeUser(obj as unknown as Record<string, unknown>);
    }

    // In-memory fallback
    const user = inMemoryUsersMap.get(id);
    if (!user) return null;
    if (updates.username) {
      const usernameLower = updates.username.toLowerCase();
      for (const [uid, u] of inMemoryUsersMap.entries()) {
        if (uid !== id && u.username === usernameLower) {
          throw Object.assign(new Error("This username is already taken."), { status: 409 });
        }
      }
      user.username = usernameLower;
    }
    if (updates.name !== undefined) user.name = updates.name;
    if (updates.phone !== undefined) user.phone = updates.phone;
    user.updatedAt = new Date();
    inMemoryUsersMap.set(id, user);
    return sanitizeUser(user as unknown as Record<string, unknown>);
  },

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    if (isDbConnected()) {
      const user = await User.findById(id) as UserDocument | null;
      if (!user) throw Object.assign(new Error("User not found."), { status: 404 });
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) throw Object.assign(new Error("Current password is incorrect."), { status: 401 });
      user.password = newPassword; // pre-save hook will hash
      await user.save();
      return true;
    }

    // In-memory fallback
    const user = inMemoryUsersMap.get(id);
    if (!user) throw Object.assign(new Error("User not found."), { status: 404 });
    const isMatch = await bcrypt.compare(currentPassword, user._hashedPassword);
    if (!isMatch) throw Object.assign(new Error("Current password is incorrect."), { status: 401 });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user._hashedPassword = user.password;
    user.updatedAt = new Date();
    inMemoryUsersMap.set(id, user);
    return true;
  },
};

export default authService;
