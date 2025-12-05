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

// Load authentication routes
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

// Load main route (index)
app.use('/', require('./routes/index'));

// Load dashboard route
const dashboardRoutes = require("./routes/dashboard");
app.use("/dashboard", dashboardRoutes);

// Load user routes
const userRoutes = require("./routes/user");
app.use("/user", userRoutes);

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