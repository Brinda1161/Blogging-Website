let currentUser = null;
let isAdmin = false;
const API_BASE = 'https://blogging-website-1-dzzg.onrender.com';
const BASE_PATH = '';

const submitBtn = document.querySelector("#submit");
const modal = document.getElementById("blogModal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const closeBtn = document.querySelector(".close-btn");
const logoutLink = document.getElementById("logoutLink");

async function fetchUserStatus() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/session`, {
            credentials: 'include'  // ✅ was missing before
        });
        const userData = await response.json();

        if (userData.authenticated && userData.user) {
            currentUser = {
                id: userData.user.id,
                name: userData.user.username,
                role: userData.user.role
            };
        } else {
            // Fallback to localStorage
            const stored = localStorage.getItem('user');
            if (stored) {
                const u = JSON.parse(stored);
                currentUser = { id: u.id, name: u.username, role: u.role };
            }
        }

        if (currentUser) {
            isAdmin = currentUser.role === 'admin';
            const adminLink = document.getElementById('adminLink');
            if (adminLink) adminLink.style.display = isAdmin ? 'inline-block' : 'none';
            document.getElementById('userWelcome').textContent = `Welcome, ${currentUser.name}!`;
            const loginLink = document.querySelector('a[href="/login"]');
            if (loginLink) loginLink.style.display = 'none';
            logoutLink.style.display = 'inline-block';
            return true;
        } else {
            document.getElementById('userWelcome').textContent = 'Welcome, Guest!';
            logoutLink.style.display = 'none';
            return false;
        }
    } catch {
        // Fallback to localStorage on network error
        const stored = localStorage.getItem('user');
        if (stored) {
            const u = JSON.parse(stored);
            currentUser = { id: u.id, name: u.username, role: u.role };
            isAdmin = currentUser.role === 'admin';
            document.getElementById('userWelcome').textContent = `Welcome, ${currentUser.name}!`;
            logoutLink.style.display = 'inline-block';
            return true;
        }
        document.getElementById('userWelcome').textContent = 'Welcome, Guest!';
        return false;
    }
}

async function handleReaction(blogId, reactionType) {
    if (!currentUser) {
        alert('Please log in to react to blogs');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/reactions/blogs/${blogId}/reaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ reaction: reactionType })
        });

        if (response.ok) {
            loadBlogs();
        }
    } catch (error) {
        console.error('Reaction error:', error);
    }
}

function createBlogElement(blog) {
    const store = document.createElement("div");
    store.setAttribute('data-blog-id', blog._id);

    const title = document.createElement("h4");
    const contentPreview = document.createElement("div");
    contentPreview.className = "content-preview";
    const readMore = document.createElement("a");
    readMore.className = "read-more";
    readMore.textContent = "Read more";

    title.textContent = blog.title;
    contentPreview.textContent = blog.content;

    store.appendChild(title);
    store.appendChild(contentPreview);
    store.appendChild(readMore);

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "blog-actions";

    const likeBtn = createReactionButton('like', blog);
    const dislikeBtn = createReactionButton('dislike', blog);
    
    likeBtn.onclick = () => handleReaction(blog._id, blog.userReaction === 'like' ? 'remove' : 'like');
    dislikeBtn.onclick = () => handleReaction(blog._id, blog.userReaction === 'dislike' ? 'remove' : 'dislike');

    actionsDiv.appendChild(likeBtn);
    actionsDiv.appendChild(dislikeBtn);

    if (isAdmin || (currentUser && currentUser.id === blog.authorId)) {
        actionsDiv.appendChild(createDeleteButton(blog));
    }

    store.appendChild(actionsDiv);

    const authorInfo = document.createElement("div");
    authorInfo.className = "author-info";
    authorInfo.textContent = `By ${blog.author} on ${new Date(blog.createdAt).toLocaleDateString()}`;
    store.appendChild(authorInfo);

    readMore.addEventListener("click", () => {
        modalTitle.textContent = blog.title;
        modalBody.textContent = blog.content;
        modal.style.display = "flex";
    });

    return store;
}

function createReactionButton(type, blog) {
    const button = document.createElement("button");
    button.className = `btn-${type}`;
    if (blog.userReaction === type) button.classList.add('active');
    button.setAttribute('data-blog-id', blog._id);
    
    const icon = type === 'like' ? '👍' : '👎';
    const count = type === 'like' ? blog.likes || 0 : blog.dislikes || 0;
    
    button.innerHTML = `<span>${icon}</span> <span class="reaction-count">${count}</span>`;
    return button;
}

function createDeleteButton(blog) {
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-delete";
    deleteBtn.textContent = isAdmin ? "Delete (Admin)" : "Delete";

    deleteBtn.onclick = async () => {
        if (confirm(`Delete "${blog.title}"?`)) {
            try {
                const response = await fetch(`${API_BASE}/api/blogs/${blog._id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (response.ok) {
                    loadBlogs();
                }
            } catch (error) {
                console.error('Delete error:', error);
            }
        }
    };
    return deleteBtn;
}

async function loadBlogs() {
    const container = document.getElementById("container");
    container.innerHTML = 'Loading...';

    try {
        await fetchUserStatus();
        
        if (!currentUser && window.location.pathname.includes('dashboard')) {
            container.innerHTML = `<p>Please <a href="${BASE_PATH}/login.html">log in</a> to view dashboard.</p>`;
            return;
        }
        
        const apiUrl = window.location.pathname.includes('dashboard') 
            ? `${API_BASE}/api/blogs/my-blogs` 
            : `${API_BASE}/api/blogs`;
        
        const response = await fetch(apiUrl, { credentials: 'include' });
        
        if (response.status === 401) {
            container.innerHTML = `<p>Session expired. <a href="${BASE_PATH}/login.html">Log in again</a>.</p>`;
            return;
        }
        
        const blogs = await response.json();
        container.innerHTML = '';
        
        if (!blogs?.length) {
            container.innerHTML = `<p>${window.location.pathname.includes('dashboard') 
                ? 'No blogs yet. Create your first blog!' 
                : 'No blogs available.'}</p>`;
            return;
        }
        
        blogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        blogs.forEach(blog => container.appendChild(createBlogElement(blog)));
        
    } catch (error) {
        console.error("Failed to load blogs:", error);
        container.innerHTML = `<p>Failed to load blogs. <button onclick="loadBlogs()">Retry</button></p>`;
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
        localStorage.removeItem('user');
        window.location.href = `${BASE_PATH}/login.html`;
    } catch (error) {
        console.error('Logout error:', error);
    }
}

submitBtn.addEventListener("click", async () => {
    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("desc").value.trim();

    if (!title || !content) {
        alert("Please fill in both fields");
        return;
    }

    if (!currentUser) {
        alert("Please log in to publish a blog");
        window.location.href = `${BASE_PATH}/login.html`;
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/blogs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ title, content })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            if (response.status === 401) {
                alert("Session expired. Please log in again.");
                window.location.href = `${BASE_PATH}/login.html`;
                return;
            }
            
            alert(`Failed to publish blog: ${errorData.error || 'Unknown error'}`);
            return;
        }
        
        document.getElementById("title").value = "";
        document.getElementById("desc").value = "";
        alert("Blog published successfully!");
        loadBlogs();
        
    } catch (error) {
        console.error('Create blog error:', error);
        alert("Network error. Check console for details.");
    }
});

closeBtn.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    handleLogout();
});

document.addEventListener('DOMContentLoaded', loadBlogs);
