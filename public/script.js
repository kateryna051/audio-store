document.addEventListener('DOMContentLoaded', async () => {
    const userList = document.getElementById('userList');

    try {
        const response = await fetch('/api/allusers');
        const data = await response.json();

        if (data.status === 'success') {
            data.data.users.forEach(user => {
                const listItem = document.createElement('li');
                listItem.textContent =  user.email;
                listItem.classList.add('user-item');
                listItem.addEventListener('click', async () => {
                    await showFilesForUser(user, listItem);
                });
                userList.appendChild(listItem);
            });
        } else {
            console.error('Failed to fetch users:', data);
        }
    } catch (error) {
        console.error('Error fetching users:', error);
    }

    async function showFilesForUser(user, listItem) {
        try {
            const response = await fetch(`/api/user/${user._id}/files`);
            const data = await response.json();

            if (data.status === 'success') {
                const existingFiles = listItem.nextElementSibling;
                if (existingFiles && existingFiles.classList.contains('file-list')) {
                    existingFiles.remove();
                } else {
                    const fileList = document.createElement('ul');
                    fileList.classList.add('file-list');
                    listItem.insertAdjacentElement('afterend', fileList);

                    data.data.files.forEach(file => {
                        const fileItem = document.createElement('li');
                        fileItem.textContent = file.originalname;
                        fileList.appendChild(fileItem);
                    });
                }
            } else {
                console.error('Failed to fetch files for user:', data);
            }
        } catch (error) {
            console.error('Error fetching files for user:', error);
        }
    }
});
