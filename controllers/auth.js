// backend/controllers/auth.js

const User = require("../model/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const transporter = require("../config/nodemailerConfig");

const JWT_SECRET = process.env.JWT_SECRET || "your-strong-secret-key-that-is-at-least-32-chars-long";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const generateToken = (user) => {
  if (!user || !user._id || !user.email || !user.role) {
    console.error("Invalid user object passed to generateToken:", user);
    throw new Error("Cannot generate token for invalid user data.");
  }
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email." });
    }

    const user = await User.create({ name, email, password, role: "user" });
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "User created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error("Signup Error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: "Validation Error", errors: errors.join(", ") });
    }
    res.status(500).json({ message: err.message || "Server error during signup." });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: "Login successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: err.message || "Server error during login." });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: '/',
  });
  res.status(200).json({ success: true, message: "Logged out successfully." });
};

exports.updatePassword = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Not authorized, user ID missing from request." });
    }
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: "All password fields are required." });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "New passwords do not match." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long." });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "New password cannot be the same as the current password." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password." });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Update Password Error:", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: "Validation Error", errors: errors.join(", ") });
    }
    res.status(500).json({ message: "Server error while updating password." });
  }
};

exports.requestPasswordReset = async (req, res) => {
  let userToClearToken = null;
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Please provide an email address." });
    }

    const user = await User.findOne({ email });
    userToClearToken = user;

    if (!user) {
      return res.status(200).json({ message: "If your email is registered, you will receive a password reset link." });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${FRONTEND_URL}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"Jharkhand IT Solutions" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request - Jharkhand IT Solutions",
      html: `<p>Hello ${user.name || "User"},</p>
             <p>You recently requested to reset your password for your Jharkhand IT Solutions account.</p>
             <p>Please click on the following link to complete the process:</p>
             <p><a href="${resetURL}" style="color: #007bff; text-decoration: none;">Reset Your Password</a></p>
             <p>This link will expire in 10 minutes.</p>
             <p>If you did not request this password reset, please ignore this email. Your password will remain unchanged.</p>
             <p>Thank you,<br/>The Jharkhand IT Solutions Team</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset link has been sent to your email." });
  } catch (error) {
    console.error("Request Password Reset Error:", error);
    if (userToClearToken && userToClearToken.passwordResetToken) {
      userToClearToken.passwordResetToken = undefined;
      userToClearToken.passwordResetExpires = undefined;
      try {
        await userToClearToken.save({ validateBeforeSave: false });
      } catch (saveError) {
        console.error("Error clearing reset token fields after initial error:", saveError);
      }
    }
    res.status(500).json({ message: "Error sending password reset email. Please try again later." });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({ message: "New password and confirm password are required." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired." });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: "Validation Error", errors: errors.join(", ") });
    }
    res.status(500).json({ message: "Error resetting password. Please try again later." });
  }
};
