// Global arrays to hold fetched data
let allBlogs = [];
let allUsers = [];
let currentUser = null;

// DOM elements
const blogsContainer = document.getElementById('blogs-container');
const usersContainer = document.getElementById('users-container');
const userWelcome = document.getElementById('userWelcome');
const logoutLink = document.getElementById('logoutLink');
const modal = document.getElementById('blogModal');
const closeBtn = document.querySelector('.close-btn');

// Check admin authentication and load data
async function initializeAdminPanel() {
    try {
        // Check user session
        const sessionResponse = await fetch('/api/auth/session', {
            credentials: 'include'
        });
        
        if (!sessionResponse.ok) {
            throw new Error('Not authenticated');
        }
        
        const sessionData = await sessionResponse.json();
        
        if (!sessionData.authenticated || sessionData.user.role !== 'admin') {
            window.location.href = '/login';
            return;
        }
        
        currentUser = sessionData.user;
        userWelcome.textContent = `Welcome, ${currentUser.name || currentUser.username}!`;
        
        // Load blogs and users
        await Promise.all([loadBlogs(), loadUsers()]);
        
    } catch (error) {
        console.error('Admin panel initialization error:', error);
        blogsContainer.innerHTML = '<div class="error-message">Access denied. Please log in as an administrator.</div>';
        usersContainer.innerHTML = '<div class="error-message">Access denied.</div>';
        
        // Redirect to login after a delay
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
    }
}

// Function to open Modal and read full blog content
function readBlog(blogId) {
    const blog = allBlogs.find(b => b._id === blogId || b.id === blogId);
    
    if (!blog) {
        alert('Blog content not found!');
        return;
    }

    document.getElementById('modalTitle').textContent = blog.title;
    document.getElementById('modalAuthor').textContent = `By: ${blog.author} (${new Date(blog.createdAt).toLocaleString()})`;
    document.getElementById('modalBody').textContent = blog.content;
    modal.style.display = 'flex';
}

// Function to load and display all blogs
async function loadBlogs() {
    try {
        blogsContainer.innerHTML = '<div class="loading">Loading blogs...</div>';
        
        const response = await fetch('/api/blogs', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Access denied. Admin privileges required.');
            }
            throw new Error('Failed to load blogs');
        }
        
        allBlogs = await response.json();
        
        if (allBlogs.length === 0) {
            blogsContainer.innerHTML = '<div class="loading">No blogs found.</div>';
            return;
        }

        // Sort blogs by creation date (newest first)
        allBlogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Created</th>
                        <th>Likes</th> 
                        <th>Dislikes</th> 
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        allBlogs.forEach(blog => {
            const blogId = blog._id || blog.id;
            const likes = blog.likes || 0;
            const dislikes = blog.dislikes || 0;

            html += `
                <tr>
                    <td>${blog.title}</td>
                    <td>${blog.author}</td>
                    <td>${new Date(blog.createdAt).toLocaleString()}</td>
                    <td>👍 ${likes}</td> 
                    <td>👎 ${dislikes}</td> 
                    <td>
                        <button class="btn-read" onclick="readBlog('${blogId}')">Read</button>
                        <button class="btn-delete" onclick="deleteBlog('${blogId}')">Delete</button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        blogsContainer.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading blogs:', error);
        blogsContainer.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

// Function to load and display all users
async function loadUsers() {
    try {
        usersContainer.innerHTML = '<div class="loading">Loading users...</div>';
        
        const response = await fetch('/api/users', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Access denied. Admin privileges required.');
            }
            throw new Error('Failed to load users');
        }
        
        allUsers = await response.json();
        
        if (allUsers.length === 0) {
            usersContainer.innerHTML = '<div class="loading">No users found.</div>';
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        allUsers.forEach(user => {
            const isCurrentUser = currentUser && user.id === currentUser.id;
            
            html += `
                <tr>
                    <td>${user.username}</td>
                    <td>${user.role}</td>
                    <td>${new Date(user.createdAt).toLocaleString()}</td>
                    <td>
                        <button class="btn-delete-user" 
                                onclick="deleteUser('${user.id}')"
                                ${isCurrentUser ? 'disabled' : ''}>
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        usersContainer.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading users:', error);
        usersContainer.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

// Function to delete a blog post
async function deleteBlog(blogId) {
    if (!confirm('Are you sure you want to delete this blog?')) {
        return;
    }

    try {
        const response = await fetch(`/api/blogs/${blogId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.success) {
            await loadBlogs(); // Reload the blogs list
            showMessage('Blog deleted successfully.', 'success');
        } else {
            throw new Error(data.error || 'Failed to delete blog');
        }
    } catch (error) {
        console.error('Error deleting blog:', error);
        showMessage(error.message, 'error');
    }
}

// Function to delete a user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? All their blogs will also be deleted.')) {
        return;
    }

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.success) {
            await loadUsers(); // Reload the users list
            await loadBlogs(); // Reload blogs as some might have been deleted
            showMessage('User deleted successfully.', 'success');
        } else {
            throw new Error(data.error || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showMessage(error.message, 'error');
    }
}

// Function to show messages
function showMessage(message, type = 'error') {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;
    
    document.querySelector('.container').insertBefore(messageDiv, document.querySelector('.section'));
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

// Logout handler
async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            window.location.href = '/login';
        } else {
            alert('Error logging out');
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out');
    }
}

// Event listeners
closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
});

// Initialize the admin panel when the page loads
document.addEventListener('DOMContentLoaded', initializeAdminPanel);