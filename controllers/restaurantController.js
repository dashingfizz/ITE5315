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
  const startIndex = (page - 1) * limit;
  const paginated = results.slice(startIndex, startIndex + Number(limit));

  res.json({
    total: results.length,
    page: Number(page),
    limit: Number(limit),
    businesses: paginated
  });
};