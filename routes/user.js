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

module.exports = router;