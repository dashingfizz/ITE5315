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
const authController = require("../controllers/authController");
const { ensureAuth, ensureGuest } = require("../middleware/auth");

// REGISTER
router.get("/register", ensureGuest, authController.getRegister);
router.post("/register", ensureGuest, authController.postRegister);

// LOGIN
router.get("/login", ensureGuest, authController.getLogin);
router.post("/login", ensureGuest, authController.postLogin);   

// LOGOUT
router.get("/logout", ensureAuth, authController.logout);

module.exports = router;

