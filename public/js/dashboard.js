// --- Dynamic Blog Data and User Data ---//
let blogs = [];
let currentUser = null;
let isAdmin = false;

const API_BASE = window.location.origin; // Use relative path for same origin

const submitBtn = document.querySelector("#submit");
const modal = document.getElementById("blogModal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const closeBtn = document.querySelector(".close-btn");
const logoutLink = document.getElementById("logoutLink");

async function fetchUserStatus() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/session`);
        const userData = await response.json();

        if (userData.authenticated && userData.user) {
            currentUser = {
                id: userData.user.id,
                name: userData.user.username,
                role: userData.user.role
            };
            isAdmin = currentUser.role === 'admin';

            const adminLink = document.getElementById('adminLink');
            if (isAdmin) {
                adminLink.style.display = 'inline-block';
            }

            document.getElementById('userWelcome').textContent = `Welcome, ${currentUser.name}!`;
            
            // Show logout link, hide login link
            document.querySelector('a[href="/login"]').style.display = 'none';
            logoutLink.style.display = 'inline-block';
            
            return true;
        } else {
            document.getElementById('userWelcome').textContent = 'Welcome, Guest!';
            // Show login link, hide logout link
            document.querySelector('a[href="/login"]').style.display = 'inline-block';
            logoutLink.style.display = 'none';
            return false;
        }
    } catch (error) {
        console.error('Error fetching user status:', error);
        document.getElementById('userWelcome').textContent = 'Welcome, Guest (Error)!';
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
            const result = await response.json();
            updateBlogReactionUI(blogId, result.likes, result.dislikes, result.userReaction);
            await loadBlogs(); // Reload to get updated data
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.error || 'Failed to update reaction'}`);
        }
    } catch (error) {
        console.error('Network Error:', error);
        alert('An error occurred while updating reaction.');
    }
}

function updateBlogReactionUI(blogId, likes, dislikes, userReaction) {
    const blogElement = document.querySelector(`[data-blog-id="${blogId}"]`);
    if (!blogElement) return;

    const likeBtn = blogElement.querySelector('.btn-like');
    const dislikeBtn = blogElement.querySelector('.btn-dislike');
    const likeCount = blogElement.querySelector('.btn-like .reaction-count');
    const dislikeCount = blogElement.querySelector('.btn-dislike .reaction-count');

    if (likeCount) likeCount.textContent = likes;
    if (dislikeCount) dislikeCount.textContent = dislikes;

    likeBtn.classList.remove('active');
    dislikeBtn.classList.remove('active');

    if (userReaction === 'like') likeBtn.classList.add('active');
    else if (userReaction === 'dislike') dislikeBtn.classList.add('active');
}

function addBlogs(blog) {
    let store = document.createElement("div");
    store.setAttribute('data-blog-id', blog._id || blog.id);

    let t = document.createElement("h4");
    let u = document.createElement("div");
    u.className = "content-preview";
    let readMore = document.createElement("a");
    readMore.className = "read-more";
    readMore.textContent = "Read more";

    t.textContent = blog.title;
    u.textContent = blog.content;

    store.appendChild(t);
    store.appendChild(u);
    store.appendChild(readMore);

    let actionsDiv = document.createElement("div");
    actionsDiv.className = "blog-actions";

    // Like button
    let likeBtn = document.createElement("button");
    likeBtn.className = `btn-like ${blog.userReaction === 'like' ? 'active' : ''}`;
    likeBtn.setAttribute('data-blog-id', blog._id || blog.id);
    likeBtn.innerHTML = `<span>👍</span> <span class="reaction-count">${blog.likes || 0}</span>`;

    // Dislike button
    let dislikeBtn = document.createElement("button");
    dislikeBtn.className = `btn-dislike ${blog.userReaction === 'dislike' ? 'active' : ''}`;
    dislikeBtn.setAttribute('data-blog-id', blog._id || blog.id);
    dislikeBtn.innerHTML = `<span>👎</span> <span class="reaction-count">${blog.dislikes || 0}</span>`;

    likeBtn.onclick = () => {
        const currentReaction = blog.userReaction;
        const newReaction = currentReaction === 'like' ? 'remove' : 'like';
        handleReaction(blog._id || blog.id, newReaction);
    };

    dislikeBtn.onclick = () => {
        const currentReaction = blog.userReaction;
        const newReaction = currentReaction === 'dislike' ? 'remove' : 'dislike';
        handleReaction(blog._id || blog.id, newReaction);
    };

    actionsDiv.appendChild(likeBtn);
    actionsDiv.appendChild(dislikeBtn);

    // Delete button for admin or blog owner
    if (isAdmin || (currentUser && currentUser.id === blog.authorId)) {
        let deleteBtn = document.createElement("button");
        deleteBtn.className = "btn-delete";
        deleteBtn.textContent = isAdmin ? "Delete (Admin)" : "Delete";

        deleteBtn.onclick = async () => {
            if (confirm(`Are you sure you want to delete "${blog.title}"?`)) {
                try {
                    const response = await fetch(`${API_BASE}/api/blogs/${blog._id || blog.id}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });

                    if (response.ok) {
                        alert(`Blog "${blog.title}" deleted successfully.`);
                        loadBlogs();
                    } else if (response.status === 403) {
                        alert("Access Denied. You can only delete your own blogs.");
                    } else {
                        const errorData = await response.json();
                        alert(`Error deleting blog: ${errorData.error || response.statusText}`);
                    }
                } catch (error) {
                    console.error('Network Error:', error);
                    alert('An error occurred while communicating with the server.');
                }
            }
        };
        actionsDiv.appendChild(deleteBtn);
    }

    store.appendChild(actionsDiv);

    let authorInfo = document.createElement("div");
    authorInfo.className = "author-info";
    authorInfo.textContent = `By ${blog.author} on ${new Date(blog.createdAt).toLocaleDateString()} at ${new Date(blog.createdAt).toLocaleTimeString()}`;
    store.appendChild(authorInfo);

    document.querySelector("#container").appendChild(store);

    readMore.addEventListener("click", () => {
        modalTitle.textContent = blog.title;
        modalBody.textContent = blog.content;
        modal.style.display = "flex";
    });
}

async function loadBlogs() {
    const container = document.getElementById("container");
    container.innerHTML = '';

    if (!currentUser) await fetchUserStatus();
    if (!currentUser) {
        container.innerHTML = '<p class="no-blogs-message">Please log in to view your dashboard.</p>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/blogs/my-blogs`, {
            credentials: 'include',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                container.innerHTML = '<p class="no-blogs-message">Please log in to view your dashboard.</p>';
                return;
            }
            throw new Error('Failed to fetch blogs');
        }
        
        const blogs = await response.json();

        if (blogs.length === 0) {
            container.innerHTML = '<p class="no-blogs-message">No blogs yet. Create your first blog!</p>';
            return;
        }

        // Display blogs in reverse chronological order (newest first)
        [...blogs].reverse().forEach(addBlogs);
    } catch (error) {
        console.error("Failed to load blogs:", error);
        container.innerHTML = '<p class="error-message">Failed to load blogs from server.</p>';
        return;
    }
}

async function handleLogout() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/logout`, {
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

submitBtn.addEventListener("click", async () => {
    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("desc").value.trim();

    if (!title || !content) {
        alert("Please fill in both title and content");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/blogs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ title, content })
        });

        if (response.ok) {
            document.getElementById("title").value = "";
            document.getElementById("desc").value = "";
            await loadBlogs();
            alert('Blog created successfully!');
        } else if (response.status === 401) {
            alert('Please log in to create a blog');
            window.location.href = '/login';
        } else {
            const errorData = await response.json();
            alert(`Error creating blog: ${errorData.error || response.statusText}`);
        }
    } catch (error) {
        console.error('Network Error:', error);
        alert('An error occurred while publishing the blog.');
    }
});

// Event Listeners
closeBtn.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    handleLogout();
});

async function initialSetup() {
    await fetchUserStatus();
    await loadBlogs();
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', initialSetup);