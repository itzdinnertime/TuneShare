document.addEventListener('DOMContentLoaded', function () {
    const dropbox1 = document.getElementById('dropbox1');
    let selectedPlaylistId = null;

    // Show context menu on right-click
    document.addEventListener('contextmenu', (event) => {
        event.preventDefault(); // Prevent the default right-click menu

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

        if (action === 'delete-playlist') {
            if (!confirm('Are you sure you want to delete this playlist?')) return;

            try {
                const response = await fetch(`/api/playlists/${selectedPlaylistId}`, {
                    method: 'DELETE',
                });
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                location.reload(); // Reload the page to reflect the changes
            } catch (error) {
                console.error('Error deleting playlist:', error);
            }
        }

        dropbox1.classList.remove('show'); // Hide the context menu after an action
    });
});