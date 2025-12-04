/******************************************************************************
* ITE5315 – Project
* I declare that this project is my own work in accordance with Humber Academic Policy.
* No part of this project has been copied manually or electronically from any other source
* (including web sites) or distributed to other students.
* Group Member Names: Daniel Tarhembe, Jeffrey Lamptey, Nana Sackey
* Student IDs: n01719446, n01675664, n01700360
* Date: 2025-11-26
******************************************************************************/

require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const config = require("./config/database");
const fs = require('fs');
const path = require('path');
const hbs = require('hbs');
const session = require("express-session");

const app = express();

// Middleware for body parsing and fetching static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MongoDB connection
mongoose.connect(config.url)
.then(() => console.log("Connected to MongoDB Atlas"))
.catch((err) => console.error("Connection error:", err));

const db = mongoose.connection;

// Event Logs
db.on("connected", () => console.log("Mongoose connected"));
db.on("error", (err) => console.error("Mongoose error:", err));
db.on("disconnected", () => console.log("Mongoose disconnected"));

// Graceful shutdown
process.on("SIGINT", async () => {
  await db.close();
  console.log("Mongoose disconnected on app termination");
  process.exit(0);
});

// Set up Handlebars as view engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Register Handlebars partials directory
const partialsDir = path.join(__dirname, 'views', 'partials');
hbs.registerPartials(partialsDir);

//Partials
if (!fs.existsSync(partialsDir)) {
    console.log('Creating partials directory...');
    fs.mkdirSync(partialsDir, { recursive: true });
}

// Handlebars Helpers
hbs.registerHelper('convertDistance', function(meters) {
    const miles = (meters * 0.000621371).toFixed(1);
    return `${miles} miles`;
});

hbs.registerHelper('gt', function(a, b) {
    return a > b;
});

hbs.registerHelper('exists', function(value) {
    return value !== null && value !== undefined && value !== '';
});

// Session middleware
app.use(
  session({
    secret: process.env.SESSIONSECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    // Removed the 'store' property - will use default MemoryStore
    cookie: { maxAge: 1000 * 60 * 60 }, 
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// app.use((req, res, next) => {
//   console.log("REQ:", req.method, req.url);
//   next();
// });

// Authentication middleware
const { ensureAuth } = require("./middleware/auth");

const authRoutes = require("./routes/auth"); 

// Routes
app.use("/auth", authRoutes);


// Main routes
app.use('/', require('./routes/index'));


// Protected user route
app.get("/dashboard", ensureAuth, (req, res) => {
      const leagues = ["NBA", "NFL", "NHL", "MLB", "MLS"];

  res.render("dashboard", {
    title: "GameDay Eats - Dashboard",
    user: req.session.user,leagues, teams: []
  });
});

// user profile and account management routes
app.get("/user", ensureAuth, async (req, res) => {
  try {
    const User = require("./models/User");
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
});

// Profile edit page
app.get("/user/profile", ensureAuth, async (req, res) => {
  try {
    // Get fresh user data from database
    const User = require("./models/User");
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
});

// Update profile
app.post("/user/profile/update", ensureAuth, async (req, res) => {
  try {
    const User = require("./models/User");
    const { email, firstName, lastName } = req.body;
    
    // Validate email
    if (!email || !email.includes('@')) {
      return res.redirect("/user/profile?error=Valid email is required");
    }
    
    // Check if email is already taken by another user
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
    
    // Update session
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
});

// Change password page
app.get("/user/change-password", ensureAuth, (req, res) => {
  res.render("user/change-password", {
    title: "Change Password",
    user: req.session.user,
    success: req.query.success,
    error: req.query.error
  });
});

// Update password
app.post("/user/change-password", ensureAuth, async (req, res) => {
  try {
    const User = require("./models/User");
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
});
// Add this route in app.js after your other user routes

// Delete account
app.delete("/user/delete-account", ensureAuth, async (req, res) => {
  try {
    const User = require("./models/User");
    
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
});


// 404 handler
app.use((req, res) => {
    res.status(404).render('results', {
        title: 'Page Not Found',
        error: 'The page you are looking for does not exist.',
        restaurants: [],
        searchCount: 0
    });
});


// Error-handler middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).render('results', {
        title: 'Server Error',
        error: 'Something went wrong on our end. Please try again later.',
        restaurants: [],
        searchCount: 0
    });
});

// Start server
app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`MongoDB: ${config.url}`);
    console.log(`Partials directory: ${partialsDir}`);
});

module.exports = app;