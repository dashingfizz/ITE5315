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
const restaurantController = require("../controllers/restaurantController");

// Get all stadiums
router.get("/stadiums", restaurantController.getStadiums);

// Get all businesses for a specific stadium
router.get("/stadiums/:id/restaurants", restaurantController.getRestaurantsbyStadium);

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

module.exports = router;