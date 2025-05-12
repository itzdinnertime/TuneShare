const axios = require('axios');

let accessToken = null;

// Function to get Spotify access token
async function getAccessToken() {
    if (accessToken) return accessToken;

    try {
        console.log('Requesting Spotify access token...');
        const response = await axios.post('https://accounts.spotify.com/api/token', null, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(
                    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
                ).toString('base64')}`,
            },
            params: {
                grant_type: 'client_credentials',
            },
        });

        accessToken = response.data.access_token;
        console.log('Spotify access token received:', accessToken);

        // Set a timeout to clear the token when it expires
        setTimeout(() => {
            accessToken = null;
        }, response.data.expires_in * 1000);

        return accessToken;
    } catch (error) {
        console.error('Error fetching Spotify access token:', error.message);
        throw new Error('Failed to fetch Spotify access token');
    }
}

// Function to search for songs on Spotify
async function searchSpotify(query) {
    try {
        console.log('Searching Spotify for query:', query);
        const token = await getAccessToken();

        const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                q: query,
                type: 'track',
                limit: 10, // Limit the number of results
            },
        });

        console.log('Spotify search results:', response.data.tracks.items);

        return response.data.tracks.items.map((track) => ({
            id: track.id,
            title: track.name,
            artist: track.artists.map((artist) => artist.name).join(', '),
            album: track.album.name,
            image: track.album.images[0]?.url || '', // Get the first image or an empty string
            url: track.external_urls.spotify,
        }));
    } catch (error) {
        console.error('Error searching Spotify:', error.message);
        throw new Error('Failed to search Spotify');
    }
}

module.exports = { searchSpotify };