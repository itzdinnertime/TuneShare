document.addEventListener('DOMContentLoaded', function () {
    const songList = document.getElementById('song-list');
    const songContextMenu = document.createElement('div');
    songContextMenu.id = 'song-context-menu';
    songContextMenu.classList.add('context-menu', 'hidden');
    songContextMenu.innerHTML = `
        <div class="context-menu-item" id="delete-song">Delete Song</div>
        <div class="context-menu-item" id="view-on-spotify">View on Spotify</div>
    `;
    document.body.appendChild(songContextMenu);

    let selectedSongId = null;
    let selectedSpotifyUrl = null;

    // Show context menu on right-click
    songList.addEventListener('contextmenu', (event) => {
        event.preventDefault(); // Prevent the default right-click menu

        const songItem = event.target.closest('.song-item');
        if (!songItem) return;

        selectedSongId = songItem.dataset.id; // Store the selected song ID
        selectedSpotifyUrl = songItem.dataset.spotifyUrl; // Store the Spotify URL

        // Position the context menu
        const { clientX: mouseX, clientY: mouseY } = event;
        songContextMenu.style.left = `${mouseX}px`;
        songContextMenu.style.top = `${mouseY}px`;

        // Show the context menu
        songContextMenu.classList.add('show');
    });

    // Hide context menu when clicking outside
    document.addEventListener('click', () => {
        songContextMenu.classList.remove('show');
    });

    // Handle context menu actions
    songContextMenu.addEventListener('click', async (event) => {
        const action = event.target.id;

        if (action === 'delete-song') {
            if (!selectedSongId) return;

            if (!confirm('Are you sure you want to delete this song?')) return;

            try {
                const response = await fetch(`/api/playlists/${playlistId}/songs/${selectedSongId}`, {
                    method: 'DELETE',
                });
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                location.reload(); // Reload the page to reflect the changes
            } catch (error) {
                console.error('Error deleting song:', error);
            }
        } else if (action === 'view-on-spotify') {
            if (!selectedSpotifyUrl) {
                alert('Spotify link not available for this song.');
                return;
            }
            window.open(selectedSpotifyUrl, '_blank'); // Open the Spotify link in a new tab
        }

        songContextMenu.classList.remove('show'); // Hide the context menu after an action
    });
});