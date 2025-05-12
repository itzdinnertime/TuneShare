const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import the SQLite3 database connection
const bcrypt = require('bcryptjs');
const { renderHomePage } = require('../controllers/homeController');
const { searchSpotify } = require('../utils/spotify');

// Define a route for the homepage
router.get('/', renderHomePage);

//LOGIN PAGE ===================================================================

// Define a route for the login page
router.get('/login', (req, res) => {
    res.render('login'); // Render the login.handlebars view
});

// Handle login form submission
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Check if the username exists in the database
    db.get('SELECT * FROM Users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            console.error('Error fetching user:', err.message);
            return res.status(500).send('Internal server error');
        }

        if (!user) {
            // Redirect back to the login page with an error message
            return res.render('login', { error: 'Invalid username or password.' });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Redirect back to the login page with an error message
            return res.render('login', { error: 'Invalid username or password.' });
        }

        // Store user information in the session, including the role
        req.session.user = { id: user.id, username: user.username, role: user.role };

        // Redirect to the search page
        res.redirect('/search');
    });
});

//Sign UP PAGE ===================================================================

// Define a route for the sign-up page
router.get('/signup', (req, res) => {
    res.render('signup'); // Render the signup.handlebars view
});

// Handle sign-up form submission
router.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    // Check if the username already exists
    db.get('SELECT * FROM Users WHERE username = ?', [username], async (err, row) => {
        if (err) {
            console.error('Error checking username:', err.message);
            return res.status(500).send('Internal server error');
        }

        if (row) {
            // Redirect back to the signup page with an error message
            return res.render('signup', { error: 'Username is already taken. Please choose another.' });
        }

        try {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert the new user into the database
            const query = `
                INSERT INTO Users (username, password, role, createdAt)
                VALUES (?, ?, 'guest', datetime('now'))
            `;
            db.run(query, [username, hashedPassword], function (err) {
                if (err) {
                    console.error('Error inserting user into database:', err.message);
                    return res.status(500).send('Internal server error');
                }

                console.log(`User '${username}' successfully created`);
                res.redirect('/login'); // Redirect to the login page
            });
        } catch (error) {
            console.error('Error hashing password:', error.message);
            res.status(500).send('Internal server error');
        }
    });
});

// Search Page ===================================================================
router.get('/search', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // Redirect to login if the user is not logged in
    }
    res.render('search', { user: req.session.user }); // Pass the user object to the view
});

//Spotify API Route ==========================================================
router.get('/api/songs/search', async (req, res) => {
    const query = req.query.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const songs = await searchSpotify(query);
        res.status(200).json(songs);
    } catch (error) {
        console.error('Error searching Spotify:', error.message);
        res.status(500).json({ error: 'Failed to search Spotify' });
    }
});

// Handle User Search API
router.get('/api/users/search', (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Fetch users and their playlists
    db.all(
        `
        SELECT Users.id AS userId, Users.username, Playlists.id AS playlistId, Playlists.name AS playlistName, Playlists.image AS playlistImage
        FROM Users
        LEFT JOIN Playlists ON Users.id = Playlists.userId
        WHERE Users.username LIKE ?
        ORDER BY Users.id, Playlists.id
        `,
        [`%${query}%`],
        (err, rows) => {
            if (err) {
                console.error('Error searching users and playlists:', err.message);
                return res.status(500).json({ error: 'Failed to search users and playlists' });
            }

            // Group playlists by user
            const users = {};
            rows.forEach((row) => {
                if (!users[row.userId]) {
                    users[row.userId] = {
                        username: row.username,
                        playlists: [],
                    };
                }
                if (row.playlistId) {
                    users[row.userId].playlists.push({
                        id: row.playlistId,
                        name: row.playlistName,
                        image: row.playlistImage || '/assets/placeholder.jpg', // Use placeholder if no image
                    });
                }
            });

            res.status(200).json(Object.values(users));
        }
    );
});

// API to fetch songs in a playlist
router.get('/api/playlists/:id/songs', (req, res) => {
    const playlistId = req.params.id;

    // Check if the playlist exists and is accessible
    db.get('SELECT * FROM Playlists WHERE id = ?', [playlistId], (err, playlist) => {
        if (err) {
            console.error('Error fetching playlist:', err.message);
            return res.status(500).json({ error: 'Failed to fetch playlist.' });
        }

        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found.' });
        }

        // Fetch songs for the playlist
        db.all('SELECT id, name, image, spotifyUrl FROM Songs WHERE playlistId = ?', [playlistId], (err, songs) => {
            if (err) {
                console.error('Error fetching songs:', err.message);
                return res.status(500).json({ error: 'Failed to fetch songs.' });
            }
            res.status(200).json(songs);
        });
    });
});

// Connect Page ====================================================================
router.get('/connect', (req, res) => {
    // Render the Connect page for all users, including guests
    res.render('connect', { user: req.session.user || null });
});

// Playlist Page ===================================================================
router.get('/playlists', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // Redirect to login if the user is not logged in
    }

    const userId = req.session.user.id;

    db.all('SELECT * FROM Playlists WHERE userId = ?', [userId], (err, playlists) => {
        if (err) {
            console.error('Error fetching playlists:', err.message);
            return res.status(500).send('Failed to fetch playlists.');
        }

        // Pass playlists to the view
        res.render('playlists', { user: req.session.user, playlists });
    });
});

// API to get all playlists for the logged-in user
router.get('/api/playlists', (req, res) => {
    const userId = req.session.user.id;

    db.all('SELECT * FROM Playlists WHERE userId = ?', [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching playlists:', err.message);
            return res.status(500).json({ error: 'Failed to fetch playlists' });
        }
        res.status(200).json(rows);
    });
});

// API to create a new playlist
router.post('/api/playlists', (req, res) => {
    const userId = req.session.user.id;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Playlist name is required' });
    }

    db.run(
        'INSERT INTO Playlists (userId, name) VALUES (?, ?)',
        [userId, name],
        function (err) {
            if (err) {
                console.error('Error creating playlist:', err.message);
                return res.status(500).json({ error: 'Failed to create playlist' });
            }
            res.status(201).json({ id: this.lastID, name });
        }
    );
});

// API to delete a playlist
router.delete('/api/playlists/:id', (req, res) => {
    const userId = req.session.user.id;
    const playlistId = req.params.id;

    db.run(
        'DELETE FROM Playlists WHERE id = ? AND userId = ?',
        [playlistId, userId],
        function (err) {
            if (err) {
                console.error('Error deleting playlist:', err.message);
                return res.status(500).json({ error: 'Failed to delete playlist' });
            }
            res.status(204).send();
        }
    );
});

// Route to render the playlist creation page
router.get('/playlists/create', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // Redirect to login if the user is not logged in
    }
    res.render('createPlaylist', { user: req.session.user }); // Render the createPlaylist page
});

// Handle playlist creation form submission
router.post('/playlists/create', (req, res) => {
    const userId = req.session.user.id;
    const { name } = req.body;

    if (!name) {
        return res.status(400).send('Playlist name is required.');
    }

    db.run(
        'INSERT INTO Playlists (userId, name) VALUES (?, ?)',
        [userId, name],
        function (err) {
            if (err) {
                console.error('Error creating playlist:', err.message);
                return res.status(500).send('Failed to create playlist.');
            }
            console.log(`Playlist '${name}' created successfully.`);
            res.redirect('/playlists'); // Redirect back to the playlists page
        }
    );
});

// Route to render the playlist editing page
router.get('/playlists/:id', (req, res) => {
    const playlistId = req.params.id;
    const userId = req.session.user.id;

    db.get('SELECT * FROM Playlists WHERE id = ? AND userId = ?', [playlistId, userId], (err, playlist) => {
        if (err || !playlist) {
            console.error('Error fetching playlist:', err?.message || 'Playlist not found');
            return res.status(404).send('Playlist not found');
        }

        db.all('SELECT * FROM Songs WHERE playlistId = ?', [playlistId], (err, songs) => {
            if (err) {
                console.error('Error fetching songs:', err.message);
                return res.status(500).send('Failed to fetch songs.');
            }

            res.render('viewPlaylist', { user: req.session.user, playlist, songs });
        });
    });
});

// API to add a song to a playlist
router.post('/api/playlists/:id/songs', (req, res) => {
    const playlistId = req.params.id;
    const userId = req.session.user.id;
    const { songName, image } = req.body;

    if (!songName || !image) {
        return res.status(400).json({ error: 'Song name and image are required' });
    }

    db.run(
        'INSERT INTO Songs (playlistId, name, userId, image) VALUES (?, ?, ?, ?)',
        [playlistId, songName, userId, image],
        function (err) {
            if (err) {
                console.error('Error adding song to playlist:', err.message);
                return res.status(500).json({ error: 'Failed to add song to playlist' });
            }
            res.status(201).json({ id: this.lastID, name: songName, image });
        }
    );
});

// Delete a song from the playlist
router.delete('/api/playlists/:playlistId/songs/:songId', (req, res) => {
    const { playlistId, songId } = req.params;

    db.run(
        'DELETE FROM Songs WHERE id = ? AND playlistId = ?',
        [songId, playlistId],
        function (err) {
            if (err) {
                console.error('Error deleting song from playlist:', err.message);
                return res.status(500).json({ error: 'Failed to delete song from playlist' });
            }
            res.status(204).send();
        }
    );
});

// Settings Page ===================================================================
router.get('/settings', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // Redirect to login if the user is not logged in
    }

    if (req.session.user.role === 'admin') {
        db.all('SELECT id, username, role, createdAt FROM Users', [], (err, users) => {
            if (err) {
                console.error('Error fetching users:', err.message);
                return res.status(500).send('Failed to fetch users.');
            }
            res.render('settings', { user: req.session.user, users }); // Pass all users to the view
        });
    } else {
        res.render('settings', { user: req.session.user }); // Only pass the current user
    }
});

// Update Username
router.post('/settings/update-username', (req, res) => {
    const userId = req.session.user.id;
    const { newUsername } = req.body;

    if (!newUsername) {
        return res.status(400).send('New username is required.');
    }

    // Check if the new username is already taken
    db.get('SELECT * FROM Users WHERE username = ?', [newUsername], (err, row) => {
        if (err) {
            console.error('Error checking username:', err.message);
            return res.status(500).send('Internal server error');
        }

        if (row) {
            return res.status(400).send('Username is already taken. Please choose another.');
        }

        // Update the username
        db.run('UPDATE Users SET username = ? WHERE id = ?', [newUsername, userId], (err) => {
            if (err) {
                console.error('Error updating username:', err.message);
                return res.status(500).send('Failed to update username.');
            }

            // Update the session with the new username
            req.session.user.username = newUsername;
            res.redirect('/settings');
        });
    });
});

// Delete User (Admin Only)
router.post('/settings/delete-user', (req, res) => {
    if (req.session.user.role !== 'admin') {
        console.error('Access denied: User is not an admin.');
        return res.status(403).send('Access denied.');
    }

    const { userId } = req.body;

    if (!userId) {
        console.error('User ID is missing in the request.');
        return res.status(400).send('User ID is required.');
    }

    // Prevent admin from deleting themselves
    if (parseInt(userId) === req.session.user.id) {
        console.error('Admin attempted to delete their own account.');
        return res.status(400).send('You cannot delete yourself.');
    }

    db.run('DELETE FROM Users WHERE id = ?', [userId], (err) => {
        if (err) {
            console.error('Error deleting user:', err.message);
            return res.status(500).send('Failed to delete user.');
        }
        console.log(`User with ID ${userId} deleted successfully.`);
        res.status(200).json({ message: 'User deleted successfully.' });
    });
});

// Logout Route ===================================================================
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Failed to log out.');
        }
        res.redirect('/'); // Redirect to the index page
    });
});

module.exports = router;