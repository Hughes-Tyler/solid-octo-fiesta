import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.send('Hello, your server is running!');
});

app.post('/getTravelTime', async (req, res) => {
    const { origin, destination } = req.body;

    try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Use the API key from environment variable
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
