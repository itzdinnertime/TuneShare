const express = require('express');
const path = require('path');
const logger = require('morgan');
const exphbs = require('express-handlebars'); // Import express-handlebars
const session = require('express-session');

require('dotenv').config();

const db = require('./config/db'); // Import the SQLite3 database (no need to call connectDB)
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.engine('handlebars', exphbs.engine()); // Register express-handlebars
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Serve static files with no-cache headers
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-store');
    }
}));

// Pass user data to all views
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

// Add session middleware
app.use(
    session({
        secret: '4f8b2c3e5d6a7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, maxAge: 3600000 }, // 1 hour
    })
);

// Pass user data to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null; // Attach user data to all views
    next();
});

// Routes
app.use('/', routes);

app.engine(
    'handlebars',
    exphbs.engine({
        helpers: {
            eq: (a, b) => a === b, // Helper to compare two values
        },
    })
);