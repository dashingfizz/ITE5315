const express = require('express');
const router = express.Router();
const stadiumController = require('../controllers/stadiumController');

// Home page
router.get('/', stadiumController.getHome);

// Get teams by league
router.get('/teams/:league', stadiumController.getTeamsByLeague);

// Get stadium by team
router.get('/stadium/:team', stadiumController.getStadiumByTeam);

// Search restaurants
router.post('/search', stadiumController.searchRestaurants);

// Search by stadium name
router.get('/search/stadium/:stadiumName', stadiumController.searchByStadiumName);

// Health check
router.get('/health', stadiumController.healthCheck);

module.exports = router;