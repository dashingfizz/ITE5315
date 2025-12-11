/******************************************************************************
* ITE5315 – Project
* I declare that this project is my own work in accordance with Humber Academic Policy.
* No part of this project has been copied manually or electronically from any other source
* (including web sites) or distributed to other students.
* Group Member Names: Daniel Tarhembe, Jeffrey Lamptey, Nana Sackey
* Student IDs: n01719446, n01675664, n01700360
* Date: 2025-11-26
******************************************************************************/

const Stadium = require('../models/Stadium');
const mongoose = require('mongoose');

const stadiumController = {
    // Get home page data
    getHome: async (req, res) => {
        try {
            if (req.session && req.session.user) {
                return res.redirect("/user/business/statistics");
            }
            console.log('Fetching data from MongoDB...');
            
            const leagues = await Stadium.distinct('league').maxTimeMS(30000);
            const teams = await Stadium.distinct('team').maxTimeMS(30000);
            
            console.log('Leagues found:', leagues);
            console.log('Teams found:', teams.length, 'teams');
            
            leagues.sort();
            teams.sort();
            
            res.render('index', {
                title: 'GameDay Eats - Find Restaurants Near Your Stadium',
                leagues: leagues,
                teams: teams,
                stadiums: []
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            res.render('index', {
                title: 'GameDay Eats - Find Restaurants Near Your Stadium',
                leagues: [],
                teams: [],
                stadiums: []
            });
        }
    },

    // Get teams by league
    getTeamsByLeague: async (req, res) => {
        try {
            const league = req.params.league;
            const teams = await Stadium.distinct('team', { league: league });
            res.json({ teams });
        } catch (error) {
            console.error('Error fetching teams:', error);
            res.json({ teams: [] });
        }
    },

    // Get stadium by team
    getStadiumByTeam: async (req, res) => {
        try {
            const team = req.params.team;
            const stadiumData = await Stadium.findOne({ team: team });
            const stadium = stadiumData ? stadiumData.stadium : 'Stadium information not available';
            res.json({ stadium });
        } catch (error) {
            console.error('Error fetching stadium:', error);
            res.json({ stadium: 'Stadium information not available' });
        }
    },

    // Get stadium details by team
    getStadiumDetailsByTeam: async (req, res) => {
        try {
            const team = req.params.team;
            const stadiumData = await Stadium.findOne({ team: team });
            
            if (!stadiumData) {
                return res.json(null);
            }
            
            res.json({
                stadium: stadiumData.stadium,
                city: stadiumData.city,
                state: stadiumData.state,
                latitude: stadiumData['stadium latitude'],
                longitude: stadiumData['stadium longitude']
            });
        } catch (error) {
            console.error('Error fetching stadium details:', error);
            res.json(null);
        }
    },


// Search restaurants
searchRestaurants: async (req, res) => {
    try {
        // Helper to safely get parameters from POST or GET
        const getParam = (name) => ((req.body?.[name]) || req.query[name] || "").trim();

        // Query Parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const category = getParam('category') || "";
        const sort = getParam('sort') || "rating_desc";
        const league = getParam('league');
        const team = getParam('team');
        const stadium = getParam('stadium');

        // Require at least one search criteria
        if (!league && !team && !stadium) {
            return res.render('results', {
                title: 'Search Results',
                error: 'Please provide at least one search criteria (league, team, or stadium)',
                restaurants: [],
                searchCount: 0
            });
        }

        console.log('Search criteria:', { league, team, stadium });

        // Build database query
        const query = {};
        if (league) query.league = league;
        if (team) query.team = team;
        if (stadium && stadium !== 'Stadium information not available') query.stadium = stadium;

        console.log('Database query:', query);

        // Fetch stadium data
        const stadiumData = await Stadium.findOne(query).maxTimeMS(10000);

        if (!stadiumData) {
            console.log('No stadium found matching criteria');
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

        let restaurants = stadiumData.businesses || [];
        console.log(`Found ${restaurants.length} restaurants for ${stadiumData.team}`);

        // Populate category dropdown
        const allCategories = new Set();
        restaurants.forEach(r => {
            r.categories?.forEach(c => allCategories.add(c.title));
        });

        // Filter by category
        if (category) {
            const catLower = category.toLowerCase();
            restaurants = restaurants.filter(b =>
                b.categories?.some(c =>
                    c.title.toLowerCase().includes(catLower) ||
                    c.alias.toLowerCase().includes(catLower)
                )
            );
        }

        // Sort restaurants
        restaurants.sort((a, b) => {
            switch (sort) {
                case "rating_asc": return a.rating - b.rating;
                case "rating_desc": return b.rating - a.rating;
                case "reviews_asc": return a.review_count - b.review_count;
                case "reviews_desc": return b.review_count - a.review_count;
                case "distance_asc": return a.distance - b.distance;
                default: return b.rating - a.rating;
            }
        });

        // Pagination
        const totalRestaurants = restaurants.length;
        const totalPages = Math.ceil(totalRestaurants / limit);
        const startIndex = (page - 1) * limit;
        const paginatedRestaurants = restaurants.slice(startIndex, startIndex + limit);

        // Render results
        res.render('results', {
            title: `Restaurants Near ${stadiumData.stadium}`,
            league: stadiumData.league,
            team: stadiumData.team,
            stadium: stadiumData.stadium,
            city: stadiumData.city,
            state: stadiumData.state,
            restaurants: paginatedRestaurants,
            searchCount: totalRestaurants,
            currentPage: page,
            totalPages,
            limit,
            categories: Array.from(allCategories).sort(),
            selectedCategory: category,
            selectedSort: sort,
            success: `Found ${totalRestaurants} restaurants near ${stadiumData.stadium}`
        });

    } catch (error) {
        console.error('Error searching restaurants:', error);

        const leagueSafe = (req.body?.league) || req.query.league || "";
        const teamSafe = (req.body?.team) || req.query.team || "";
        const stadiumSafe = (req.body?.stadium) || req.query.stadium || "";

        res.render('results', {
            title: 'Search Error',
            league: leagueSafe,
            team: teamSafe,
            stadium: stadiumSafe,
            restaurants: [],
            searchCount: 0,
            error: 'Sorry, there was an error processing your search. Please try again.'
        });
    }
},


/*

    
    searchRestaurants: async (req, res) => {
        try {
            // Query Parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;
            const category = req.query.category || "";
            const sort = req.query.sort || "rating_desc";

            // support both POST (initial search) and GET (pagination/filter)
            const league = req.body.league || req.query.league || "";
            const team = req.body.team || req.query.team || "";
            const stadium = req.body.stadium || req.query.stadium || "";

            
            if (!league && !team && !stadium) {
                return res.render('results', {
                    title: 'Search Results',
                    error: 'Please provide at least one search criteria (league, team, or stadium)',
                    restaurants: [],
                    searchCount: 0
                });
            }

            console.log('Search criteria:', { league, team, stadium });
            
            const query = {};
            if (league && league !== '') query.league = league;
            if (team && team !== '') query.team = team;
            if (stadium && stadium !== '' && stadium !== 'Stadium information not available') {
                query.stadium = stadium;
            }

            console.log('Database query:', query);
            
            const stadiumData = await Stadium.findOne(query).maxTimeMS(10000);
            
            if (!stadiumData) {
                console.log('No stadium found matching criteria');
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

            let restaurants = stadiumData.businesses || [];
            console.log(`Found ${restaurants.length} restaurants for ${stadiumData.team}`);

            // Populate category dropdown with restaurant categories
            const allCategories = new Set();
            restaurants.forEach(r => {
                if (r.categories?.length) {
                    r.categories.forEach(c => allCategories.add(c.title));
                }
            });

            // Filter and sort

            if (category) {
                const cat = category.toLowerCase();
                restaurants = restaurants.filter(b =>
                    b.categories?.some(c =>
                        c.title.toLowerCase().includes(cat) ||
                        c.alias.toLowerCase().includes(cat)
                    )
                );
            }
            
            restaurants.sort((a, b) => {
                switch (sort) {
                    case "rating_asc":
                        return a.rating - b.rating;
                    case "rating_desc":
                        return b.rating - a.rating;
                    case "reviews_asc":
                        return a.review_count - b.review_count;
                    case "reviews_desc":
                        return b.review_count - a.review_count;
                    case "distance_asc":
                        return a.distance - b.distance;
                default:
                    return b.rating - a.rating;
                }
            });

            // Pagination
            const totalRestaurants = restaurants.length;
            const totalPages = Math.ceil(totalRestaurants / limit);
            const startIndex = (page - 1) * limit;
            const paginatedRestaurants = restaurants.slice(startIndex, startIndex + Number(limit));

            res.render('results', {
                title: `Restaurants Near ${stadiumData.stadium}`,
                league: stadiumData.league,
                team: stadiumData.team,
                stadium: stadiumData.stadium,
                city: stadiumData.city,
                state: stadiumData.state,
                restaurants: paginatedRestaurants,
                searchCount: totalRestaurants,
                currentPage: page,
                totalPages,
                limit,
                categories: Array.from(allCategories).sort(),
                selectedCategory: category,
                selectedSort: sort,
                success: `Found ${totalRestaurants} restaurants near ${stadiumData.stadium}`
            });

        } catch (error) {
            console.error('Error searching restaurants:', error);
            
            const league = (req.body && req.body.league) || req.query.league || "";
            const team = (req.body && req.body.team) || req.query.team || "";
            const stadium = (req.body && req.body.stadium) || req.query.stadium || "";

            res.render('results', {
                title: 'Search Error',
                league,
                team,
                stadium,
                restaurants: [],
                searchCount: 0,
                error: 'Sorry, there was an error processing your search. Please try again.'
            });
        }
    },
    */


    // Search by stadium name
    searchByStadiumName: async (req, res) => {
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
    },

    // Create new stadium
    createStadium: async (req, res) => {
        try {
            const {
                league,
                team,
                stadium,
                stadium_latitude,
                stadium_longitude,
                city,
                state,
                radius = "3000 meters",
                total = 0,
                businesses = []
            } = req.body;

            // Validate required fields
            if (!league || !team || !stadium || !city || !state) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: league, team, stadium, city, and state are required.'
                });
            }

            // Check if stadium already exists
            const existingStadium = await Stadium.findOne({
                $or: [
                    { league, team },
                    { stadium: stadium }
                ]
            });

            if (existingStadium) {
                return res.status(400).json({
                    success: false,
                    message: 'A stadium with this league/team or stadium name already exists'
                });
            }

            // Create new stadium document
            const newStadium = new Stadium({
                league,
                team,
                stadium,
                'stadium latitude': parseFloat(stadium_latitude) || 0,
                'stadium longitude': parseFloat(stadium_longitude) || 0,
                radius,
                city,
                state,
                total: parseInt(total) + (businesses.length || 0),
                businesses: Array.isArray(businesses) ? businesses.map(business => ({
                    ...business,
                    id: `initial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    rating: parseFloat(business.rating) || 0,
                    review_count: parseInt(business.review_count) || 0,
                    is_closed: false,
                    createdBy: req.session.user ? req.session.user._id : 'system',
                    createdAt: new Date(),
                    updatedAt: new Date()
                })) : []
            });

            await newStadium.save();

            console.log(`New stadium created: ${newStadium.stadium}`);

            res.status(201).json({
                success: true,
                message: 'Stadium created successfully!',
                stadiumId: newStadium._id,
                stadium: newStadium.stadium
            });

        } catch (error) {
            console.error('Error creating stadium:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating stadium',
                error: error.message
            });
        }
    },

    // Create new business (Add restaurant to stadium)
    createBusiness: async (req, res) => {
        try {
            const {
                league,
                team,
                stadium,
                name,
                alias,
                rating,
                price,
                review_count,
                phone,
                url,
                address1,
                city,
                state,
                zip_code,
                distance
            } = req.body;

            // Validate required fields
            if (!league || !team || !stadium || !name || !alias || !rating) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: league, team, stadium, name, alias, and rating are required.'
                });
            }

            // Find the stadium document
            const stadiumDoc = await Stadium.findOne({
                league: league,
                team: team,
                stadium: stadium
            });

            if (!stadiumDoc) {
                return res.status(404).json({
                    success: false,
                    message: 'Stadium not found. Please check league, team, and stadium information.'
                });
            }

            // Create unique business ID with user association
            const userId = req.session.user ? req.session.user._id : 'anonymous';
            const businessId = `user-${userId}-${Date.now()}`;

            let imageUrl = '';
            if (req.file) {
            imageUrl = '/uploads/' + req.file.filename;  
            } else if (req.body.image_url) {
            imageUrl = req.body.image_url.trim();
            } 

            // Create new business object matching the schema
            const newBusiness = {
                id: businessId,
                alias: alias,
                name: name,
                image_url: imageUrl,
                is_closed: false,
                url: url || '',
                review_count: parseInt(review_count) || 0,
                categories: [],
                rating: parseFloat(rating),
                coordinates: {
                    latitude: stadiumDoc['stadium latitude'] || 0,
                    longitude: stadiumDoc['stadium longitude'] || 0
                },
                transactions: [],
                price: price || '',
                phone: phone || '',
                display_phone: phone || '',
                distance: parseFloat(distance) || 0,
                travel_time: 0,
                location: {
                    address1: address1 || '',
                    address2: '',
                    address3: '',
                    city: city || stadiumDoc.city,
                    zip_code: zip_code || '',
                    country: 'US',
                    state: state || stadiumDoc.state,
                    display_address: [
                        address1 || '',
                        `${city || stadiumDoc.city}, ${state || stadiumDoc.state} ${zip_code || ''}`
                    ]
                },
                // User ownership tracking
                createdBy: userId,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Add the business to the stadium's businesses array
            stadiumDoc.businesses.push(newBusiness);
            
            // Update total count
            stadiumDoc.total = stadiumDoc.businesses.length;
            
            // Save the updated stadium document
            await stadiumDoc.save();

            console.log(`New business added to ${stadiumDoc.stadium} by user ${userId}`);

            res.status(201).json({
                success: true,
                message: 'Business added successfully!',
                businessId: businessId,
                stadium: stadiumDoc.stadium,
                totalBusinesses: stadiumDoc.total
            });

        } catch (error) {
            console.error('Error creating business:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating business. Please try again.',
                error: error.message
            });
        }
    },

    // Get user's businesses
    getUserBusinesses: async (req, res) => {
        try {
            const userId = req.params.userId || (req.session.user ? req.session.user._id : null);
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }

            // Find all stadiums that have businesses created by this user
            const stadiums = await Stadium.find({
                'businesses.createdBy': userId
            });

            // Extract user's businesses from all stadiums
            const userBusinesses = [];
            stadiums.forEach(stadium => {
                stadium.businesses.forEach(business => {
                    if (business.createdBy && business.createdBy.toString() === userId.toString()) {
                        userBusinesses.push({
                            ...business.toObject(),
                            stadiumName: stadium.stadium,
                            team: stadium.team,
                            league: stadium.league,
                            city: stadium.city,
                            state: stadium.state
                        });
                    }
                });
            });

            res.status(200).json({
                success: true,
                count: userBusinesses.length,
                businesses: userBusinesses
            });

        } catch (error) {
            console.error('Error fetching user businesses:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching user businesses',
                error: error.message
            });
        }
    },

   // Update user's business
updateBusiness: async (req, res) => {
  try {
    const { businessId } = req.params;
    const userId = req.session.user ? req.session.user._id : null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Find stadium containing this business created by this user
    const stadium = await Stadium.findOne({
      'businesses.id': businessId,
      'businesses.createdBy': userId
    });

    if (!stadium) {
      return res.status(404).json({
        success: false,
        message: 'Business not found or you do not have permission to edit it.'
      });
    }

    // Find the business index
    const businessIndex = stadium.businesses.findIndex(b =>
      b.id === businessId &&
      b.createdBy &&
      b.createdBy.toString() === userId.toString()
    );

    if (businessIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Business not found or you do not have permission to edit it.'
      });
    }

    const b = stadium.businesses[businessIndex];
    const body = req.body || {};

    // ---- Image update (optional) ----
     if (req.file) {
    // new uploaded image
    b.image_url = '/uploads/' + req.file.filename;
    } else if (body.image_url) {
    // or plain URL typed by user in form
    b.image_url = body.image_url.trim();
    }


    // -------- Editable simple fields --------

    if (typeof body.name === 'string') {
      b.name = body.name.trim();
    }

    if (typeof body.alias === 'string') {
      b.alias = body.alias.trim();
    }

    if (body.rating !== undefined) {
      const ratingNum = parseFloat(body.rating);
      if (!isNaN(ratingNum) && ratingNum >= 0 && ratingNum <= 5) {
        b.rating = ratingNum;
      }
    }

    if (body.review_count !== undefined) {
      const rc = parseInt(body.review_count, 10);
      if (!isNaN(rc) && rc >= 0) {
        b.review_count = rc;
      }
    }

    if (typeof body.price === 'string') {
      b.price = body.price;
    }

    if (typeof body.phone === 'string') {
      const phone = body.phone.trim();
      b.phone = phone;
      b.display_phone = phone;
    }

    if (typeof body.url === 'string') {
      b.url = body.url.trim();
    }

    if (body.distance !== undefined) {
      const dist = parseFloat(body.distance);
      if (!isNaN(dist) && dist >= 0) {
        b.distance = dist;
      }
    }

    // -------- Address line (but NOT city/state) --------
    b.location = b.location || {};

    if (typeof body.address1 === 'string') {
      b.location.address1 = body.address1.trim();
    }

    if (typeof body.zip_code === 'string') {
      b.location.zip_code = body.zip_code.trim();
    }

    // NOTE: we intentionally IGNORE body.city and body.state
    // Stadium city/state define where this business belongs.

    // Rebuild display_address based on stadium city/state + address1/zip
    const city = stadium.city || '';
    const state = stadium.state || '';
    b.location.display_address = [
      b.location.address1 || '',
      `${city}${city && state ? ', ' : ''}${state} ${b.location.zip_code || ''}`.trim()
    ].filter(Boolean);

    // Timestamp
    b.updatedAt = new Date();

    await stadium.save();

    return res.status(200).json({
      success: true,
      message: 'Business updated successfully!',
      business: b
    });

  } catch (error) {
    console.error('Error updating business:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating business',
      error: error.message
    });
  }
},


        // Get analytics for the user's businesses
    getUserBusinessStats: async (req, res) => {
        try {
            const userId = req.session.user ? req.session.user._id : null;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }

            // Find all stadiums that have businesses created by this user
            const stadiums = await Stadium.find({
                'businesses.createdBy': userId
            });

            let totalBusinesses = 0;
            const stadiumSet = new Set();
            const leagueSet = new Set();
            const leagueCounts = {};

            let sumRating = 0;
            let ratingCount = 0;

            let highestRatedBusiness = null;
            let mostRecentBusiness = null;

            stadiums.forEach(stadium => {
                stadium.businesses.forEach(business => {
                    if (!business.createdBy || business.createdBy.toString() !== userId.toString()) {
                        return;
                    }

                    totalBusinesses++;
                    stadiumSet.add(stadium.stadium);
                    leagueSet.add(stadium.league);

                    // league counts for "most active league"
                    leagueCounts[stadium.league] = (leagueCounts[stadium.league] || 0) + 1;

                    // ratings for average
                    if (business.rating !== undefined && business.rating !== null && !isNaN(business.rating)) {
                        sumRating += Number(business.rating);
                        ratingCount++;
                    }

                    // highest rated business (tie-break with review_count)
                    if (!highestRatedBusiness) {
                        highestRatedBusiness = {
                            ...business.toObject(),
                            stadiumName: stadium.stadium,
                            team: stadium.team,
                            league: stadium.league
                        };
                    } else {
                        const currentBest = highestRatedBusiness;
                        const bRating = Number(business.rating) || 0;
                        const bestRating = Number(currentBest.rating) || 0;

                        if (
                            bRating > bestRating ||
                            (bRating === bestRating &&
                              (Number(business.review_count) || 0) >
                              (Number(currentBest.review_count) || 0))
                        ) {
                            highestRatedBusiness = {
                                ...business.toObject(),
                                stadiumName: stadium.stadium,
                                team: stadium.team,
                                league: stadium.league
                            };
                        }
                    }

                    // most recent business
                    const bCreatedAt = business.createdAt ? new Date(business.createdAt) : null;
                    const currentMostRecent = mostRecentBusiness && mostRecentBusiness.createdAt
                        ? new Date(mostRecentBusiness.createdAt)
                        : null;

                    if (bCreatedAt && (!currentMostRecent || bCreatedAt > currentMostRecent)) {
                        mostRecentBusiness = {
                            ...business.toObject(),
                            stadiumName: stadium.stadium,
                            team: stadium.team,
                            league: stadium.league
                        };
                    }
                });
            });

            const averageRating =
                ratingCount > 0 ? Number((sumRating / ratingCount).toFixed(2)) : null;

            // compute most active league
            let mostActiveLeague = null;
            let mostActiveCount = 0;
            Object.keys(leagueCounts).forEach(league => {
                if (leagueCounts[league] > mostActiveCount) {
                    mostActiveLeague = league;
                    mostActiveCount = leagueCounts[league];
                }
            });

            return res.status(200).json({
                success: true,
                stats: {
                    totalBusinesses,
                    totalStadiums: stadiumSet.size,
                    totalLeagues: leagueSet.size,
                    averageRating,
                    mostActiveLeague: mostActiveLeague
                        ? { league: mostActiveLeague, count: mostActiveCount }
                        : null,
                    highestRatedBusiness,
                    mostRecentBusiness
                }
            });

        } catch (error) {
            console.error('Error fetching user business stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching user business stats',
                error: error.message
            });
        }
    },



    // Delete user's business
    deleteBusiness: async (req, res) => {
        try {
            const { businessId } = req.params;
            const userId = req.session.user ? req.session.user._id : null;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }

            // Find stadium containing this business
            const stadium = await Stadium.findOne({
                'businesses.id': businessId,
                'businesses.createdBy': userId
            });

            if (!stadium) {
                return res.status(404).json({
                    success: false,
                    message: 'Business not found or you do not have permission to delete it.'
                });
            }

            // Filter out the business to delete
            const initialLength = stadium.businesses.length;
            stadium.businesses = stadium.businesses.filter(b => 
                !(b.id === businessId && b.createdBy.toString() === userId.toString())
            );

            // Check if business was actually removed
            if (stadium.businesses.length === initialLength) {
                return res.status(404).json({
                    success: false,
                    message: 'Business not found.'
                });
            }

            // Update total count
            stadium.total = stadium.businesses.length;
            
            await stadium.save();

            res.status(200).json({
                success: true,
                message: 'Business deleted successfully!',
                totalBusinesses: stadium.total
            });

        } catch (error) {
            console.error('Error deleting business:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting business',
                error: error.message
            });
        }
    },

    // Health check
    healthCheck: async (req, res) => {
        try {
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
    }
    
};

module.exports = stadiumController;