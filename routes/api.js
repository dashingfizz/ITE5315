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
const router = express.Router();
const Stadium = require('../models/Stadium');
const stadiumController = require('../controllers/stadiumController');
const restaurantController = require("../controllers/restaurantController");
const { ensureAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');


// IMPORTANT: Since this is mounted as "/api" in app.js,
// all routes here are automatically prefixed with "/api"

// Stadium management API
router.post('/stadium/create', ensureAuth, stadiumController.createStadium);
// This becomes: POST /api/stadium/create

// Business management API
router.post('/business/create', ensureAuth,upload.single('image'), stadiumController.createBusiness);
// This becomes: POST /api/business/create

// Update business with image upload
router.put('/business/update/:businessId',ensureAuth, upload.single('image'), stadiumController.updateBusiness);
// This becomes: PUT /api/business/update/:businessId

// Alias: GET /api/business -> getUserBusinesses for logged-in user
router.get('/business', ensureAuth, stadiumController.getUserBusinesses);
// This becomes: GET /api/business 

// FIXED: Split into two routes - one with userId, one without
router.get('/business/user/:userId', ensureAuth, stadiumController.getUserBusinesses);
// This becomes: GET /api/business/user/:userId
router.get('/business/user', ensureAuth, stadiumController.getUserBusinesses);
// This becomes: GET /api/business/user (uses session userId)

// Get analytics for the logged-in user's businesses
router.get('/business/stats', ensureAuth, stadiumController.getUserBusinessStats);
// This becomes: GET /api/business/stats

router.put('/business/update/:businessId', ensureAuth, stadiumController.updateBusiness);
// This becomes: PUT /api/business/update/:businessId


router.delete('/business/delete/:businessId', ensureAuth, stadiumController.deleteBusiness);
// This becomes: DELETE /api/business/delete/:businessId

// Get all stadiums
router.get("/stadiums", restaurantController.getStadiums);
// This becomes: GET /api/stadiums

// Get all businesses for a specific stadium
router.get("/stadiums/:id/restaurants", restaurantController.getRestaurantsbyStadium);
// This becomes: GET /api/stadiums/:id/restaurants

// Get restaurants API
router.get('/restaurants', async (req, res) => {
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
// This becomes: GET /api/restaurants

// Get all restaurants for a specific team
router.get('/team/:team/restaurants', async (req, res) => {
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
// This becomes: GET /api/team/:team/restaurants

// Health check
router.get('/health', stadiumController.healthCheck);
// This becomes: GET /api/health

module.exports = router;