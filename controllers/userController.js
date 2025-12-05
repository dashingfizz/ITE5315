/******************************************************************************
* ITE5315 – Project
* I declare that this project is my own work in accordance with Humber Academic Policy.
* No part of this project has been copied manually or electronically from any other source
* (including web sites) or distributed to other students.
* Group Member Names: Daniel Tarhembe, Jeffrey Lamptey, Nana Sackey
* Student IDs: n01719446, n01675664, n01700360
* Date: 2025-11-26
******************************************************************************/

const User = require("../models/User");

// User profile
exports.getUserAccount = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);

    res.render("user/index", {
      title: "My Account",
      user: user,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error("User load error:", error);
    res.redirect("/login");
  }
};

// Profile edit page
exports.getProfile = async (req, res) => {
  try {
    // Get fresh user data from database
    const user = await User.findById(req.session.user._id);
    
    res.render("user/profile", {
      title: "Edit Profile",
      user: user,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error("Profile load error:", error);
    res.redirect("/user?error=Error loading profile");
  }
};

// Profile update
exports.updateProfile = async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    // Validate email
    if (!email || !email.includes('@')) {
      return res.redirect("/user/profile?error=Valid email is required");
    }

    // Check if email is taken by someone else
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: req.session.user._id }
    });

    if (existingUser) {
      return res.redirect("/user/profile?error=Email already in use");
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.session.user._id,
      {
        email: email.toLowerCase(),
        firstName: firstName || "",
        lastName: lastName || ""
      },
      { new: true }
    );

    // Update session data
    req.session.user = {
      ...req.session.user,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName
    };

    res.redirect("/user/profile?success=Profile updated successfully");
  } catch (error) {
    console.error("Profile update error:", error);
    res.redirect("/user/profile?error=Error updating profile");
  }
};

// Show Change password page
exports.showPasswordPage = (req, res) => {
  res.render("user/change-password", {
    title: "Change Password",
    user: req.session.user,
    success: req.query.success,
    error: req.query.error
  });
};

// Change password for given user
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate
    if (newPassword !== confirmPassword) {
      return res.redirect("/user/change-password?error=New passwords do not match");
    }

    if (newPassword.length < 6) {
      return res.redirect("/user/change-password?error=Password must be at least 6 characters");
    }

    // Get user
    const user = await User.findById(req.session.user._id);

    // Verify current password
    const isMatch = await user.validatePassword(currentPassword);
    if (!isMatch) {
      return res.redirect("/user/change-password?error=Current password is incorrect");
    }

    // Update password
    await user.setPassword(newPassword);
    await user.save();

    res.redirect("/user/change-password?success=Password updated successfully");
  } catch (error) {
    console.error("Password change error:", error);
    res.redirect("/user/change-password?error=Error changing password");
  }
};


// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    // Delete the user
    await User.findByIdAndDelete(req.session.user._id);

    // Destroy the session
    req.session.destroy(err => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ error: "Error deleting account" });
      }

      // Clear session cookie
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });

  } catch (error) {
    console.error("Account deletion error:", error);
    res.status(500).json({ error: "Error deleting account" });
  }
};
