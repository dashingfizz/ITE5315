const express = require('express');
const path = require('path');
const hbs = require('hbs');
const mongoose = require('mongoose');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8000;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin@cluster0.0hmpatm.mongodb.net/ProjectDb';

mongoose.connect(MONGODB_URI)
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

// Routes
app.use('/', require('./routes/index'));
app.use('/api', require('./routes/api'));

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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`MongoDB: ${MONGODB_URI}`);
    console.log(`Partials directory: ${partialsDir}`);
});

module.exports = app;