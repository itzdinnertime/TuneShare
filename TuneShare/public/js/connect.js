document.addEventListener('DOMContentLoaded', function () {
    const searchButton = document.getElementById('user-search-button');
    const searchInput = document.getElementById('user-search-input');
    const userList = document.getElementById('user-list');

    if (searchButton && searchInput && userList) {
        // Add event listener for the search button
        searchButton.addEventListener('click', searchUsers);

        // Allow pressing "Enter" to trigger the search
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                searchUsers();
            }
        });

        async function searchUsers() {
            const query = searchInput.value.trim();
            if (!query) {
                alert('Please enter a search query.');
                return;
            }

            try {
                const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`);
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                const users = await response.json();
                displayUsers(users); // Call the displayUsers function
            } catch (error) {
                console.error('Error searching users:', error);
                alert('Failed to search users. Please try again.');
            }
        }

        // Function to display users and their playlists
        function displayUsers(users) {
            userList.innerHTML = ''; // Clear previous results

            if (users.length === 0) {
                userList.innerHTML = '<p>No users found.</p>';
                return;
            }

            users.forEach((user) => {
                const userItem = document.createElement('div');
                userItem.classList.add('user-item');
                userItem.innerHTML = `
                    <div class="user-header">
                        <h3>${user.username}</h3>
                    </div>
                    <div class="user-playlists">
                        <h4>Playlists:</h4>
                        <div class="playlist-grid">
                            ${user.playlists
                                .map(
                                    (playlist) => `
                                    <div class="playlist-box" data-id="${playlist.id}">
                                        <img src="${playlist.image}" alt="${playlist.name}" class="playlist-image" />
                                        <p class="playlist-name">${playlist.name}</p>
                                    </div>
                                `
                                )
                                .join('')}
                        </div>
                    </div>
                `;
                userList.appendChild(userItem);

                // Add click event listener to each playlist box
                const playlistBoxes = userItem.querySelectorAll('.playlist-box');
                playlistBoxes.forEach((box) => {
                    box.addEventListener('click', async () => {
                        const playlistId = box.dataset.id;
                        await fetchAndDisplaySongsPanel(playlistId);
                    });
                });
            });
        }

        // Function to fetch and display songs in a playlist
        async function fetchAndDisplaySongsPanel(playlistId) {
            try {
                const response = await fetch(`/api/playlists/${playlistId}/songs`);
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                const songs = await response.json();
                displaySongsPanel(songs);
            } catch (error) {
                console.error('Error fetching songs:', error);
                alert('Failed to fetch songs. Please try again.');
            }
        }

        // Function to display songs in a panel
        function displaySongsPanel(songs) {
            const panel = document.createElement('div');
            panel.classList.add('songs-panel');
            panel.innerHTML = `
                <div class="songs-panel-content">
                    <span class="close-panel-button">&times;</span>
                    <h3>Songs in Playlist</h3>
                    <ul class="song-list">
                        ${songs
                            .map(
                                (song) => `
                                <li class="song-item" data-id="${song.id}" data-title="${song.name}" data-image="${song.image}" data-spotify-url="${song.spotifyUrl}">
                                    <img src="${song.image}" alt="${song.name}" class="song-image" />
                                    <div class="song-details">
                                        <p class="song-title"><strong>${song.name}</strong></p>
                                        <p class="song-artist">${song.artist || 'Unknown Artist'}</p>
                                    </div>
                                </li>
                            `
                            )
                            .join('')}
                    </ul>
                </div>
            `;
            document.body.appendChild(panel);
        
            // Close panel functionality
            const closeButton = panel.querySelector('.close-panel-button');
            closeButton.addEventListener('click', () => {
                panel.remove();
            });
        
            // Add right-click event listener to each song item
            const songItems = panel.querySelectorAll('.song-item');
            songItems.forEach((item) => {
                item.addEventListener('contextmenu', (event) => {
                    event.preventDefault(); // Prevent the default right-click menu
                    const songId = item.dataset.id;
                    const songTitle = item.dataset.title;
                    const songImage = item.dataset.image;
                    const spotifyUrl = item.dataset.spotifyUrl;
                    showSongContextMenu(event, songId, songTitle, songImage, spotifyUrl);
                });
            });
        }

        // Add the showSongContextMenu function here
        function showSongContextMenu(event, songId, songTitle, songImage, spotifyUrl) {
            // Create or reuse the context menu
            let contextMenu = document.getElementById('song-context-menu');
            if (!contextMenu) {
                contextMenu = document.createElement('div');
                contextMenu.id = 'song-context-menu';
                contextMenu.classList.add('context-menu');
                document.body.appendChild(contextMenu);
            }
        
            // Populate the context menu with options
            contextMenu.innerHTML = `
                <div class="context-menu-item" id="add-to-playlist">Add to Playlist</div>
                <div class="context-menu-item" id="view-on-spotify">View on Spotify</div>
            `;
        
            // Add event listener for "Add to Playlist"
            const addToPlaylistOption = contextMenu.querySelector('#add-to-playlist');
            addToPlaylistOption.addEventListener('mouseenter', async () => {
                try {
                    // Fetch playlists from the server
                    const response = await fetch('/api/playlists');
                    if (!response.ok) {
                        throw new Error(`Error: ${response.status} ${response.statusText}`);
                    }
                    const playlists = await response.json();
        
                    // Create or reuse the playlist dropdown
                    let playlistDropdown = document.getElementById('playlist-dropdown');
                    if (!playlistDropdown) {
                        playlistDropdown = document.createElement('div');
                        playlistDropdown.id = 'playlist-dropdown';
                        playlistDropdown.classList.add('context-menu');
                        document.body.appendChild(playlistDropdown);
                    }
        
                    // Populate the playlist dropdown
                    playlistDropdown.innerHTML = '';
                    playlists.forEach((playlist) => {
                        const playlistItem = document.createElement('div');
                        playlistItem.classList.add('context-menu-item');
                        playlistItem.textContent = playlist.name;
                        playlistItem.addEventListener('click', () => {
                            addToPlaylist(playlist.id, songTitle, songImage);
                            playlistDropdown.classList.remove('show'); // Hide the dropdown after selection
                        });
                        playlistDropdown.appendChild(playlistItem);
                    });
        
                    // Position and show the playlist dropdown
                    const rect = addToPlaylistOption.getBoundingClientRect();
                    playlistDropdown.style.left = `${rect.right}px`; // Align to the right of the context menu
                    playlistDropdown.style.top = `${rect.top}px`; // Align with the top of the context menu
                    playlistDropdown.classList.add('show');
                } catch (error) {
                    console.error('Error fetching playlists:', error);
                }
            });
        
            // Add event listener for "View on Spotify"
            const viewOnSpotifyOption = contextMenu.querySelector('#view-on-spotify');
            viewOnSpotifyOption.addEventListener('click', () => {
                if (!spotifyUrl) {
                    alert('Spotify link not available for this song.');
                    return;
                }
                window.open(spotifyUrl, '_blank'); // Open the Spotify link in a new tab
            });
        
            // Position and show the context menu
            contextMenu.style.left = `${event.clientX}px`;
            contextMenu.style.top = `${event.clientY}px`;
            contextMenu.classList.add('show');
        
            // Hide the context menu when clicking outside
            document.addEventListener('click', () => {
                contextMenu.classList.remove('show');
                const playlistDropdown = document.getElementById('playlist-dropdown');
                if (playlistDropdown) {
                    playlistDropdown.classList.remove('show');
                }
            });
        }

        // Function to add a song to a playlist
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
                alert(`Added "${songTitle}" to your playlist.`);
            } catch (error) {
                console.error('Error adding song to playlist:', error);
            }
        }
    }
});