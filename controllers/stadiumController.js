const Stadium = require('../models/Stadium');

const stadiumController = {
    // Get home page data
    getHome: async (req, res) => {
        try {
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

    // Search restaurants
    searchRestaurants: async (req, res) => {
        try {
            const { league, team, stadium } = req.body;
            
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

            const restaurants = stadiumData.businesses || [];
            console.log(`Found ${restaurants.length} restaurants for ${stadiumData.team}`);

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
            console.error('Error searching restaurants:', error);
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
    },

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