/******************************************************************************
* ITE5315 – Project
* I declare that this project is my own work in accordance with Humber Academic Policy.
* No part of this project has been copied manually or electronically from any other source
* (including web sites) or distributed to other students.
* Group Member Names: Daniel Tarhembe, Jeffrey Lamptey, Nana Sackey
* Student IDs: n01719446, n01675664, n01700360
* Date: 2025-11-26
******************************************************************************/

const express = require("express");
const router = express.Router();
const { ensureAuth } = require("../middleware/auth");
const controller = require("../controllers/userController");
const Stadium = require("../models/Stadium");

// GET /user (user account page)
router.get("/", ensureAuth, controller.getUserAccount);

// GET /user/profile (edit profile page)
router.get("/profile", ensureAuth, controller.getProfile);

// POST /user/profile/update
router.post("/profile/update", ensureAuth, controller.updateProfile);

//GET route for change-password
router.get("/change-password", ensureAuth, controller.showPasswordPage);

// POST route for change-password (Update password)
router.post("/change-password", ensureAuth, controller.changePassword);

// Delete password route
router.delete("/delete-account", ensureAuth, controller.deleteAccount);

// GET /user/business/create  → show Add Business form
router.get("/business/create", ensureAuth, async (req, res) => {
  console.log("GET /user/business/create route hit");
  try {
    const leagues = await Stadium.distinct("league").maxTimeMS(30000);

    res.render("user/create", {             
      title: "Add Restaurant Near Stadium",
      leagues,
    });
  } catch (err) {
    console.error("Error loading create business page:", err);
    res.render("user/create", {             
      title: "Add Restaurant Near Stadium",
      error: "Unable to load leagues. Please try again later.",
      leagues: [],
    });
  }
});

// My Businesses page (logged-in owner)
router.get('/business/my-businesses', ensureAuth, (req, res) => {
  res.render('user/my-businesses', {
    title: 'My Businesses'
  });
});

// Business Statistics Dashboard Page
router.get("/business/statistics", ensureAuth, (req, res) => {
  res.render("statistics", {
    title: "Business Statistics"
  });
});




module.exports = router;