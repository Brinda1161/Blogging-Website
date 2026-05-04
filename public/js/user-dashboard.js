let currentUser = null;
let editingBlogId = null;
const API_BASE = 'https://blogging-website-2-pin2.onrender.com';
const BASE_PATH = '';

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
            localStorage.removeItem('user');
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

    if (!title || !content) return;

    try {
        const url = editingBlogId ? `${API_BASE}/api/blogs/${editingBlogId}` : `${API_BASE}/api/blogs`;
        const method = editingBlogId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ title, content })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            document.getElementById('blogForm').reset();
            editingBlogId = null;
            document.querySelector('button[type="submit"]').textContent = 'Create Blog';
            document.getElementById('form-title').textContent = 'Create New Blog';
            document.getElementById('cancel-edit').style.display = 'none';
            await loadMyBlogs();
        }
    } catch {
        console.error('Error submitting blog');
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
        const response = await fetch(`${API_BASE}/api/blogs/my-blogs`, { credentials: 'include' });
        const myBlogs = await response.json();
        const container = document.getElementById('blogs-container');
        
        if (myBlogs.length === 0) {
            container.innerHTML = '<div>You have no blogs yet. Create your first blog above!</div>';
            return;
        }

        myBlogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        container.innerHTML = myBlogs.map(blog => {
            const blogId = blog._id || blog.id;
            const contentPreview = blog.content.substring(0, 200) + (blog.content.length > 200 ? '...' : '');
            
            return `
                <div class="blog-item" data-blog-id="${blogId}" id="blog-${blogId}">
                    <h4>${blog.title}</h4>
                    <p>${contentPreview}</p>
                    <small>Created: ${new Date(blog.createdAt).toLocaleString()}</small>
                    <div class="blog-actions">
                        <button class="btn btn-edit" data-action="edit" data-blog-id="${blogId}">Edit</button>
                        <button class="btn btn-delete" data-action="delete" data-blog-id="${blogId}">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
        
        setupEventDelegation();
    } catch {
        console.error('Error loading blogs');
    }
}

function setupEventDelegation() {
    const container = document.getElementById('blogs-container');
    
    container.addEventListener('click', (e) => {
        if (e.target.matches('[data-action="delete"]')) {
            deleteBlog(e.target.dataset.blogId);
        }
        
        if (e.target.matches('[data-action="edit"]')) {
            editBlog(e.target.dataset.blogId);
        }
    });
}

async function editBlog(blogId) {
    try {
        const response = await fetch(`${API_BASE}/api/blogs/${blogId}`, { credentials: 'include' });
        const blog = await response.json();
        
        if (blog) {
            document.getElementById('title').value = blog.title;
            document.getElementById('content').value = blog.content;
            editingBlogId = blogId;
            document.querySelector('button[type="submit"]').textContent = 'Update Blog';
            document.getElementById('form-title').textContent = 'Edit Blog';
            document.getElementById('cancel-edit').style.display = 'inline-block';
            document.querySelector('.blog-form').scrollIntoView({ behavior: 'smooth' });
        }
    } catch {
        console.error('Error fetching blog for editing');
    }
}

async function deleteBlog(blogId) {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
        await fetch(`${API_BASE}/api/blogs/${blogId}`, { 
            method: 'DELETE',
            credentials: 'include'
        });
        await loadMyBlogs();
    } catch {
        console.error('Error deleting blog');
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
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
