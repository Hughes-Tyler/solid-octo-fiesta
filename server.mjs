import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Could not open database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Create a users table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
)`);

// Root route
app.get('/', (req, res) => {
    res.send('Hello, your server is running!');
});

// Route for registering a new user
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 8);

    // Insert the new user into the database
    const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.run(sql, [username, hashedPassword], (err) => {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                return res.status(400).send('Username already exists');
            }
            return res.status(500).send('Error registering user');
        }
        res.status(200).send('User registered successfully');
    });
});

// Route for logging in a user
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, user) => {
        if (err) {
            return res.status(500).send('Error checking user');
        }

        if (!user) {
            return res.status(400).send('Invalid username or password');
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).send('Invalid username or password');
        }

        res.status(200).send('Login successful');
    });
});


// Your existing route
app.post('/getTravelTime', async (req, res) => {
    const { origin, destination } = req.body;

    try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        res.send(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send({ error: 'Error fetching data from Google Maps API' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
