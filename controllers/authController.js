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
const { validationResult } = require("express-validator");

// Show register form
exports.getRegister = (req, res) => {
    res.render("auth/register", { title: "Register" });
};

// Handle register form
exports.postRegister = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render("auth/register", {
            title: "Register",
            errors: errors.array(),
            oldInput: req.body
        });
    }

    try {
        const { email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render("auth/register", {
                title: "Register",
                errors: [{ msg: "Email already registered" }],
                oldInput: req.body
            });
        }

        // Create new user
        const user = new User({ email });
        await user.setPassword(password);
        await user.save();

        // Auto-login
        req.session.user = {
            _id: user._id,
            email: user.email,
            role: user.role
        };

        res.redirect("/dashboard");
    } catch (error) {
        console.error("Registration error:", error);
        res.render("auth/register", {
            title: "Register",
            errors: [{ msg: "Internal server error" }],
            oldInput: req.body
        });
    }
};

// Show login form
exports.getLogin = (req, res) => {
    res.render("auth/login", { title: "Login" });
};

// Handle login
exports.postLogin = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.render("auth/login", {
            title: "Login",
            errors: [{ msg: "Invalid email or password" }]
        });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
        return res.render("auth/login", {
            title: "Login",
            errors: [{ msg: "Invalid email or password" }]
        });
    }

    // Create session
    req.session.user = {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
    };

    res.redirect("/dashboard");
};

// Logout
exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
};
