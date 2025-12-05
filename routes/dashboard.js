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
const dashboardController = require("../controllers/dashboardController");

// Protected route for dashboard
router.get("/", ensureAuth, dashboardController.getDashboard);

module.exports = router;