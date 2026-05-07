let currentUser = null;
let editingBlogId = null;
const API_BASE = 'https://blogging-website-1-dzzg.onrender.com';
const BASE_PATH = '';

function getAuthHeaders() {
    const stored = localStorage.getItem('user');
    if (stored) {
        const u = JSON.parse(stored);
        return {
            'Content-Type': 'application/json',
            'x-user-id': u.id,
            'x-username': u.username,
            'x-user-role': u.role
        };
    }
    return { 'Content-Type': 'application/json' };
}

async function initializeDashboard() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/session`, { credentials: 'include' });
        const sessionData = await response.json();

        let user = sessionData.authenticated ? sessionData.user : null;
        if (!user) {
            const stored = localStorage.getItem('user');
            if (stored) user = JSON.parse(stored);
        }

        if (!user) {
            window.location.href = `${BASE_PATH}/login.html`;
            return;
        }

        currentUser = user;
        document.getElementById('userInfo').textContent = `Welcome, ${currentUser.username}`;
        await loadMyBlogs();
    } catch {
        const stored = localStorage.getItem('user');
        if (stored) {
            currentUser = JSON.parse(stored);
            document.getElementById('userInfo').textContent = `Welcome, ${currentUser.username}`;
            await loadMyBlogs();
            return;
        }
        window.location.href = `${BASE_PATH}/login.html`;
    }
}

document.getElementById('blogForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();

    if (!title || !content) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    try {
        const url = editingBlogId ? `${API_BASE}/api/blogs/${editingBlogId}` : `${API_BASE}/api/blogs`;
        const method = editingBlogId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({ title, content })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(editingBlogId ? 'Blog updated successfully!' : 'Blog created successfully!', 'success');
            document.getElementById('blogForm').reset();
            editingBlogId = null;
            document.querySelector('button[type="submit"]').textContent = 'Create Blog';
            document.getElementById('form-title').textContent = 'Create New Blog';
            document.getElementById('cancel-edit').style.display = 'none';
            await loadMyBlogs();
        } else {
            showMessage(data.error || 'An error occurred', 'error');
        }
    } catch (error) {
        console.error('Error submitting blog:', error);
        showMessage('Failed to save blog. Please try again.', 'error');
    }
});

document.getElementById('cancel-edit').addEventListener('click', function() {
    editingBlogId = null;
    document.getElementById('blogForm').reset();
    document.querySelector('button[type="submit"]').textContent = 'Create Blog';
    document.getElementById('form-title').textContent = 'Create New Blog';
    this.style.display = 'none';
});

async function loadMyBlogs() {
    try {
        const response = await fetch(`${API_BASE}/api/blogs/my-blogs`, {
            credentials: 'include',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch blogs');

        const myBlogs = await response.json();
        const container = document.getElementById('blogs-container');

        if (myBlogs.length === 0) {
            container.innerHTML = '<div>You have no blogs yet. Create your first blog above!</div>';
            return;
        }

        myBlogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        container.innerHTML = myBlogs.map(blog => `
            <div class="blog-item" id="blog-${blog._id || blog.id}">
                <h4>${escapeHtml(blog.title)}</h4>
                <p>${escapeHtml(blog.content.substring(0, 200))}${blog.content.length > 200 ? '...' : ''}</p>
                <small>Created: ${new Date(blog.createdAt).toLocaleString()}</small>
                <div class="blog-actions">
                    <button class="btn btn-edit" onclick="editBlog('${blog._id || blog.id}')">Edit</button>
                    <button class="btn btn-delete" onclick="deleteBlog('${blog._id || blog.id}')">Delete</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading blogs:', error);
        document.getElementById('blogs-container').innerHTML =
            '<div class="error-message">Failed to load blogs. Please try again.</div>';
    }
}

async function editBlog(blogId) {
    try {
        const response = await fetch(`${API_BASE}/api/blogs/my-blogs`, {
            credentials: 'include',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch blogs');

        const blogs = await response.json();
        const blog = blogs.find(b => (b._id === blogId || b.id === blogId));

        if (blog) {
            document.getElementById('title').value = blog.title;
            document.getElementById('content').value = blog.content;
            editingBlogId = blogId;
            document.querySelector('button[type="submit"]').textContent = 'Update Blog';
            document.getElementById('form-title').textContent = 'Edit Blog';
            document.getElementById('cancel-edit').style.display = 'inline-block';
            document.querySelector('.blog-form').scrollIntoView({ behavior: 'smooth' });
        } else {
            showMessage('Blog not found', 'error');
        }
    } catch (error) {
        console.error('Error fetching blog for editing:', error);
        showMessage('Failed to load blog for editing', 'error');
    }
}

async function deleteBlog(blogId) {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
        const response = await fetch(`${API_BASE}/api/blogs/${blogId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showMessage('Blog deleted successfully!', 'success');
            await loadMyBlogs();
        } else {
            const data = await response.json();
            showMessage(data.error || 'Failed to delete blog', 'error');
        }
    } catch (error) {
        console.error('Error deleting blog:', error);
        showMessage('Failed to delete blog. Please try again.', 'error');
    }
}

function showMessage(message, type) {
    const messageContainer = document.getElementById('message-container');
    if (!messageContainer) return;
    messageContainer.innerHTML = message ? `<div class="${type}-message">${message}</div>` : '';
    if (type === 'success') {
        setTimeout(() => { messageContainer.innerHTML = ''; }, 3000);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
        localStorage.removeItem('user');
        window.location.href = `${BASE_PATH}/index.html`;
    } catch {
        console.error('Logout error');
    }
}

document.getElementById('logoutLink').addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
});

document.addEventListener('DOMContentLoaded', initializeDashboard);
