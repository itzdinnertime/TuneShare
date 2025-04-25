const db = require('../config/db');

const authMiddleware = () => (req, res, next) => {
    const token = req.cookies?.token; // Assuming the token is stored in cookies

    if (!token) {
        return res.redirect('/login'); // Redirect to login if no token is found
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        db.get('SELECT * FROM Users WHERE id = ?', [decoded.id], (err, user) => {
            if (err || !user) {
                return res.redirect('/login'); // Redirect to login if user is not found
            }

            req.user = user; // Attach user info to the request
            next();
        });
    } catch (error) {
        return res.redirect('/login'); // Redirect to login if token is invalid
    }
};

module.exports = (req, res, next) => {
    // Check if the user is logged in by verifying the session
    if (!req.session.user) {
        console.log('User is not authenticated. Redirecting to login.');
        return res.redirect('/login'); // Redirect to login if the user is not logged in
    }

    // If the user is authenticated, attach user data to the request object
    req.user = req.session.user;

    // Proceed to the next middleware or route handler
    next();
};

module.exports = authMiddleware;