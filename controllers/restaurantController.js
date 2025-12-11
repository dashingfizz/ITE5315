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

// Get all stadiums
exports.getStadiums = async (req, res) => {
    const stadiums = await Stadium.find({}, "stadium team league businesses");

    const allCities = new Set();
    const allCategories = new Set();

    stadiums.forEach(s => {
        s.businesses.forEach(b => {
            if (b.location?.city) {
                allCities.add(b.location.city);
            }
            if (b.categories?.length) {
                b.categories.forEach(c => allCategories.add(c.title));
            }
        });
    });

    res.render("restaurants", {
        stadiums,
        cities: Array.from(allCities).sort(),
        categories: Array.from(allCategories).sort()
    });
};

//

// Search restaurants with pagination, filtering, sorting
exports.searchRestaurants = async (req, res) => {
    try {
        // Query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const city = req.query.city || "";
        const category = req.query.category || "";
        const sort = req.query.sort || "rating_desc"; 
        // rating_desc | rating_asc | reviews_desc | reviews_asc | distance_asc

        // POST body for league/team/stadium
        const { league, team, stadium } = req.body;

        // Validate
        if (!league && !team && !stadium) {
            return res.render("results", {
                title: "Search Results",
                error: "Please provide at least one search criteria.",
                restaurants: [],
                searchCount: 0
            });
        }

        // Build query
        const query = {};
        if (league) query.league = league;
        if (team) query.team = team;
        if (stadium && stadium !== "Stadium information not available")
            query.stadium = stadium;

        // Fetch stadium
        const stadiumData = await Stadium.findOne(query).lean();

        if (!stadiumData) {
            return res.render("results", {
                title: "No Stadium Found",
                restaurants: [],
                searchCount: 0,
                message: "No stadium matched your search criteria."
            });
        }

        let restaurants = stadiumData.businesses || [];

        // ---------- FILTERING ----------
        if (city) {
            restaurants = restaurants.filter(b =>
                b.location?.city?.toLowerCase() === city.toLowerCase()
            );
        }

        if (category) {
            const cat = category.toLowerCase();
            restaurants = restaurants.filter(b =>
                b.categories?.some(c =>
                    c.title.toLowerCase().includes(cat) ||
                    c.alias.toLowerCase().includes(cat)
                )
            );
        }

        // ---------- SORTING ----------
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

        // ---------- PAGINATION ----------
        const totalRestaurants = restaurants.length;
        const totalPages = Math.ceil(totalRestaurants / limit);
        const start = (page - 1) * limit;
        const paginatedRestaurants = restaurants.slice(start, start + limit);

        // ---------- RENDER ----------
        res.render("results", {
            title: `Restaurants Near ${stadiumData.stadium}`,
            league: stadiumData.league,
            team: stadiumData.team,
            stadium: stadiumData.stadium,

            restaurants: paginatedRestaurants,
            searchCount: totalRestaurants,

            currentPage: page,
            totalPages,
            limit,

            selectedCity: city,
            selectedCategory: category,
            selectedSort: sort
        });

    } catch (error) {
        console.error("Error searching:", error);
        res.render("results", {
            title: "Search Error",
            restaurants: [],
            searchCount: 0,
            error: "There was an error processing your search."
        });
    }
},







// Get all restaurants for a specific stadium
exports.getRestaurantsbyStadium = async (req, res) => {
  const { page = 1, limit = 10, city, category } = req.query;
  const stadiumId = req.params.id;

  const stadium = await Stadium.findById(stadiumId);

  if (!stadium) {
    return res.status(404).json({ message: "Stadium not found" });
  }

  let results = stadium.businesses;

  if (city) {
    results = results.filter(b => 
      b.location?.city?.toLowerCase() === city.toLowerCase()
    );
  }

  if (category) {
    const cat = category.toLowerCase();
    results = results.filter(b =>
      b.categories?.some(c =>
        c.alias.toLowerCase().includes(cat) ||
        c.title.toLowerCase().includes(cat)
      )
    );
  }


  // Pagination
  const total = results.length;
  const totalPages = Math.ceil(total / limit);

  const startIndex = (page - 1) * limit;
  const paginated = results.slice(startIndex, startIndex + Number(limit));

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      businesses: paginated
  });
};