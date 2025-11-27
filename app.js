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

const app = express();
const PORT = process.env.PORT || 8000;

// MongoDB connection - remove deprecated options
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin@cluster0.0hmpatm.mongodb.net/ProjectDb';

mongoose.connect(MONGODB_URI)
.then(() => console.log(' Connected to MongoDB Atlas'))
.catch(err => console.error(' MongoDB connection error:', err));

// Set up Handlebars as view engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Register Handlebars partials directory
const partialsDir = path.join(__dirname, 'views', 'partials');
hbs.registerPartials(partialsDir);

// Check if partials directory exists, create it if it doesn't
if (!fs.existsSync(partialsDir)) {
    console.log(' Creating partials directory...');
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

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Single schema that matches your data structure
const stadiumSchema = new mongoose.Schema({
    league: String,
    team: String,
    stadium: String,
    "stadium latitude": Number,
    "stadium longitude": Number,
    radius: String,
    city: String,
    state: String,
    businesses: [{
        id: String,
        alias: String,
        name: String,
        image_url: String,
        is_closed: Boolean,
        url: String,
        review_count: Number,
        categories: [{
            alias: String,
            title: String
        }],
        rating: Number,
        coordinates: {
            latitude: Number,
            longitude: Number
        },
        transactions: [String],
        price: String,
        location: {
            address1: String,
            address2: String,
            address3: String,
            city: String,
            zip_code: String,
            country: String,
            state: String,
            display_address: [String]
        },
        phone: String,
        display_phone: String,
        distance: Number
    }]
});

// Single model for your collection
const Stadium = mongoose.model('resturants', stadiumSchema);

// Routes
app.get('/', async (req, res) => {
    try {
        console.log(' Fetching data from MongoDB...');
        
        // Get unique leagues and teams for dropdowns
        const leagues = await Stadium.distinct('league').maxTimeMS(30000);
        const teams = await Stadium.distinct('team').maxTimeMS(30000);
        
        console.log(' Leagues found:', leagues);
        console.log(' Teams found:', teams.length, 'teams');
        
        // Sort alphabetically for better UX
        leagues.sort();
        teams.sort();
        
        res.render('index', {
            title: 'GameDay Eats - Find Restaurants Near Your Stadium',
            leagues: leagues,
            teams: teams,
            stadiums: []
        });
    } catch (error) {
        console.error(' Error fetching data:', error);
        res.render('index', {
            title: 'GameDay Eats - Find Restaurants Near Your Stadium',
            leagues: [],
            teams: [],
            stadiums: []
        });
    }
});

app.get('/teams/:league', async (req, res) => {
    try {
        const league = req.params.league;
        const teams = await Stadium.distinct('team', { league: league });
        res.json({ teams });
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.json({ teams: [] });
    }
});

app.get('/stadium/:team', async (req, res) => {
    try {
        const team = req.params.team;
        const stadiumData = await Stadium.findOne({ team: team });
        const stadium = stadiumData ? stadiumData.stadium : 'Stadium information not available';
        res.json({ stadium });
    } catch (error) {
        console.error('Error fetching stadium:', error);
        res.json({ stadium: 'Stadium information not available' });
    }
});

app.post('/search', async (req, res) => {
    try {
        const { league, team, stadium } = req.body;
        
        // Validate input
        if (!league && !team && !stadium) {
            return res.render('results', {
                title: 'Search Results',
                error: 'Please provide at least one search criteria (league, team, or stadium)',
                restaurants: [],
                searchCount: 0
            });
        }

        console.log(' Search criteria:', { league, team, stadium });
        
        // Build query with validation
        const query = {};
        if (league && league !== '') query.league = league;
        if (team && team !== '') query.team = team;
        if (stadium && stadium !== '' && stadium !== 'Stadium information not available') {
            query.stadium = stadium;
        }

        console.log(' Database query:', query);
        
        // Find the stadium document with timeout protection
        const stadiumData = await Stadium.findOne(query).maxTimeMS(10000);
        
        if (!stadiumData) {
            console.log(' No stadium found matching criteria');
            return res.render('results', {
                title: 'Search Results - No Matches Found',
                league,
                team,
                stadium: stadium || 'Not specified',
                restaurants: [],
                searchCount: 0,
                message: 'No stadium found matching your search criteria. Please try different selections.'
            });
        }

        const restaurants = stadiumData.businesses || [];
        console.log(`  Found ${restaurants.length} restaurants for ${stadiumData.team}`);

        // Sort restaurants by rating (highest first) and then by review count
        const sortedRestaurants = restaurants.sort((a, b) => {
            if (b.rating !== a.rating) {
                return b.rating - a.rating;
            }
            return b.review_count - a.review_count;
        });

        res.render('results', {
            title: `Restaurants Near ${stadiumData.stadium}`,
            league: stadiumData.league,
            team: stadiumData.team,
            stadium: stadiumData.stadium,
            city: stadiumData.city,
            state: stadiumData.state,
            restaurants: sortedRestaurants,
            searchCount: sortedRestaurants.length,
            success: `Found ${sortedRestaurants.length} restaurants near ${stadiumData.stadium}`
        });

    } catch (error) {
        console.error(' Error searching restaurants:', error);
        res.render('results', {
            title: 'Search Error',
            league: req.body.league,
            team: req.body.team,
            stadium: req.body.stadium,
            restaurants: [],
            searchCount: 0,
            error: 'Sorry, there was an error processing your search. Please try again.'
        });
    }
});

// Search by stadium name directly
app.get('/search/stadium/:stadiumName', async (req, res) => {
    try {
        const stadiumName = req.params.stadiumName;
        const stadiumData = await Stadium.findOne({ 
            stadium: new RegExp(stadiumName, 'i') 
        });
        
        if (stadiumData) {
            res.redirect(`/search-results?team=${encodeURIComponent(stadiumData.team)}`);
        } else {
            res.render('results', {
                title: 'Stadium Not Found',
                error: `No stadium found with name: ${stadiumName}`,
                restaurants: [],
                searchCount: 0
            });
        }
    } catch (error) {
        console.error('Error searching by stadium:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoints
app.get('/api/restaurants', async (req, res) => {
    try {
        const { league, team, stadium } = req.query;
        
        const query = {};
        if (league) query.league = league;
        if (team) query.team = team;
        if (stadium) query.stadium = stadium;
        
        const stadiumData = await Stadium.findOne(query);
        const restaurants = stadiumData ? stadiumData.businesses : [];
        
        res.json(restaurants);
    } catch (error) {
        console.error('Error fetching restaurants API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all restaurants for a specific team (API endpoint)
app.get('/api/team/:team/restaurants', async (req, res) => {
    try {
        const team = req.params.team;
        const stadiumData = await Stadium.findOne({ team: team });
        
        if (!stadiumData) {
            return res.status(404).json({ error: 'Team not found' });
        }
        
        res.json({
            team: stadiumData.team,
            stadium: stadiumData.stadium,
            restaurants: stadiumData.businesses || []
        });
    } catch (error) {
        console.error('Error fetching team restaurants:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Test database connection
        await mongoose.connection.db.admin().ping();
        const count = await Stadium.countDocuments();
        
        res.json({ 
            status: 'OK', 
            database: 'Connected',
            documentCount: count,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'Error', 
            database: 'Disconnected',
            error: error.message 
        });
    }
});

// 404 handler - use results template instead of error
app.use((req, res) => {
    res.status(404).render('results', {
        title: 'Page Not Found',
        error: 'The page you are looking for does not exist.',
        restaurants: [],
        searchCount: 0
    });
});

// Error handling middleware - use results template instead of error
app.use((err, req, res, next) => {
    console.error(' Server Error:', err);
    res.status(500).render('results', {
        title: 'Server Error',
        error: 'Something went wrong on our end. Please try again later.',
        restaurants: [],
        searchCount: 0
    });
});

app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
    console.log(` MongoDB: ${MONGODB_URI}`);
    console.log(` Partials directory: ${partialsDir}`);
});

module.exports = app;