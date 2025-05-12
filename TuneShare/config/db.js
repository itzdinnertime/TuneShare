const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs'); // Import bcrypt for password hashing

// Initialize SQLite3 database
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite3 database:', err.message);
    } else {
        console.log('Connected to SQLite3 database.');
    }
});

// Create Songs table if it doesn't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS Songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            playlistId INTEGER NOT NULL,
            userId INTEGER NOT NULL,
            name TEXT NOT NULL,
            image TEXT,
            spotifyUrl TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (playlistId) REFERENCES Playlists (id),
            FOREIGN KEY (userId) REFERENCES Users (id)
        )
    `);

    // Initialize or reset orderIndex for all songs
    db.run(`
        UPDATE Songs
        SET orderIndex = (
            SELECT COUNT(*)
            FROM Songs AS s
            WHERE s.playlistId = Songs.playlistId AND s.id <= Songs.id
        ) - 1;
    `, (err) => {
        if (err) {
            console.error('Error initializing orderIndex:', err.message);
        } else {
            console.log('orderIndex initialized for all songs.');
        }
    });
});

// Create Users table if it doesn't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'guest',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Insert admin user if it doesn't exist
    const adminUsername = 'admin';
    const adminPassword = '123';
    const adminRole = 'admin';

    db.get('SELECT * FROM Users WHERE username = ?', [adminUsername], async (err, row) => {
        if (err) {
            console.error('Error checking for admin user:', err.message);
        } else if (!row) {
            try {
                const hashedPassword = await bcrypt.hash(adminPassword, 10); // Hash the password
                db.run(
                    'INSERT INTO Users (username, password, role) VALUES (?, ?, ?)',
                    [adminUsername, hashedPassword, adminRole],
                    (err) => {
                        if (err) {
                            console.error('Error inserting admin user:', err.message);
                        } else {
                            console.log('Admin user created successfully.');
                        }
                    }
                );
            } catch (error) {
                console.error('Error hashing admin password:', error.message);
            }
        } else {
            console.log('Admin user already exists.');
        }
    });
});

module.exports = db;