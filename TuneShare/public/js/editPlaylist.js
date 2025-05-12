document.addEventListener('DOMContentLoaded', function () {
    const songList = document.getElementById('song-list');
    const dropbox1 = document.getElementById('dropbox1');
    let selectedSongId = null;

    // Show context menu on right-click
    songList.addEventListener('contextmenu', (event) => {
        event.preventDefault(); // Prevent the default right-click menu

        const songItem = event.target.closest('.song-item');
        if (!songItem) return;

        selectedSongId = songItem.dataset.id; // Store the selected song ID

        // Position the context menu
        const { clientX: mouseX, clientY: mouseY } = event;
        dropbox1.style.left = `${mouseX}px`;
        dropbox1.style.top = `${mouseY}px`;

        // Show the context menu
        dropbox1.classList.add('show');
    });

    // Hide context menu when clicking outside
    document.addEventListener('click', () => {
        dropbox1.classList.remove('show');
    });

    // Handle context menu actions
    dropbox1.addEventListener('click', async (event) => {
        const action = event.target.id;

        if (!selectedSongId) return;

        if (action === 'delete-song') {
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
        }

        dropbox1.classList.remove('show'); // Hide the context menu after an action
    });
});