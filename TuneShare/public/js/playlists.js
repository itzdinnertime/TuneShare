document.addEventListener('DOMContentLoaded', function () {
    const playlistList = document.getElementById('playlist-list');
    const playlistContextMenu = document.createElement('div');
    playlistContextMenu.id = 'playlist-context-menu';
    playlistContextMenu.classList.add('context-menu', 'hidden');
    playlistContextMenu.innerHTML = `
        <div class="context-menu-item" id="delete-playlist">Delete Playlist</div>
    `;
    document.body.appendChild(playlistContextMenu);

    let selectedPlaylistId = null;

    // Fetch and display playlists
    async function fetchPlaylists() {
        try {
            const response = await fetch('/api/playlists');
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            const playlists = await response.json();
            displayPlaylists(playlists);
        } catch (error) {
            console.error('Error fetching playlists:', error);
        }
    }

    // Display playlists
    function displayPlaylists(playlists) {
        playlistList.innerHTML = ''; // Clear existing playlists
        playlists.forEach((playlist) => {
            const playlistItem = document.createElement('div');
            playlistItem.classList.add('playlist-item');
            playlistItem.dataset.id = playlist.id;
            playlistItem.innerHTML = `
                <a href="/playlists/${playlist.id}" class="playlist-link">
                    <div class="playlist-details">
                        <h3 class="playlist-title">${playlist.name}</h3>
                        <p class="playlist-created">Created on ${playlist.createdAt}</p>
                    </div>
                </a>
            `;
            playlistList.appendChild(playlistItem);

            // Add right-click event listener for the playlist item
            playlistItem.addEventListener('contextmenu', (event) => {
                event.preventDefault(); // Prevent the default right-click menu
                selectedPlaylistId = playlist.id; // Store the selected playlist ID

                // Position the context menu
                const { clientX: mouseX, clientY: mouseY } = event;
                playlistContextMenu.style.left = `${mouseX}px`;
                playlistContextMenu.style.top = `${mouseY}px`;

                // Show the context menu
                playlistContextMenu.classList.add('show');
            });
        });
    }

    // Hide context menu when clicking outside
    document.addEventListener('click', () => {
        playlistContextMenu.classList.remove('show');
    });

    // Handle context menu actions
    playlistContextMenu.addEventListener('click', async (event) => {
        const action = event.target.id;

        if (!selectedPlaylistId) return;

        if (action === 'delete-playlist') {
            if (!confirm('Are you sure you want to delete this playlist?')) return;

            try {
                const response = await fetch(`/api/playlists/${selectedPlaylistId}`, {
                    method: 'DELETE',
                });
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                fetchPlaylists(); // Refresh the playlist list
            } catch (error) {
                console.error('Error deleting playlist:', error);
            }
        }

        playlistContextMenu.classList.remove('show'); // Hide the context menu after an action
    });

    // Initial fetch
    fetchPlaylists();
});