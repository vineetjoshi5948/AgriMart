// ── NAVIGATION ────────────────────────────────────────────
function goTo(pageId){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+pageId)?.classList.add('active');
  document.querySelectorAll('#sidebar .side-menu li').forEach(li=>{
    li.classList.toggle('active', li.dataset.page===pageId);
  });
}

document.querySelectorAll('#sidebar .side-menu li').forEach(li=>{
  li.addEventListener('click',e=>{
    e.preventDefault();
    if(li.dataset.page) goTo(li.dataset.page);
  });
});
// ── NAVIGATION ────────────────────────────────────────────
function goTo(pageId){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+pageId)?.classList.add('active');
  document.querySelectorAll('#sidebar .side-menu li').forEach(li=>{
    li.classList.toggle('active', li.dataset.page===pageId);
  });
}

document.querySelectorAll('#sidebar .side-menu li').forEach(li=>{
  li.addEventListener('click',e=>{
    e.preventDefault();
    if(li.dataset.page) goTo(li.dataset.page);
  });
});

// ── SIDEBAR TOGGLE ────────────────────────────────────────
document.getElementById('menuToggle')?.addEventListener('click',()=>{
  document.getElementById('sidebar').classList.toggle('collapsed');
});

// ── API / AUTH HELPERS ───────────────────────────────
const API_BASE_URL = "http://localhost:5000/api";
const API_ORIGIN = API_BASE_URL.replace("/api", "");
const AUTH_STORAGE_KEY = "agriAuthToken";

function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
  } catch {
    return null;
  }
}

function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function getAuthHeaders() {
  const auth = getAuth();
  return auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
}

async function apiRequest(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  return await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body && !isFormData && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body,
  });
}

// ── AUTH GUARD ──────────────────────────────────
(function checkFarmerAuth() {
  const auth = getAuth();
  if (!auth?.token) {
    location.href = '../../login.html';
    return;
  }
  if (auth.user?.role !== 'farmer') {
    // Retailer or admin – redirect appropriately
    location.href = auth.user?.role === 'retailer'
      ? '../retailer/marketplace.html'
      : '../../login.html';
    return;
  }
  // Populate top-nav profile info
  const nameEl = document.querySelector('.pname');
  const roleEl = document.querySelector('.prole');
  if (nameEl) nameEl.textContent = auth.user.name || 'Farmer';
  if (roleEl) roleEl.textContent = 'Farmer · Verified ✓';
})();

function resolveImageUrl(image) {
  if (!image) return "";
  return image.startsWith("/uploads") ? `${API_ORIGIN}${image}` : image;
}

const formatCurrency = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;

function statusClass(status) {
  const map = {
    pending: 'badge-pending',
    accepted: 'badge-process',
    shipped: 'badge-process',
    delivered: 'badge-completed',
    cancelled: 'badge-cancelled',
  };
  return map[status] || 'badge-inactive';
}

function getCategoryIcon(category) {
  const icons = {
    grains: '🌾',
    vegetables: '🥬',
    fruits: '🍎',
    dairy: '🧀',
  };
  return icons[category?.toLowerCase()] || '🥕';
}

function buildProductCardHtml(product) {
  const icon = getCategoryIcon(product.category);
  return `<div class="product-card">
        <div class="product-thumb">${product.image ? `<img src="${resolveImageUrl(product.image)}" alt="${product.name}">` : icon}</div>
        <div class="product-info">
          <div class="product-name">${product.name}</div>
          <div class="product-price">₹${Number(product.price).toLocaleString('en-IN')}/${product.unit || 'kg'}</div>
          <div class="product-stock">Stock: ${product.quantity} ${product.unit || 'kg'}</div>
          <div class="product-actions">
            <button class="btn-sm edit"><i class='bx bx-edit'></i> Edit</button>
            <button class="btn-sm del"><i class='bx bx-trash'></i></button>
          </div>
        </div>
      </div>`;
}

async function loadFarmerProducts() {
  const productGrid = document.querySelector('.product-grid');
  if (!productGrid) return;

  const auth = getAuth();
  if (!auth?.user?._id) return;

  productGrid.innerHTML = '<div style="padding:20px;color:#888;">Loading products...</div>';

  try {
    const response = await apiRequest(`/products?limit=50&farmer=${auth.user._id}`);
    if (!response.ok) {
      productGrid.innerHTML = '<div style="padding:20px;color:#ef4444;">Failed to load products.</div>';
      return;
    }
    const payload = await response.json();
    const products = payload.data || [];

    // Update My Store Stats
    const totalEl = document.getElementById('storeTotalProducts');
    if (totalEl) totalEl.textContent = products.length;
    
    const outOfStockEl = document.getElementById('storeOutOfStock');
    if (outOfStockEl) outOfStockEl.textContent = products.filter(p => Number(p.quantity) <= 0).length;
    
    const ratingEl = document.getElementById('storeRating');
    if (ratingEl) ratingEl.textContent = products.length > 0 ? '4.8★' : '0.0★';

    if (!products.length) {
      productGrid.innerHTML = '<div style="padding:20px;color:#888;">No products listed yet. Click “Add Product” to get started.</div>';
      return;
    }

    productGrid.innerHTML = products.map((p, i) => buildProductCardHtml(p, i)).join('');
    attachProductCardListeners(productGrid, products);
  } catch (error) {
    console.error('Unable to load farmer products', error);
    productGrid.innerHTML = '<div style="padding:20px;color:#ef4444;">Error loading products.</div>';
  }
}

function attachProductCardListeners(grid, products) {
  grid.querySelectorAll('.btn-sm.edit').forEach((btn, i) => {
    btn.addEventListener('click', () => openEditModal(products[i]));
  });
  grid.querySelectorAll('.btn-sm.del').forEach((btn, i) => {
    btn.addEventListener('click', () => deleteProduct(products[i]._id, btn.closest('.product-card')));
  });
}

async function loadFarmerOrders() {
  // Stats are loaded by loadFarmerDashboardAnalytics(); this is kept for compatibility
  // but dashboard analytics already covers order counts.
}

// ── EDIT PRODUCT ───────────────────────────────────
let editingProductId = null;

function openEditModal(product) {
  editingProductId = product._id;
  const modal = document.getElementById('editProductModal');
  if (!modal) return;
  document.getElementById('editProductName').value = product.name || '';
  document.getElementById('editProductCategory').value = product.category || 'Grains';
  document.getElementById('editProductPrice').value = product.price || '';
  document.getElementById('editProductQuantity').value = product.quantity || '';
  document.getElementById('editProductDescription').value = product.description || '';
  modal.classList.add('open');
}

async function submitEditProduct(event) {
  event.preventDefault();
  if (!editingProductId) return;

  const name = document.getElementById('editProductName')?.value.trim();
  const category = document.getElementById('editProductCategory')?.value;
  const price = Number(document.getElementById('editProductPrice')?.value);
  const quantity = Number(document.getElementById('editProductQuantity')?.value);
  const description = document.getElementById('editProductDescription')?.value.trim();
  const imageFile = document.getElementById('editProductImage')?.files?.[0];

  if (!name || !category || !price || !quantity) {
    return alert('Please complete all required fields.');
  }

  const btn = event.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const payload = new FormData();
  payload.append('name', name);
  payload.append('category', category);
  payload.append('price', price);
  payload.append('quantity', quantity);
  payload.append('unit', 'kg');
  payload.append('description', description || '');
  if (imageFile) payload.append('image', imageFile);

  try {
    const response = await apiRequest(`/products/${editingProductId}`, {
      method: 'PUT',
      body: payload,
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      alert(result?.message || 'Unable to update product.');
      return;
    }
    document.getElementById('editProductModal')?.classList.remove('open');
    showFarmerToast('Product updated successfully.');
    await loadFarmerProducts();
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  }
}

let productToDelete = null;

function deleteProduct(productId, cardEl) {
  productToDelete = { id: productId, el: cardEl };
  document.getElementById('deleteConfirmModal')?.classList.add('open');
}

document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
  if (!productToDelete) return;
  const { id: productId, el: cardEl } = productToDelete;
  const btn = document.getElementById('confirmDeleteBtn');
  
  btn.disabled = true;
  btn.textContent = 'Deleting...';
  
  try {
    const response = await apiRequest(`/products/${productId}`, { method: 'DELETE' });
    if (!response.ok) {
      alert('Unable to delete product.');
      return;
    }
    cardEl?.remove();
    document.getElementById('deleteConfirmModal')?.classList.remove('open');
    showFarmerToast('Product deleted successfully.');
    await loadFarmerProducts();
  } catch (e) {
    console.error('Delete product failed', e);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Yes, Delete';
    productToDelete = null;
  }
});

function showFarmerToast(msg) {
  let toast = document.querySelector('.farmer-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'farmer-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#2d6a4f;color:#fff;padding:12px 20px;border-radius:8px;font-weight:600;z-index:9999;box-shadow:0 4px 14px rgba(0,0,0,.18);transition:opacity .3s;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

// ── ORDER STATUS UPDATE ────────────────────────────
async function updateOrderStatus(orderId, newStatus, btnEl) {
  btnEl.disabled = true;
  btnEl.textContent = 'Updating...';
  try {
    const response = await apiRequest(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: { status: newStatus },
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      alert(result?.message || 'Unable to update status.');
      return;
    }
    showFarmerToast(`Order status updated to "${newStatus}".`);
    await loadFarmerDashboardAnalytics();
  } finally {
    btnEl.disabled = false;
  }
}

function renderMonthlySales(monthlySales = []) {
  const chart = document.getElementById('monthlySalesChart');
  if (!chart) return;

  if (!monthlySales.length) {
    chart.innerHTML = '<div class="empty-analytics">No sales data yet.</div>';
    return;
  }

  const maxRevenue = Math.max(...monthlySales.map(item => item.revenue), 1);
  chart.innerHTML = monthlySales.map((item, index) => {
    const height = Math.max((item.revenue / maxRevenue) * 100, item.revenue ? 8 : 2);
    return `<div class="bar-col">
      <div class="bar ${index % 2 ? 'gold' : ''}" style="height:${height}%" data-val="${formatCurrency(item.revenue)}"></div>
      <span class="bar-label">${item.label}</span>
    </div>`;
  }).join('');
}

function renderStatusDistribution(distribution = {}) {
  const chart = document.getElementById('orderStatusChart');
  if (!chart) return;

  const statuses = ['pending', 'accepted', 'shipped', 'delivered', 'cancelled'];
  const total = statuses.reduce((sum, status) => sum + Number(distribution[status] || 0), 0);

  if (!total) {
    chart.innerHTML = '<div class="empty-analytics">No orders yet.</div>';
    return;
  }

  chart.innerHTML = statuses.map(status => {
    const count = Number(distribution[status] || 0);
    const width = total ? (count / total) * 100 : 0;
    return `<div class="status-row">
      <span>${status}</span>
      <div class="status-track"><div class="status-fill ${status}" style="width:${width}%"></div></div>
      <strong>${count}</strong>
    </div>`;
  }).join('');
}

function renderLowStock(products = []) {
  const list = document.getElementById('lowStockList');
  if (!list) return;

  if (!products.length) {
    list.innerHTML = '<div class="empty-analytics">No low stock products.</div>';
    return;
  }

  list.innerHTML = products.map(product => `<div class="analytics-row">
    <div class="analytics-main">
      <strong>${product.name}</strong>
      <span>${product.category || 'Product'} · ${formatCurrency(product.price)}/${product.unit || 'kg'}</span>
    </div>
    <div class="analytics-value">${product.quantity} ${product.unit || 'kg'}</div>
  </div>`).join('');
}

function renderRecentOrders(orders = []) {
  const table = document.getElementById('farmerRecentOrders');
  const count = document.getElementById('recentOrderCount');
  if (!table) return;

  if (count) count.textContent = `${orders.length} orders`;

  if (!orders.length) {
    table.innerHTML = '<tr><td colspan="6">No orders received yet.</td></tr>';
    return;
  }

  const NEXT_STATUS = { pending: 'accepted', accepted: 'shipped', shipped: 'delivered' };

  table.innerHTML = orders.map(order => {
    const next = NEXT_STATUS[order.orderStatus];
    const actionBtn = next
      ? `<button class="btn-sm edit" onclick="updateOrderStatus('${order._id}','${next}',this)">Mark ${next}</button>`
      : order.orderStatus === 'pending'
        ? `<button class="btn-sm del" onclick="updateOrderStatus('${order._id}','cancelled',this)">Cancel</button>`
        : `<span style="color:#22c55e;font-size:12px;">Done</span>`;
    return `<tr>
      <td>${order.product?.name || 'Deleted product'}</td>
      <td>${order.retailer?.name || 'Retailer'}</td>
      <td>${order.quantity} ${order.product?.unit || 'kg'}</td>
      <td>${formatCurrency(order.totalPrice)}</td>
      <td><span class="badge-status ${statusClass(order.orderStatus)}">${order.orderStatus}</span></td>
      <td>${actionBtn}</td>
    </tr>`;
  }).join('');
}

function renderTopProducts(products = []) {
  const list = document.getElementById('topProductsList');
  if (!list) return;

  if (!products.length) {
    list.innerHTML = '<div class="empty-analytics">No top products yet. Delivered or accepted orders will appear here.</div>';
    return;
  }

  list.innerHTML = products.map(product => `<div class="analytics-row">
    <div class="analytics-main">
      <strong>${product.name}</strong>
      <span>${product.orderCount} orders · ${product.totalQuantity} ${product.unit || 'kg'} sold</span>
    </div>
    <div class="analytics-value">${formatCurrency(product.totalRevenue)}</div>
  </div>`).join('');
}

async function loadFarmerDashboardAnalytics() {
  if (!document.getElementById('page-dashboard')) return;

  try {
    const [statsResponse, ordersResponse, topProductsResponse] = await Promise.all([
      apiRequest('/dashboard/farmer/stats'),
      apiRequest('/dashboard/farmer/recent-orders?limit=5'),
      apiRequest('/dashboard/farmer/top-products?limit=5'),
    ]);

    if (!statsResponse.ok || !ordersResponse.ok || !topProductsResponse.ok) {
      throw new Error('Unable to load dashboard analytics.');
    }

    const statsPayload = await statsResponse.json();
    const ordersPayload = await ordersResponse.json();
    const topProductsPayload = await topProductsResponse.json();
    const stats = statsPayload.data || {};

    document.getElementById('dashTotalOrders') && (document.getElementById('dashTotalOrders').textContent = Number(stats.totalOrders || 0).toLocaleString('en-IN'));
    document.getElementById('dashTotalRevenue') && (document.getElementById('dashTotalRevenue').textContent = formatCurrency(stats.totalRevenue));
    document.getElementById('dashDeliveredOrders') && (document.getElementById('dashDeliveredOrders').textContent = Number(stats.deliveredOrders || 0).toLocaleString('en-IN'));
    document.getElementById('dashTotalProducts') && (document.getElementById('dashTotalProducts').textContent = Number(stats.totalProducts || 0).toLocaleString('en-IN'));
    document.getElementById('dashPendingOrders') && (document.getElementById('dashPendingOrders').textContent = `${stats.pendingOrders || 0} pending`);
    document.getElementById('dashLowStockCount') && (document.getElementById('dashLowStockCount').textContent = `${stats.lowStockCount || 0} low stock`);
    document.getElementById('lowStockThreshold') && (document.getElementById('lowStockThreshold').textContent = `Threshold ${stats.lowStockThreshold}`);

    renderMonthlySales(stats.monthlySales || []);
    renderStatusDistribution(stats.statusDistribution || {});
    renderLowStock(stats.lowStockProducts || []);
    renderRecentOrders(ordersPayload.data || []);
    renderTopProducts(topProductsPayload.data || []);
  } catch (error) {
    console.error('Dashboard analytics failed', error);
    renderMonthlySales([]);
    renderStatusDistribution({});
    renderLowStock([]);
    renderRecentOrders([]);
    renderTopProducts([]);
  }
}

async function submitAddProduct(event) {
  event.preventDefault();
  const name = document.getElementById('productName')?.value.trim();
  const category = document.getElementById('productCategory')?.value;
  const price = Number(document.getElementById('productPrice')?.value);
  const quantity = Number(document.getElementById('productQuantity')?.value);
  const description = document.getElementById('productDescription')?.value.trim();
  const image = document.getElementById('productImage')?.files?.[0];

  if (!name || !category || !price || !quantity) {
    return alert('Please complete all required product fields.');
  }

  if (image && !image.type.startsWith('image/')) {
    return alert('Please select a valid image file.');
  }

  const payload = new FormData();
  payload.append('name', name);
  payload.append('category', category);
  payload.append('price', price);
  payload.append('quantity', quantity);
  payload.append('unit', 'kg');
  payload.append('description', description || '');
  if (image) payload.append('image', image);

  const response = await apiRequest('/products', {
    method: 'POST',
    body: payload,
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      alert('You must be logged in as a farmer to upload products.');
      return location.href = '/login.html';
    }
    return alert(result?.message || 'Unable to upload product.');
  }

  const modal = document.getElementById('addProductModal');
  modal?.classList.remove('open');
  document.getElementById('addProductForm')?.reset();
  const preview = document.getElementById('productImagePreview');
  if (preview) preview.textContent = 'No image selected';
  alert('Product uploaded successfully.');

  const productGrid = document.querySelector('.product-grid');
  if (productGrid) {
    productGrid.insertAdjacentHTML('afterbegin', buildProductCardHtml(result.data || result));
  }
}

const addProductForm = document.getElementById('addProductForm');
 if (addProductForm) {
   addProductForm.addEventListener('submit', submitAddProduct);
 }

 const editProductForm = document.getElementById('editProductForm');
 if (editProductForm) {
   editProductForm.addEventListener('submit', submitEditProduct);
 }

 document.getElementById('productImage')?.addEventListener('change', event => {
  const file = event.target.files?.[0];
  const preview = document.getElementById('productImagePreview');
  if (!preview) return;

  if (!file) {
    preview.textContent = 'No image selected';
    return;
  }

  if (!file.type.startsWith('image/')) {
    event.target.value = '';
    preview.textContent = 'Only image files are allowed';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    preview.innerHTML = `<img src="${reader.result}" alt="Product image preview">`;
  };
  reader.readAsDataURL(file);
});

// ── TODO ──────────────────────────────────────────────────
document.getElementById('addTodoBtn')?.addEventListener('click',()=>{
  document.getElementById('addTodoModal').classList.add('open');
});

function addTodo(){
  const val=document.getElementById('newTodoInput').value.trim();
  if(!val)return;
  const li=document.createElement('div');
  li.className='todo-item pending-t';
  li.innerHTML=`<input type="checkbox" class="todo-cb"><span class="todo-text">${val}</span><i class='bx bx-dots-vertical-rounded todo-more'></i>`;
  li.querySelector('.todo-cb').addEventListener('change',function(){
    li.classList.toggle('done',this.checked);
    li.classList.toggle('pending-t',!this.checked);
    li.querySelector('.todo-text').style.textDecoration=this.checked?'line-through':'none';
    li.querySelector('.todo-text').style.color=this.checked?'var(--muted)':'var(--dark)';
  });
  document.getElementById('todoList').appendChild(li);
  document.getElementById('newTodoInput').value='';
  document.getElementById('addTodoModal').classList.remove('open');
}

// existing checkboxes
document.querySelectorAll('.todo-cb').forEach(cb=>{
  cb.addEventListener('change',function(){
    const item=this.closest('.todo-item');
    item.classList.toggle('done',this.checked);
    item.classList.toggle('pending-t',!this.checked);
  });
});

// ── CHAT ──────────────────────────────────────────────────
function sendMsg(){
  const inp=document.getElementById('chatInput');
  const val=inp.value.trim();
  if(!val)return;
  const body=document.querySelector('.msg-chat-body');
  const b=document.createElement('div');
  b.className='bubble sent';
  b.textContent=val;
  body.appendChild(b);
  body.scrollTop=body.scrollHeight;
  inp.value='';
}
document.getElementById('chatInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')sendMsg();});

// msg list item click
document.querySelectorAll('.msg-item').forEach(item=>{
  item.addEventListener('click',()=>{
    document.querySelectorAll('.msg-item').forEach(i=>i.classList.remove('active'));
    item.classList.add('active');
  });
});

// ── CLOSE MODAL ON OVERLAY CLICK ──────────────────────────
document.querySelectorAll('.modal-overlay').forEach(o=>{
  o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open');});
});

// ── SEARCH FUNCTIONALITY ─────────────────────────────────
document.getElementById('farmerSearchInput')?.addEventListener('keydown', function(e) {
  if (e.key !== 'Enter') return;
  const query = e.target.value.toLowerCase().trim();
  if (!query) {
    document.querySelectorAll('.product-grid .product-card').forEach(card => {
      card.style.boxShadow = '';
      card.style.transform = '';
    });
    return;
  }

  let found = false;
  let firstMatch = null;

  document.querySelectorAll('.product-grid .product-card').forEach(card => {
    // Reset previous highlights
    card.style.boxShadow = '';
    card.style.transform = '';

    const title = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
    if (title.includes(query)) {
      found = true;
      if (!firstMatch) firstMatch = card;
      // Highlight the matching card
      card.style.boxShadow = '0 0 15px 4px rgba(45, 106, 79, 0.4)';
      card.style.transform = 'scale(1.02)';
      card.style.transition = 'all 0.3s ease';
    }
  });

  if (found) {
    goTo('mystore');
    showFarmerToast('Product found!');
    if (firstMatch) {
      setTimeout(() => firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  } else {
    showFarmerToast('No product added / found with that name.');
  }
});

// ── DARK MODE ─────────────────────────────────────────────
const darkToggle = document.getElementById('darkToggle');
darkToggle?.addEventListener('click', () => {
  darkToggle.classList.toggle('on');
  document.body.classList.toggle('dark');
});

// ── LOGOUT ────────────────────────────────────────
document.querySelector('.logout')?.addEventListener('click', function(e) {
  e.preventDefault();
  clearAuth();
  location.href = '../../login.html';
});

// responsive auto-collapse
if(window.innerWidth<768){
  document.getElementById('sidebar')?.classList.add('collapsed');
}
window.addEventListener('resize',()=>{
  if(window.innerWidth<768){
    document.getElementById('sidebar')?.classList.add('collapsed');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadFarmerDashboardAnalytics();
  loadFarmerProducts();
});
