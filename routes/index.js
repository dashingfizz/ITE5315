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
const stadiumController = require('../controllers/stadiumController');

// Home page
router.get('/', stadiumController.getHome);

// Get teams by league
router.get('/teams/:league', stadiumController.getTeamsByLeague);

// Get stadium by team
router.get('/stadium/:team', stadiumController.getStadiumByTeam);

// Get stadium details by team 
router.get('/stadium-details/:team', stadiumController.getStadiumDetailsByTeam);

// Search restaurants
router.post('/search', stadiumController.searchRestaurants);

// Search by stadium name
router.get('/search/stadium/:stadiumName', stadiumController.searchByStadiumName);

// Health check
router.get('/health', stadiumController.healthCheck);

module.exports = router;