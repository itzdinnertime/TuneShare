document.addEventListener('DOMContentLoaded', function () {
    const userRows = document.querySelectorAll('.user-row');
    const dropbox1 = document.getElementById('dropbox1');
    let selectedUserId = null;

    // Show context menu on right-click
    userRows.forEach((row) => {
        row.addEventListener('contextmenu', (event) => {
            event.preventDefault(); // Prevent the default right-click menu

            selectedUserId = row.dataset.id; // Store the selected user ID
            
            // Position the context menu
            const { clientX: mouseX, clientY: mouseY } = event;
            dropbox1.style.left = `${mouseX}px`;
            dropbox1.style.top = `${mouseY}px`;

            // Show the context menu
            dropbox1.classList.add('show');
        });
    });

    // Hide context menu when clicking outside
    document.addEventListener('click', () => {
        dropbox1.classList.remove('show');
    });

    // Handle context menu actions
    dropbox1.addEventListener('click', async (event) => {
        const action = event.target.id;

        if (action === 'delete-user') {
            if (!selectedUserId) {
                alert('No user selected.');
                return;
            }

            if (!confirm('Are you sure you want to delete this user?')) return;

            try {
                const response = await fetch('/settings/delete-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: selectedUserId }),
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                alert('User deleted successfully.');
                location.reload(); // Reload the page to reflect the changes
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Failed to delete user. Please try again.');
            }
        }

        dropbox1.classList.remove('show'); // Hide the context menu after an action
    });
});