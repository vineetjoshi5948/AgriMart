// shell.js — Retailer dashboard shell (shared across all retailer pages)

function clearAuth() {
  localStorage.removeItem('agriAuthToken');
}

function getAuthForShell() {
  try {
    return JSON.parse(localStorage.getItem('agriAuthToken'));
  } catch {
    return null;
  }
}

function dashboardShell(activePage, title, subtitle, content) {
  const auth = getAuthForShell();
  const userName = auth?.user?.name || 'Retailer';
  const initials = userName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  return `
    <div class="overlay"></div>
    <div class="app">
      <aside class="sidebar">
        <a class="brand" href="dashboard.html">
          <span class="brand-mark">AR</span>
          <span class="brand-text"><strong>AgriRetail</strong><span>Retailer marketplace</span></span>
        </a>
        <nav class="nav" aria-label="Main navigation">
          <a class="nav-link" data-nav="dashboard" href="dashboard.html">
            <span class="nav-icon">⊞</span> Dashboard
          </a>
          <a class="nav-link" data-nav="marketplace" href="marketplace.html">
            <span class="nav-icon">🛒</span> Marketplace
          </a>
          <a class="nav-link" data-nav="cart" href="cart.html">
            <span class="nav-icon">🧺</span> Cart <span class="pill" id="cartCount">0</span>
          </a>
          <a class="nav-link" data-nav="checkout" href="checkout.html">
            <span class="nav-icon">✅</span> Checkout
          </a>
          <a class="nav-link" data-nav="orders" href="orders.html">
            <span class="nav-icon">📦</span> Orders
          </a>
          <a class="nav-link" data-nav="profile" href="profile.html">
            <span class="nav-icon">👤</span> Profile
          </a>
        </nav>

        <div class="sidebar-footer">
          <a class="nav-link logout-link" href="#" id="sidebarLogout">
            <span class="nav-icon">🚪</span> Logout
          </a>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <button class="hamburger" aria-label="Open menu">☰</button>
          <label class="search">
            <span>🔍</span>
            <input id="globalSearch" type="search" placeholder="Search farmers, orders, products">
          </label>
          <div class="top-actions">
            <button class="icon-btn" id="themeToggle" aria-label="Toggle dark mode" title="Toggle dark mode">🌙</button>
            <div class="notification-wrap">
              <button class="icon-btn" id="notificationBtn" aria-label="Notifications">
                🔔<span class="badge">3</span>
              </button>
              <div class="notification-menu" id="notificationMenu">
                <div class="notification-item"><strong>Mango stock updated</strong><span>Sai Orchard added 45 kg.</span></div>
                <div class="notification-item"><strong>Cash pickup pending</strong><span>2 orders need confirmation.</span></div>
                <div class="notification-item"><strong>Order delivered</strong><span>Your order has been delivered.</span></div>
              </div>
            </div>
            <a class="profile-chip" href="profile.html">
              <span class="avatar" id="shellAvatar">${initials}</span>
              <span id="shellUserName">${userName}</span>
            </a>
          </div>
        </header>
        <section class="content fade-in">
          <div class="page-head">
            <div>
              <p class="eyebrow">${activePage}</p>
              <h1>${title}</h1>
              <p class="subtitle">${subtitle}</p>
            </div>
          </div>
          ${content}
        </section>
      </main>
    </div>
    <div class="toast"></div>`;
}
