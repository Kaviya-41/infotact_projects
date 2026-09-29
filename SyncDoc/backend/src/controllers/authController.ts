import type { Request, Response, NextFunction } from "express";
import authService from "../services/authService.js";

/** Extract userId from simple base64 token in Authorization header */
function getUserIdFromToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  try {
    const payload = JSON.parse(atob(auth.slice(7)));
    return payload.userId || null;
  } catch {
    return null;
  }
}

const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, username, phone, password } = req.body;

      // Validation
      const errors: string[] = [];
      if (!name?.trim()) errors.push("Name is required.");
      if (!email?.trim()) errors.push("Email is required.");
      if (!username?.trim()) errors.push("Username is required.");
      if (!password) errors.push("Password is required.");
      if (password && password.length < 6) errors.push("Password must be at least 6 characters.");
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Please enter a valid email address.");

      if (errors.length > 0) {
        res.status(400).json({ success: false, message: errors[0], errors });
        return;
      }

      const result = await authService.register({
        name: name.trim(),
        email: email.trim(),
        username: username.trim(),
        phone: phone?.trim() || "",
        password,
      });

      res.status(201).json({
        success: true,
        message: "Account created successfully. Please log in.",
        data: result.user,
      });
    } catch (error: unknown) {
      const err = error as Error & { status?: number };
      if (err.status === 409) {
        res.status(409).json({ success: false, message: err.message });
        return;
      }
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, password } = req.body;

      if (!identifier?.trim()) {
        res.status(400).json({ success: false, message: "Email or username is required." });
        return;
      }
      if (!password) {
        res.status(400).json({ success: false, message: "Password is required." });
        return;
      }

      const result = await authService.login(identifier.trim(), password);

      res.status(200).json({
        success: true,
        message: "Welcome back!",
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error: unknown) {
      const err = error as Error & { status?: number };
      if (err.status === 404 || err.status === 401) {
        res.status(err.status).json({ success: false, message: err.message });
        return;
      }
      next(error);
    }
  },

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserIdFromToken(req);
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
      }

      const user = await authService.getUserById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: "User not found." });
        return;
      }

      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserIdFromToken(req);
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
      }

      const { name, phone, username } = req.body;
      const updates: { name?: string; phone?: string; username?: string } = {};
      if (name !== undefined) updates.name = name.trim();
      if (phone !== undefined) updates.phone = phone.trim();
      if (username !== undefined) {
        if (!username.trim()) {
          res.status(400).json({ success: false, message: "Username cannot be empty." });
          return;
        }
        updates.username = username.trim();
      }

      const user = await authService.updateProfile(userId, updates);
      if (!user) {
        res.status(404).json({ success: false, message: "User not found." });
        return;
      }

      res.status(200).json({ success: true, message: "Profile updated.", data: user });
    } catch (error: unknown) {
      const err = error as Error & { status?: number };
      if (err.status === 409) {
        res.status(409).json({ success: false, message: err.message });
        return;
      }
      next(error);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserIdFromToken(req);
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword) {
        res.status(400).json({ success: false, message: "Current password is required." });
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
        return;
      }

      await authService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({ success: true, message: "Password updated successfully." });
    } catch (error: unknown) {
      const err = error as Error & { status?: number };
      if (err.status === 401 || err.status === 404) {
        res.status(err.status).json({ success: false, message: err.message });
        return;
      }
      next(error);
    }
  },
};

export default authController;
