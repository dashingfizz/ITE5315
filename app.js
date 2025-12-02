/******************************************************************************
* ITE5315 – Project
* I declare that this project is my own work in accordance with Humber Academic Policy.
* No part of this project has been copied manually or electronically from any other source
* (including web sites) or distributed to other students.
* Group Member Names: Daniel Tarhembe, Jeffrey Lamptey, Nana Sackey
* Student IDs: n01719446, n01675664, n01700360
* Date: 2025-11-26
******************************************************************************/

const express = require('express');
const path = require('path');
const hbs = require('hbs');
const mongoose = require('mongoose');
const fs = require('fs');
const config = require("./config/database");
const app = express();

const session = require("express-session");
// const MongoStore = require("connect-mongo");

require("dotenv").config();


mongoose.connect(config.url)
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

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

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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


// Protected dashboard route
app.get("/dashboard", ensureAuth, (req, res) => {
  res.render("dashboard", {
    title: "Dashboard",
    user: req.session.user,
  });
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).render('results', {
        title: 'Server Error',
        error: 'Something went wrong on our end. Please try again later.',
        restaurants: [],
        searchCount: 0
    });
});




app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`MongoDB: ${config.url}`);
    console.log(`Partials directory: ${partialsDir}`);
});

module.exports = app;