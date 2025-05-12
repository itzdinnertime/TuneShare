document.addEventListener('DOMContentLoaded', function () {
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    const songList = document.getElementById('song-list');
    const dropbox1 = document.getElementById('dropbox1'); // Context menu
    const dropbox2 = document.getElementById('dropbox2'); // Playlist dropdown
    let selectedSong = null;

    if (searchButton && searchInput && songList) {
        searchButton.addEventListener('click', searchSongs);

        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                searchSongs();
            }
        });

        async function searchSongs() {
            const query = searchInput.value.trim();
            if (!query) {
                alert('Please enter a search query.');
                return;
            }

            try {
                const response = await fetch(`/api/songs/search?query=${encodeURIComponent(query)}`);
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                const songs = await response.json();
                displaySongs(songs);
            } catch (error) {
                console.error('Error fetching songs:', error);
                alert('Failed to fetch songs. Please try again.');
            }
        }

        function displaySongs(songs) {
            songList.innerHTML = ''; // Clear previous results
            songs.forEach((song) => {
                const songItem = document.createElement('div');
                songItem.classList.add('song-item');
                songItem.dataset.id = song.id;
                songItem.dataset.spotifyUrl = song.url; // Set the Spotify URL
                songItem.innerHTML = `
                    <img src="${song.image}" alt="${song.title} Album Cover" class="song-image" />
                    <div class="song-details">
                        <h3 class="song-title">${song.title}</h3>
                        <p class="song-artist">${song.artist}</p>
                    </div>
                `;
        
                // Add right-click event listener for the song item
                songItem.addEventListener('contextmenu', (event) => {
                    event.preventDefault(); // Prevent the default right-click menu
                    selectedSong = song; // Store the selected song
        
                    // Position the context menu (dropbox1)
                    const { clientX: mouseX, clientY: mouseY } = event;
                    dropbox1.style.left = `${mouseX}px`;
                    dropbox1.style.top = `${mouseY}px`;
        
                    // Show the context menu
                    dropbox1.classList.add('show');
                });
        
                songList.appendChild(songItem);
            });
        }

        // Add functionality to "Add to playlist" in the context menu
        const addToPlaylistOption = document.getElementById('add-to-playlist');
        addToPlaylistOption.addEventListener('mouseenter', async () => {
            if (!selectedSong) return;

            try {
                // Fetch playlists from the server
                const response = await fetch('/api/playlists');
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                const playlists = await response.json();

                // Populate the playlist dropdown (dropbox2)
                dropbox2.innerHTML = ''; // Clear existing playlists
                playlists.forEach((playlist) => {
                    const playlistItem = document.createElement('div');
                    playlistItem.classList.add('playlist-dropdown-item');
                    playlistItem.textContent = playlist.name;
                    playlistItem.addEventListener('click', () => addToPlaylist(playlist.id, selectedSong.title, selectedSong.image));
                    dropbox2.appendChild(playlistItem);
                });

                // Position and show the playlist dropdown
                const rect = addToPlaylistOption.getBoundingClientRect();
                dropbox2.style.left = `${rect.right}px`; // Align to the right of the context menu
                dropbox2.style.top = `${rect.top}px`; // Align with the top of the context menu
                dropbox2.classList.add('show');
            } catch (error) {
                console.error('Error fetching playlists:', error);
            }
        });

        // Add functionality to "View on Spotify" in the context menu
        const viewOnSpotifyOption = document.getElementById('view-on-spotify');
        viewOnSpotifyOption.addEventListener('click', () => {
            if (!selectedSong || !selectedSong.url) {
                alert('Spotify link not available for this song.');
                return;
            }
            window.open(selectedSong.url, '_blank'); // Open the Spotify link in a new tab
        });

        async function addToPlaylist(playlistId, songTitle, songImage) {
            try {
                const response = await fetch(`/api/playlists/${playlistId}/songs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ songName: songTitle, image: songImage }),
                });
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                alert(`Added "${songTitle}" to playlist.`);
            } catch (error) {
                console.error('Error adding song to playlist:', error);
            }
        }

        // Hide the context menu and playlist dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!dropbox1.contains(event.target) && !dropbox2.contains(event.target)) {
                dropbox1.classList.remove('show');
                dropbox2.classList.remove('show');
            }
        });
    }
});