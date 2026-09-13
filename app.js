function hasUnsavedCartChanges() {
    if (!state.selectedTable) return false;
    if (state.cart.length === 0 && state.originalOrderCart.length === 0) return false;
    const currentStr = JSON.stringify(state.cart.map(i => ({ key: i.key, qty: i.qty })));
    const origStr = JSON.stringify(state.originalOrderCart.map(i => ({ key: i.key, qty: i.qty })));
    return currentStr !== origStr;
}

/* ==========================================================================
   MANAGERIUM POS - RESTAURANT POS, FLOOR LAYOUT & RESERVATION SYSTEM
   ========================================================================== */


// --- 2. GLOBAL STATE ---
let state = {
    currentMainView: 'sales',
    activeDaypartId: 'breakfast',
    isOverrideActive: false,
    selectedCategory: 'all',
    searchQuery: '',
    quickFilter: 'active',
    orderType: 'Dine-In',
    selectedTable: 't3',
    activeInvoiceId: 'INV-18260905-0042',
    cart: [],
    discountPercent: 0,
    customDiscountAmount: 0,
    vatPercent: 5,
    sortMode: 'custom',
    activeFloorId: 'floor_ground',
    tableStatusFilter: 'ALL',
    isEditMode: false, // Layout Edit Mode Toggle
    boSelectedCatId: 'cat_paratha',
    pendingModalProduct: null,
    modalQty: 1,
    draggedCatIndex: null,
    activeSummaryTable: null,
    pendingActionTable: null,
    editingTableObj: null,
    originalOrderCart: [],
    editingDaypartId: null
};

// --- 3. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    startClock();
    autoDetectDaypart();
    loadTableOpenOrder('t3');
    renderPOS();
    renderFloorLayoutSystem();
});

function startClock() {
    setInterval(() => {
        const now = new Date();
        const clockEl = document.getElementById('clockDisplay');
        if (clockEl) {
            clockEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
    }, 1000);
}

function autoDetectDaypart() {
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    if (currentDay === 5 && currentHour >= 12 && currentHour < 16) {
        state.activeDaypartId = 'friday_lunch';
    } else if (currentHour >= 6 && currentHour < 11) {
        state.activeDaypartId = 'breakfast';
    } else if (currentHour >= 11 && currentHour < 16) {
        state.activeDaypartId = 'lunch';
    } else if (currentHour >= 16 && currentHour < 20) {
        state.activeDaypartId = 'evening';
    } else {
        state.activeDaypartId = 'night';
    }
}

function cycleSimulatedDaypart() {
    const ids = ['breakfast', 'lunch', 'friday_lunch', 'evening', 'night'];
    let idx = ids.indexOf(state.activeDaypartId);
    idx = (idx + 1) % ids.length;
    state.activeDaypartId = ids[idx];
    state.isOverrideActive = false;

    showToast(`Switched time window to: ${getDaypartObj(state.activeDaypartId).name}`);
    renderPOS();
}

function getDaypartObj(id) {
    return RESTAURANT_DATA.dayparts.find(dp => dp.id === id) || RESTAURANT_DATA.dayparts[0];
}

function toggleOverride() {
    state.isOverrideActive = !state.isOverrideActive;
    const btnText = document.getElementById('overrideText');
    const banner = document.getElementById('daypartBanner');

    if (state.isOverrideActive) {
        btnText.textContent = "Revert to Time Filter";
        banner.classList.add('override-active');
        showToast("Unlocked full menu across all dayparts");
    } else {
        btnText.textContent = "Show All Items";
        banner.classList.remove('override-active');
        showToast("Auto daypart filter activated");
    }

    renderPOS();
}

function switchMainView(viewName) {
    state.currentMainView = viewName;

    document.getElementById('navBtnSales').classList.remove('active');
    document.getElementById('navBtnTables').classList.remove('active');
    var navBtnSetup = document.getElementById('navBtnSetup');
    if (navBtnSetup) navBtnSetup.classList.remove('active');
    document.getElementById('viewSales').classList.remove('active');
    document.getElementById('viewTables').classList.remove('active');
    var viewSetup = document.getElementById('viewSetup');
    if (viewSetup) viewSetup.classList.remove('active');

    if (viewName === 'sales') {
        document.getElementById('navBtnSales').classList.add('active');
        document.getElementById('viewSales').classList.add('active');
        renderPOS();
    } else if (viewName === 'setup') {
        if (navBtnSetup) navBtnSetup.classList.add('active');
        if (viewSetup) viewSetup.classList.add('active');
    } else {
        document.getElementById('navBtnTables').classList.add('active');
        document.getElementById('viewTables').classList.add('active');
        renderFloorLayoutSystem();
    }
    lucide.createIcons();
}

function deductStockForCartDiff() {
    const allProductIds = new Set([
        ...state.cart.map(i => i.productId),
        ...state.originalOrderCart.map(i => i.productId)
    ]);

    allProductIds.forEach(productId => {
        const currentQty = state.cart.filter(i => i.productId === productId).reduce((sum, item) => sum + item.qty, 0);
        const originalQty = state.originalOrderCart.filter(i => i.productId === productId).reduce((sum, item) => sum + item.qty, 0);
        
        const diff = currentQty - originalQty;
        const product = RESTAURANT_DATA.products.find(p => p.id === productId);
        if (product && diff !== 0) {
            product.stock -= diff;
        }
    });
}

function getRemainingStock(productId) {
    const product = RESTAURANT_DATA.products.find(p => p.id === productId);
    if (!product) return 0;

    const currentQty = state.cart.filter(i => i.productId === productId).reduce((sum, item) => sum + item.qty, 0);
    const originalQty = state.originalOrderCart.filter(i => i.productId === productId).reduce((sum, item) => sum + item.qty, 0);
    
    const newQtyAdded = Math.max(0, currentQty - originalQty);
    return Math.max(0, product.stock - newQtyAdded);
}

// --- 4. RENDER POS SALES SCREEN ---
function renderPOS() {
    renderDaypartBanner();
    renderQuickFilterChips();
    renderCategories();
    renderBestsellersStrip();
    renderProductGrid();
    renderCart();
    lucide.createIcons();
}

function renderQuickFilterChips() {
    const container = document.getElementById('quickFilterChipsList');
    if (!container) return;

    container.innerHTML = '';

    const presetChips = [
        { id: 'active', label: '⚡ Now Active' },
        { id: 'all', label: '🍽️ All Menu' }
    ];

    presetChips.forEach(chip => {
        const isActive = state.quickFilter === chip.id ? 'active' : '';
        container.innerHTML += `
            <button class="dp-chip ${isActive}" data-dp="${chip.id}" onclick="filterByDaypartChip('${chip.id}', this)">
                ${chip.label}
            </button>
        `;
    });

    RESTAURANT_DATA.dayparts.forEach(dp => {
        if (dp.enabled === false) return;
        const isActive = state.quickFilter === dp.id ? 'active' : '';
        const emojiStr = dp.emoji ? `${dp.emoji} ` : '';
        container.innerHTML += `
            <button class="dp-chip ${isActive}" data-dp="${dp.id}" onclick="filterByDaypartChip('${dp.id}', this)">
                ${emojiStr}${dp.name}
            </button>
        `;
    });
}

function renderDaypartBanner() {
    const dp = getDaypartObj(state.activeDaypartId);
    document.getElementById('daypartName').textContent = dp.name;
    document.getElementById('daypartTimeRange').textContent = dp.timeDisplay;
    document.getElementById('daypartDesc').textContent = state.isOverrideActive
        ? "⚠️ Manual Override Active: Showing full menu catalog"
        : dp.description;

    const iconBox = document.getElementById('daypartIconBox');
    iconBox.innerHTML = `<i data-lucide="${dp.icon}"></i>`;
}

// Count products for a category WITHOUT the selectedCategory filter
// so every category shows the correct count regardless of what's selected
function countProductsForCategory(catId) {
    return RESTAURANT_DATA.products.filter(p => {
        if (p.enabled === false) return false;
        if (p.catId !== catId) return false;

        if (state.quickFilter !== 'all') {
            if (state.quickFilter === 'active' && !state.isOverrideActive) {
                if (!p.dayparts.includes(state.activeDaypartId)) return false;
            } else if (state.quickFilter !== 'active') {
                const cat = RESTAURANT_DATA.categories.find(c => c.id === p.catId);
                const inCat = cat && cat.dayparts && cat.dayparts.includes(state.quickFilter);
                const inProduct = p.dayparts && p.dayparts.includes(state.quickFilter);
                if (!inCat && !inProduct) return false;
            }
        }

        if (state.searchQuery.trim() !== '') {
            const q = state.searchQuery.toLowerCase();
            if (!p.name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q)) return false;
        }

        return true;
    }).length;
}

function renderCategories() {
    const listEl = document.getElementById('categoryList');
    listEl.innerHTML = '';

    let visibleCategories = RESTAURANT_DATA.categories.filter(cat => {
        if (state.isOverrideActive || state.quickFilter === 'all') return true;
        return cat.dayparts.includes(state.activeDaypartId);
    });

    if (state.sortMode !== 'custom') {
        visibleCategories.sort((a, b) => {
            const aPrimary = a.dayparts[0] === state.activeDaypartId ? 0 : 1;
            const bPrimary = b.dayparts[0] === state.activeDaypartId ? 0 : 1;
            return aPrimary - bPrimary;
        });
    }

    // "All Items" count: all visible products ignoring selectedCategory filter
    const allCount = RESTAURANT_DATA.products.filter(p => {
        if (p.enabled === false) return false;
        if (state.quickFilter !== 'all') {
            if (state.quickFilter === 'active' && !state.isOverrideActive) {
                if (!p.dayparts.includes(state.activeDaypartId)) return false;
            } else if (state.quickFilter !== 'active') {
                const cat = RESTAURANT_DATA.categories.find(c => c.id === p.catId);
                const inCat = cat && cat.dayparts && cat.dayparts.includes(state.quickFilter);
                const inProduct = p.dayparts && p.dayparts.includes(state.quickFilter);
                if (!inCat && !inProduct) return false;
            }
        }
        return true;
    }).length;

    const allActive = state.selectedCategory === 'all' ? 'active' : '';
    listEl.innerHTML += `
        <div class="category-card ${allActive}" onclick="selectCategory('all')">
            <div class="category-icon">🍽️</div>
            <div class="category-info">
                <div class="category-name">All Items</div>
                <div class="category-sub"><span class="category-count">${allCount}</span> items</div>
            </div>
        </div>
    `;

    visibleCategories.forEach(cat => {
        const isSelected = state.selectedCategory === cat.id ? 'active' : '';
        const catProductsCount = countProductsForCategory(cat.id);

        listEl.innerHTML += `
            <div class="category-card ${isSelected}" onclick="selectCategory('${cat.id}')">
                <div class="category-icon">${cat.icon}</div>
                <div class="category-info">
                    <div class="category-name">${cat.name}</div>
                    <div class="category-sub">
                        <span class="category-count">${catProductsCount}</span>
                    </div>
                </div>
            </div>
        `;
    });
}

function selectCategory(catId) {
    state.selectedCategory = catId;
    renderCategories();
    renderProductGrid();
    lucide.createIcons();
}

function renderBestsellersStrip() {
    const stripEl = document.getElementById('bestsellersList');
    const subEl = document.getElementById('bestsellerSub');
    const dp = getDaypartObj(state.activeDaypartId);

    subEl.textContent = `Top velocity dishes in ${dp.name}`;

    let bsProducts = RESTAURANT_DATA.products.filter(p => p.enabled !== false && p.dayparts.includes(state.activeDaypartId) && getRemainingStock(p.id) > 0);
    bsProducts.sort((a, b) => b.salesCount - a.salesCount);
    bsProducts = bsProducts.slice(0, 6);

    stripEl.innerHTML = '';
    bsProducts.forEach(p => {
        stripEl.innerHTML += `
            <div class="bs-card" onclick="handleProductTap(${p.id})">
                <div class="bs-img">${p.avatar}</div>
                <div class="bs-info">
                    <span class="bs-name" title="${p.name}">${p.name}</span>
                    <span class="bs-price">৳${p.price}</span>
                </div>
            </div>
        `;
    });
}

function getVisibleProducts() {
    return RESTAURANT_DATA.products.filter(p => {
        if (p.enabled === false) return false;

        if (state.quickFilter !== 'all') {
            if (state.quickFilter === 'active' && !state.isOverrideActive) {
                if (!p.dayparts.includes(state.activeDaypartId)) return false;
            } else if (state.quickFilter !== 'active') {
                const cat = RESTAURANT_DATA.categories.find(c => c.id === p.catId);
                const inCat = cat && cat.dayparts && cat.dayparts.includes(state.quickFilter);
                const inProduct = p.dayparts && p.dayparts.includes(state.quickFilter);
                if (!inCat && !inProduct) return false;
            }
        }

        if (state.selectedCategory !== 'all' && p.catId !== state.selectedCategory) return false;

        if (state.searchQuery.trim() !== '') {
            const q = state.searchQuery.toLowerCase();
            const matchName = p.name.toLowerCase().includes(q);
            const matchCode = p.code.toLowerCase().includes(q);
            if (!matchName && !matchCode) return false;
        }

        return true;
    });
}

function renderProductGrid() {
    const gridEl = document.getElementById('productGrid');
    const titleEl = document.getElementById('currentCategoryTitle');
    const badgeEl = document.getElementById('itemCountBadge');

    let products = getVisibleProducts();

    if (state.sortMode === 'hybrid') {
        products.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.salesCount - a.salesCount;
        });
    } else if (state.sortMode === 'bestseller') {
        products.sort((a, b) => b.salesCount - a.salesCount);
    } else if (state.sortMode === 'alphabetical') {
        products.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (state.selectedCategory === 'all') {
        titleEl.textContent = "All Menu Items";
    } else {
        const cat = RESTAURANT_DATA.categories.find(c => c.id === state.selectedCategory);
        titleEl.textContent = cat ? cat.name : "Items";
    }
    badgeEl.textContent = `${products.length} Items`;

    gridEl.innerHTML = '';
    if (products.length === 0) {
        gridEl.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b;">
                <i data-lucide="package-search" style="width: 48px; height: 48px; margin-bottom: 8px;"></i>
                <p style="font-weight: 700;">No enabled items available</p>
            </div>
        `;
        return;
    }

    products.forEach(p => {
        const remainingStock = getRemainingStock(p.id);
        const isOutOfStock = remainingStock <= 0;
        const outOfStockClass = isOutOfStock ? 'is-out-of-stock' : '';

        const discountBadge = p.discountPercent > 0 ? `<div class="discount-badge-corner">${p.discountPercent}% OFF</div>` : '';

        let stockBadge = '';
        if (isOutOfStock) {
            stockBadge = `<span class="badge-out-of-stock-top">🚫 STOCK OUT</span>`;
        } else if (remainingStock <= 5) {
            stockBadge = `<span class="stock-badge low-stock">Low Stock: ${remainingStock}</span>`;
        } else {
            stockBadge = `<span class="stock-badge in-stock">Stock: ${remainingStock}</span>`;
        }

        const pinBtnHtml = `
            <button class="btn-pin-shortcut" onclick="event.stopPropagation(); togglePinDirect(${p.id})" title="${p.isPinned ? 'Unpin item' : 'Pin to top'}">
                ${p.isPinned ? '⭐ PINNED' : '📌'}
            </button>
        `;

        const origPriceHtml = p.origPrice ? `<span class="orig-price">৳${p.origPrice}</span>` : '';
        const addBtnHtml = isOutOfStock
            ? `<button class="btn-add-card btn-out-of-stock" disabled>Out of Stock</button>`
            : `<button class="btn-add-card" title="Add to Order"><i data-lucide="plus"></i></button>`;

        gridEl.innerHTML += `
            <div class="product-card ${outOfStockClass}" onclick="handleProductTap(${p.id})">
                ${discountBadge}
                <div class="card-top">
                    <div class="card-avatar">${p.avatar}</div>
                    <div class="card-badges">
                        ${pinBtnHtml}
                        ${stockBadge}
                    </div>
                </div>
                <div class="card-details">
                    <div class="item-code">${p.code}</div>
                    <h3 class="item-name">${p.name}</h3>
                </div>
                <div class="card-bottom">
                    <div class="price-container">
                        ${origPriceHtml}
                        <span class="item-price">৳${p.price}</span>
                    </div>
                    ${addBtnHtml}
                </div>
            </div>
        `;
    });
}

function togglePinDirect(productId) {
    const p = RESTAURANT_DATA.products.find(item => item.id === productId);
    if (p) {
        p.isPinned = !p.isPinned;
        showToast(p.isPinned ? `Pinned "${p.name}" to top` : `Unpinned "${p.name}"`);
        renderProductGrid();
    }
}

function handleProductTap(productId) {
    const product = RESTAURANT_DATA.products.find(p => p.id === productId);
    if (!product) return;

    const remaining = getRemainingStock(product.id);
    if (remaining <= 0) {
        showToast(`⚠️ Cannot add "${product.name}" - Item is OUT OF STOCK. Update stock in Back-Office.`);
        return;
    }

    if (product.hasModifiers) {
        openItemModal(product);
    } else {
        addToCart(product, 1, product.price, []);
    }
}

// --- 5. FLOOR LAYOUT, EDIT MODE & TABLE ACTION MODALS ---
function toggleEditMode() {
    state.isEditMode = !state.isEditMode;

    const btnText = document.getElementById('editModeBtnText');
    const btn = document.getElementById('btnToggleEditMode');
    const banner = document.getElementById('editModeBanner');
    const canvas = document.getElementById('floorCanvas');

    if (state.isEditMode) {
        btnText.textContent = "✏️ Edit Layout Mode: ON";
        btn.classList.add('active');
        banner.style.display = 'flex';
        canvas.classList.add('is-edit-mode');
        showToast("✏️ Edit Layout Mode ON: Drag tables to organize your floor plan.");
    } else {
        btnText.textContent = "✏️ Edit Layout Mode: OFF";
        btn.classList.remove('active');
        banner.style.display = 'none';
        canvas.classList.remove('is-edit-mode');
        showToast("Locked table layout. Edit Mode OFF.");
    }
}

function renderFloorLayoutSystem() {
    renderFloorTabs();
    renderFloorCanvas();
}

function renderFloorTabs() {
    const container = document.getElementById('floorTabsList');
    container.innerHTML = '';

    RESTAURANT_DATA.floors.forEach(fl => {
        const isActive = state.activeFloorId === fl.id ? 'active' : '';
        container.innerHTML += `
            <button class="floor-tab-btn ${isActive}" onclick="selectFloorTab('${fl.id}')">
                ${fl.name}
            </button>
        `;
    });
}

function selectFloorTab(floorId) {
    state.activeFloorId = floorId;
    renderFloorTabs();
    renderFloorCanvas();
}

function filterTablesByStatus(status, btn) {
    document.querySelectorAll('.table-status-pills .status-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.tableStatusFilter = status;
    renderFloorCanvas();
}

function renderFloorCanvas() {
    const canvas = document.getElementById('floorCanvas');
    canvas.innerHTML = '';

    // Apply floor canvas dimensions
    const activeFloor = RESTAURANT_DATA.floors.find(f => f.id === state.activeFloorId);
    if (activeFloor) {
        const w = activeFloor.width || 900;
        const h = activeFloor.height || 600;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        canvas.style.minHeight = `${h}px`;
    }

    let tables = RESTAURANT_DATA.tables.filter(t => t.floorId === state.activeFloorId);
    if (state.tableStatusFilter !== 'ALL') {
        tables = tables.filter(t => t.status === state.tableStatusFilter);
    }

    tables.forEach(t => {
        const statusClass = `status-${t.status.toLowerCase()}`;
        const shapeClass = `shape-${t.shape}`;

        let width = 110, height = 100;
        if (t.shape === 'round') { width = 110; height = 110; }
        else if (t.shape === 'square') { width = 105; height = 105; }
        else if (t.shape === 'rectangle') { width = 150; height = 95; }
        else if (t.shape === 'oval') { width = 160; height = 100; }

        let cap = parseInt(t.capacity) || 4;
        
        // Initialize chair positions if not exist or length mismatch
        if (!t.chairs || t.chairs.length !== cap) {
            t.chairs = [];
            for (let i = 0; i < cap; i++) {
                const angle = (i / cap) * (2 * Math.PI);
                const radiusX = (width / 2) + 10;
                const radiusY = (height / 2) + 10;
                const cx = (width / 2) + radiusX * Math.cos(angle) - 7;
                const cy = (height / 2) + radiusY * Math.sin(angle) - 7;
                t.chairs.push({ x: cx, y: cy });
            }
        }

        // Reservation Tag if Reserved
        let resTagHtml = '';
        if (t.status === 'RESERVED' && t.reservation) {
            resTagHtml = `<div style="font-size:9px; color:#fde68a; font-weight:800; margin-top:2px;">${t.reservation.time} - ${t.reservation.name}</div>`;
        }

        const node = document.createElement('div');
        node.className = `table-node ${shapeClass} ${statusClass}`;
        node.style.left = `${t.x}px`;
        node.style.top = `${t.y}px`;
        node.style.width = `${width}px`;
        node.style.height = `${height}px`;
        const rotation = parseInt(t.rotation) || 0;
        node.dataset.rotation = rotation;
        node.style.transform = `rotate(${rotation}deg)`;


        node.innerHTML = `
            <span class="tbl-name">${t.name}</span>
            <span class="tbl-cap">${t.capacity} Seats</span>
            <span class="tbl-status-tag">${t.status}</span>
            ${resTagHtml}
        `;

        t.chairs.forEach((chair) => {
            const chairEl = document.createElement('div');
            chairEl.className = 'chair-dot';
            chairEl.style.left = `${chair.x}px`;
            chairEl.style.top = `${chair.y}px`;
            enableChairDragging(chairEl, chair, width, height);
            node.appendChild(chairEl);
        });

        node.onclick = (e) => {
            e.stopPropagation();
            if (state.isEditMode) {
                openEditTableModal(t);
                return;
            }
            selectTableForOrder(t);
        };

        enableTableDragging(node, t);
        canvas.appendChild(node);
    });

    lucide.createIcons();
}

function enableChairDragging(element, chairData, tableWidth, tableHeight) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    element.onmousedown = (e) => {
        if (!state.isEditMode) return;
        e.stopPropagation(); // Prevent dragging the parent table

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = parseFloat(element.style.left) || 0;
        initialTop = parseFloat(element.style.top) || 0;

        document.onmousemove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            // Constrain chairs near the table boundaries
            const padding = 20;
            newLeft = Math.max(-padding, Math.min(newLeft, tableWidth + padding - 14));
            newTop = Math.max(-padding, Math.min(newTop, tableHeight + padding - 14));

            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;

            chairData.x = newLeft;
            chairData.y = newTop;
        };

        document.onmouseup = () => {
            isDragging = false;
            document.onmousemove = null;
            document.onmouseup = null;
        };
    };

    element.onclick = (e) => {
        // Prevent click from propagating to the table and triggering the edit modal
        e.stopPropagation();
    };
}

// DRAGGING RESTRICTED TO EDIT LAYOUT MODE ONLY
function enableTableDragging(element, tableData) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    element.onmousedown = (e) => {
        // ONLY DRAG IF EDIT MODE IS ACTIVE!
        if (!state.isEditMode) return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = element.offsetLeft;
        initialTop = element.offsetTop;

        document.onmousemove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            let newLeft = Math.max(0, initialLeft + dx);
            let newTop = Math.max(0, initialTop + dy);

            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
            // Preserve rotation while dragging
            const rot = element.dataset.rotation || 0;
            element.style.transform = `rotate(${rot}deg) scale(1.05)`;

            tableData.x = newLeft;
            tableData.y = newTop;
        };

        document.onmouseup = () => {
            isDragging = false;
            const rot = element.dataset.rotation || 0;
            element.style.transform = `rotate(${rot}deg)`;
            document.onmousemove = null;
            document.onmouseup = null;
        };
    };
}

// TABLE CLICK FLOW: OCCUPIED (Summary Modal) vs AVAILABLE / RESERVED (Action Options Modal)
function selectTableForOrder(tableObj) {
    state.selectedTable = tableObj.id;
    state.activeSummaryTable = tableObj;
    state.pendingActionTable = tableObj;

    loadTableOpenOrder(tableObj.id);

    if (tableObj.status === 'OCCUPIED') {
        openTableSummaryModal(tableObj);
    } else {
        openTableActionModal(tableObj);
    }
}

// OPEN TABLE ACTION MODAL FOR AVAILABLE / RESERVED TABLES
function openTableActionModal(tableObj) {
    const titleEl = document.getElementById('tblActionTitle');
    const subEl = document.getElementById('tblActionSubtitle');
    const bodyEl = document.getElementById('tblActionBody');
    const footerEl = document.getElementById('tblActionFooter');

    titleEl.textContent = `Table ${tableObj.name} Options`;
    subEl.textContent = `Capacity: ${tableObj.capacity} Seats • Status: ${tableObj.status}`;

    if (tableObj.status === 'AVAILABLE') {
        bodyEl.innerHTML = `
            <div style="text-align: center; padding: 16px;">
                <div style="font-size: 40px; margin-bottom: 8px;">🟢</div>
                <h3 style="font-size: 16px; font-weight:800; color:#0f172a;">Table ${tableObj.name} is Available</h3>
                <p style="font-size: 12px; color:#64748b; margin-top: 4px;">Choose an action below to start a new dining order or set a customer reservation schedule.</p>
            </div>
        `;

        footerEl.innerHTML = `
            <button class="btn-sec" onclick="closeTableActionModal()">Cancel</button>
            <button class="btn-pri" style="background:#d97706;" onclick="openReservationModalForTable()">
                <i data-lucide="calendar"></i> 📅 Reserve Table
            </button>
            <button class="btn-pri" onclick="startOrderForAvailableTable()">
                <i data-lucide="utensils"></i> 🍽️ Start Order & Open Sales Screen
            </button>
        `;
    } else if (tableObj.status === 'RESERVED') {
        const res = tableObj.reservation || { name: 'Customer', time: '19:30', phone: 'N/A' };
        bodyEl.innerHTML = `
            <div style="padding: 12px; background:#fffbeb; border: 1px solid #fde68a; border-radius:8px;">
                <h4 style="color:#b45309; font-weight:800; font-size:14px;">🟡 Table Reservation Details</h4>
                <div style="margin-top: 8px; font-size:12px; display:flex; flex-direction:column; gap:4px;">
                    <div><strong>Customer Name:</strong> ${res.name}</div>
                    <div><strong>Phone Number:</strong> ${res.phone}</div>
                    <div><strong>Scheduled Time:</strong> ${res.time}</div>
                    <div><strong>Party Size:</strong> ${res.guests || tableObj.capacity} Guests</div>
                </div>
            </div>
        `;

        footerEl.innerHTML = `
            <button class="btn-sec" onclick="cancelTableReservation('${tableObj.id}')" style="color:#dc2626;">
                ❌ Cancel Reservation
            </button>
            <button class="btn-pri" onclick="startOrderForAvailableTable()">
                <i data-lucide="check-circle"></i> 🍽️ Occupy & Start Order
            </button>
        `;
    }

    document.getElementById('tableActionModal').classList.add('active');
    lucide.createIcons();
}

function closeTableActionModal() {
    document.getElementById('tableActionModal').classList.remove('active');
}

function startOrderForAvailableTable() {
    closeTableActionModal();
    if (state.pendingActionTable) {
        const tableObj = state.pendingActionTable;
        const currentFloor = RESTAURANT_DATA.floors.find(f => f.id === tableObj.floorId);
        const floorName = currentFloor ? currentFloor.name.split(' ')[0] : 'Floor';

        document.getElementById('selectedTableText').textContent = `Table: ${tableObj.name} (${floorName})`;
        
        state.cart = [];
        state.activeInvoiceId = `INV-${Date.now().toString().slice(-6)}`;
        document.getElementById('invoiceNo').textContent = state.activeInvoiceId;
        
        switchMainView('sales');
        showToast(`Started new order for Table ${tableObj.name}`);
    }
}

// RESERVATION MODAL LOGIC WITH SCHEDULE
function openReservationModalForTable() {
    closeTableActionModal();
    if (!state.pendingActionTable) return;

    document.getElementById('resModalTitle').textContent = `Reserve Table ${state.pendingActionTable.name}`;
    document.getElementById('resCustName').value = '';
    document.getElementById('resCustPhone').value = '';
    document.getElementById('resDate').valueAsDate = new Date();
    document.getElementById('resGuests').value = state.pendingActionTable.capacity;

    document.getElementById('reservationModal').classList.add('active');
}

function closeReservationModal() {
    document.getElementById('reservationModal').classList.remove('active');
}

function saveTableReservation() {
    if (!state.pendingActionTable) return;

    const name = document.getElementById('resCustName').value.trim() || 'Guest Customer';
    const phone = document.getElementById('resCustPhone').value.trim() || 'N/A';
    const date = document.getElementById('resDate').value;
    const time = document.getElementById('resTime').value || '19:30';
    const guests = parseInt(document.getElementById('resGuests').value) || 4;

    const tableObj = state.pendingActionTable;
    tableObj.status = 'RESERVED';
    tableObj.reservation = {
        name: name,
        phone: phone,
        date: date,
        time: formatTime12Hour(time),
        guests: guests
    };

    closeReservationModal();
    showToast(`Reserved Table ${tableObj.name} for ${name} at ${formatTime12Hour(time)}`);
    renderFloorLayoutSystem();
}

function cancelTableReservation(tableId) {
    const tableObj = RESTAURANT_DATA.tables.find(t => t.id === tableId);
    if (tableObj) {
        tableObj.status = 'AVAILABLE';
        tableObj.reservation = null;
        closeTableActionModal();
        showToast(`Cancelled reservation for ${tableObj.name}`);
        renderFloorLayoutSystem();
    }
}

// OPEN TABLE SUMMARY MODAL
function openTableSummaryModal(tableObj) {
    const openOrder = RESTAURANT_DATA.openOrders.find(o => o.tableId === tableObj.id && o.status === 'OPEN');

    if (!openOrder || !openOrder.cart || openOrder.cart.length === 0) {
        // Self-heal: table marked OCCUPIED but has no open order / active items
        tableObj.status = 'AVAILABLE';
        tableObj.orderId = null;
        if (openOrder) openOrder.status = 'CANCELLED';
        renderFloorLayoutSystem();
        openTableActionModal(tableObj);
        showToast(`Table ${tableObj.name} had no active items — freed to Available.`);
        return;
    }

    document.getElementById('summaryTableTitle').textContent = `Table ${tableObj.name} Order Summary`;
    document.getElementById('summaryTableSubtitle').textContent = `Invoice: ${openOrder.id} • Created at ${openOrder.createdAt}`;

    const tbody = document.getElementById('summaryItemsTableBody');
    tbody.innerHTML = '';

    let totalItems = 0;
    let subtotal = 0;

    openOrder.cart.forEach(item => {
        const lineTotal = item.price * item.qty;
        totalItems += item.qty;
        subtotal += lineTotal;

        const optsText = item.options && item.options.length > 0 ? ` <small>(${item.options.join(', ')})</small>` : '';

        tbody.innerHTML += `
            <tr>
                <td><strong>${item.name}</strong>${optsText}</td>
                <td style="text-align: center;"><strong>${item.qty}</strong></td>
                <td style="text-align: right;">৳${item.price}</td>
                <td style="text-align: right;"><strong>৳${lineTotal}</strong></td>
            </tr>
        `;
    });

    const vat = (subtotal * (openOrder.vatPercent || 5)) / 100;
    const payable = subtotal + vat;

    document.getElementById('summaryTotalItems').textContent = totalItems;
    document.getElementById('summaryTotalPayable').textContent = `৳${payable.toFixed(2)}`;

    document.getElementById('tableSummaryModal').classList.add('active');
    lucide.createIcons();
}

function closeTableSummaryModal() {
    document.getElementById('tableSummaryModal').classList.remove('active');
}

// REDIRECT FLOWS FOR "ADD/DELETE ITEMS" & "PAY BILL"
function addMoreItemsToTableOrder() {
    closeTableSummaryModal();

    if (state.activeSummaryTable) {
        loadTableOpenOrder(state.activeSummaryTable.id);
        switchMainView('sales');
        showToast(`📝 Editing invoice for Table ${state.activeSummaryTable.name}. Add or remove items, then KOT to save.`);
    }
}

function settleTableBillFromSummary() {
    closeTableSummaryModal();
    if (state.activeSummaryTable) {
        loadTableOpenOrder(state.activeSummaryTable.id);
        switchMainView('sales');
        openPaymentModal();
    }
}

function loadTableOpenOrder(tableId) {
    const tableObj = RESTAURANT_DATA.tables.find(t => t.id === tableId);
    if (!tableObj) return;

    state.selectedTable = tableId;
    const currentFloor = RESTAURANT_DATA.floors.find(f => f.id === tableObj.floorId);
    const floorName = currentFloor ? currentFloor.name.split(' ')[0] : 'Floor';
    document.getElementById('selectedTableText').textContent = `Table: ${tableObj.name} (${floorName})`;

    const openOrder = RESTAURANT_DATA.openOrders.find(o => o.tableId === tableId && o.status === 'OPEN');
    if (openOrder) {
        state.cart = JSON.parse(JSON.stringify(openOrder.cart));
        state.originalOrderCart = JSON.parse(JSON.stringify(openOrder.cart));
        state.activeInvoiceId = openOrder.id;
        state.discountPercent = openOrder.discountPercent || 0;
        document.getElementById('invoiceNo').textContent = openOrder.id;
    } else {
        state.cart = [];
        state.originalOrderCart = [];
        state.activeInvoiceId = `INV-${Date.now().toString().slice(-6)}`;
        document.getElementById('invoiceNo').textContent = state.activeInvoiceId;
    }

    renderCart();
    renderProductGrid();
}

// TABLE SETUP MODAL
function openSetupTableModal() {
    const floorSelect = document.getElementById('tblFormFloor');
    floorSelect.innerHTML = '';
    RESTAURANT_DATA.floors.forEach(f => {
        floorSelect.innerHTML += `<option value="${f.id}" ${f.id === state.activeFloorId ? 'selected' : ''}>${f.name}</option>`;
    });

    document.getElementById('tblFormName').value = `T-0${RESTAURANT_DATA.tables.length + 1}`;
    document.getElementById('setupTableModal').classList.add('active');
}

function closeSetupTableModal() {
    document.getElementById('setupTableModal').classList.remove('active');
}

function saveNewTableSetup() {
    const name = document.getElementById('tblFormName').value.trim() || 'T-New';
    const floorId = document.getElementById('tblFormFloor').value;
    const shape = document.getElementById('tblFormShape').value;
    const capacity = parseInt(document.getElementById('tblFormCapacity').value) || 4;
    const statusRadio = document.querySelector('input[name="tblStatus"]:checked');
    const status = statusRadio ? statusRadio.value : 'AVAILABLE';

    const newTable = {
        id: `t_${Date.now()}`,
        name: name,
        floorId: floorId,
        shape: shape,
        capacity: capacity,
        status: status,
        x: 100 + (RESTAURANT_DATA.tables.length * 20) % 400,
        y: 100 + (RESTAURANT_DATA.tables.length * 20) % 250
    };

    RESTAURANT_DATA.tables.push(newTable);
    closeSetupTableModal();
    showToast(`Created table "${name}" on ${RESTAURANT_DATA.floors.find(f=>f.id===floorId).name}`);
    renderFloorLayoutSystem();
}

// CREATE NEW FLOOR MODAL
function openCreateFloorModal() {
    document.getElementById('newFloorNameInput').value = '';
    document.getElementById('createFloorModal').classList.add('active');
}

function closeCreateFloorModal() {
    document.getElementById('createFloorModal').classList.remove('active');
}

function confirmCreateFloor() {
    const name = document.getElementById('newFloorNameInput').value.trim();
    if (!name) return;

    const shapeStyle = document.getElementById('newFloorShapeStyle').value;

    const newFloor = {
        id: `floor_${Date.now()}`,
        name: name,
        style: shapeStyle
    };

    RESTAURANT_DATA.floors.push(newFloor);
    state.activeFloorId = newFloor.id;

    closeCreateFloorModal();
    showToast(`Created floor layout section "${name}"`);
    renderFloorLayoutSystem();
}

// --- 6. PAY LATER (OPEN ORDER) vs PAY FIRST ---
function processPayLater() {
    const tableObj = RESTAURANT_DATA.tables.find(t => t.id === state.selectedTable);
    if (!tableObj) { showToast('No table selected!'); return; }

    // If cart is empty after editing, cancel/remove the open order and free the table
    if (state.cart.length === 0) {
        const existingOrder = RESTAURANT_DATA.openOrders.find(o => o.tableId === state.selectedTable && o.status === 'OPEN');
        if (existingOrder) {
            // Restore stock for items that were previously saved in the open order
            existingOrder.cart.forEach(item => {
                const product = RESTAURANT_DATA.products.find(p => p.id === item.productId);
                if (product) product.stock += item.qty;
            });
            existingOrder.status = 'CANCELLED';
        }
        tableObj.status = 'AVAILABLE';
        state.originalOrderCart = [];
        showToast(`⚠️ Cart is empty — Table ${tableObj.name} is now free.`);
        renderPOS();
        renderFloorLayoutSystem();
        return;
    }

    // --- INCREMENTAL KOT: Compute delta items ---
    let existingOrder = RESTAURANT_DATA.openOrders.find(o => o.tableId === state.selectedTable && o.status === 'OPEN');
    const previousCart = existingOrder ? existingOrder.cart : [];
    const deltaItems = computeKOTDelta(previousCart, state.cart);

    // Check if there are actual changes to send
    if (existingOrder && deltaItems.length === 0) {
        showToast('⚠️ No new items or changes to send to kitchen. All items already sent.');
        return;
    }

    deductStockForCartDiff();

    // Save/update the order with printedQty tracking
    const cartWithPrintedQty = state.cart.map(item => {
        const prevItem = previousCart.find(p => p.key === item.key);
        return {
            ...item,
            printedQty: item.qty // Mark current qty as printed
        };
    });

    if (existingOrder) {
        existingOrder.cart = JSON.parse(JSON.stringify(cartWithPrintedQty));
        existingOrder.discountPercent = state.discountPercent;
    } else {
        RESTAURANT_DATA.openOrders.push({
            id: state.activeInvoiceId,
            tableId: tableObj.id,
            tableName: tableObj.name,
            orderType: state.orderType,
            status: 'OPEN',
            cart: JSON.parse(JSON.stringify(cartWithPrintedQty)),
            discountPercent: state.discountPercent,
            vatPercent: state.vatPercent,
            createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        });
    }

    tableObj.status = 'OCCUPIED';

    const isFirstOrder = previousCart.length === 0;
    showToast(isFirstOrder 
        ? `🔥 Order saved for Table ${tableObj.name} (Pay Later). KOT sent!`
        : `🔥 Updated order for Table ${tableObj.name}. New items sent to kitchen!`);
    
    // Print only delta items (new/changed items)
    const deltaClone = JSON.parse(JSON.stringify(deltaItems));
    const ticketTag = isFirstOrder ? 'KOT' : 'KOT - ADDITIONAL';
    openPrintPrompt(() => {
        printKOT(state.activeInvoiceId, deltaClone, state.selectedWarehouse || 'W1', { ticketTag: ticketTag });
    });

    state.cart = [];
    state.originalOrderCart = [];
    renderPOS();
    if (state.currentMainView === 'tables') renderFloorLayoutSystem();
}

// Compute delta between previousCart (with printedQty) and currentCart
function computeKOTDelta(previousCart, currentCart) {
    const delta = [];

    // 1. Find new items and increased quantities
    currentCart.forEach(item => {
        const prevItem = previousCart.find(p => p.key === item.key);
        if (!prevItem) {
            // Completely new item
            delta.push({ ...item, isAddition: true });
        } else {
            const prevPrintedQty = prevItem.printedQty || prevItem.qty;
            if (item.qty > prevPrintedQty) {
                // Quantity increased - only send delta
                delta.push({
                    ...item,
                    qty: item.qty - prevPrintedQty,
                    isAddition: true
                });
            } else if (item.qty < prevPrintedQty) {
                // Quantity decreased - send reduction notice
                delta.push({
                    ...item,
                    qty: prevPrintedQty - item.qty,
                    isReduction: true
                });
            }
            // If qty === prevPrintedQty, no change needed
        }
    });

    // 2. Find deleted items
    previousCart.forEach(prevItem => {
        const currentItem = currentCart.find(c => c.key === prevItem.key);
        if (!currentItem) {
            delta.push({
                ...prevItem,
                qty: prevItem.printedQty || prevItem.qty,
                isDeleted: true
            });
        }
    });

    return delta;
}

function processPayment() {
    closePaymentModal();

    const tableObj = RESTAURANT_DATA.tables.find(t => t.id === state.selectedTable);
    let openOrder = RESTAURANT_DATA.openOrders.find(o => o.id === state.activeInvoiceId && o.status === 'OPEN');
    if (!openOrder && tableObj) {
        openOrder = RESTAURANT_DATA.openOrders.find(o => o.tableId === tableObj.id && o.status === 'OPEN');
    }

    deductStockForCartDiff();

    const paidCart = state.cart.length > 0 ? state.cart : (openOrder ? openOrder.cart : []);
    const invoiceId = state.activeInvoiceId;
    const cartClone = JSON.parse(JSON.stringify(paidCart));

    if (openOrder) {
        openOrder.status = 'PAID';
        openOrder.cart = JSON.parse(JSON.stringify(paidCart));
        openOrder.paidAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (paidCart.length > 0) {
        RESTAURANT_DATA.openOrders.push({
            id: invoiceId,
            tableId: tableObj ? tableObj.id : 'counter',
            tableName: tableObj ? tableObj.name : 'Counter',
            orderType: state.orderType,
            status: 'PAID',
            cart: JSON.parse(JSON.stringify(paidCart)),
            discountPercent: state.discountPercent,
            vatPercent: state.vatPercent,
            createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            paidAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        });
    }

    if (tableObj) {
        tableObj.status = 'AVAILABLE';
    }

    showToast("✅ Payment completed! Invoice closed & stock updated.");

    // Print Invoice Receipt + KOT tokens
    openPrintPrompt(() => {
        printInvoiceReceipt(invoiceId, cartClone, {});
        printKOT(invoiceId, cartClone, state.selectedWarehouse || 'W1', {});
    });

    // Reset cart & table without cancelling the PAID order
    state.cart = [];
    state.originalOrderCart = [];
    state.discountPercent = 0;
    state.customDiscountAmount = 0;
    state.activeInvoiceId = `INV-${Date.now().toString().slice(-6)}`;
    const invNoEl = document.getElementById('invoiceNo');
    if (invNoEl) invNoEl.textContent = state.activeInvoiceId;

    renderPOS();
    if (state.currentMainView === 'tables') renderFloorLayoutSystem();
}

function cancelOrder(orderId) {
    let targetOrderId = orderId || state.activeInvoiceId;
    const openOrder = RESTAURANT_DATA.openOrders.find(o => o.id === targetOrderId && o.status === 'OPEN');
    let tableObj = null;
    let cancelledCart = [];

    if (openOrder) {
        // Save the cart items before cancelling
        cancelledCart = JSON.parse(JSON.stringify(openOrder.cart));
        openOrder.status = 'CANCELLED';

        // Restore stock for each cancelled item
        openOrder.cart.forEach(item => {
            const product = RESTAURANT_DATA.products.find(p => p.id === item.productId);
            if (product) {
                product.stock += item.qty;
            }
        });

        if (openOrder.tableId) {
            tableObj = RESTAURANT_DATA.tables.find(t => t.id === openOrder.tableId);
        }
    }

    if (!tableObj && state.selectedTable) {
        tableObj = RESTAURANT_DATA.tables.find(t => t.id === state.selectedTable);
    }

    if (tableObj) {
        tableObj.status = 'AVAILABLE';
        tableObj.reservation = null;
    }

    closeTableSummaryModal();
    closeHistoryModal();

    // Load cancelled items into cart so user can review or clear them
    // Generate a new fresh invoice ID so re-submitting won't conflict
    state.activeInvoiceId = `INV-${Date.now().toString().slice(-6)}`;
    state.cart = cancelledCart;
    // originalOrderCart = same items so getRemainingStock won't double-deduct
    // (stock was already restored above, treat these items as already counted)
    state.originalOrderCart = JSON.parse(JSON.stringify(cancelledCart));
    state.discountPercent = openOrder ? (openOrder.discountPercent || 0) : 0;

    // Update the table label on the POS header
    if (tableObj) {
        state.selectedTable = tableObj.id;
        const currentFloor = RESTAURANT_DATA.floors.find(f => f.id === tableObj.floorId);
        const floorName = currentFloor ? currentFloor.name.split(' ')[0] : 'Floor';
        document.getElementById('selectedTableText').textContent = `Table: ${tableObj.name} (${floorName})`;
    }
    document.getElementById('invoiceNo').textContent = state.activeInvoiceId;

    switchMainView('sales');
    showToast(`❌ Order cancelled & stock restored. Items loaded — use Clear to erase.`);
    renderFloorLayoutSystem();
}

function cancelOrderFromSummary() {
    if (!state.activeSummaryTable) return;
    const openOrder = RESTAURANT_DATA.openOrders.find(o => o.tableId === state.activeSummaryTable.id && o.status === 'OPEN');
    if (openOrder) {
        cancelOrder(openOrder.id);
    } else {
        state.activeSummaryTable.status = 'AVAILABLE';
        closeTableSummaryModal();
        showToast(`Table ${state.activeSummaryTable.name} marked AVAILABLE`);
        renderFloorLayoutSystem();
    }
}

let currentHistoryFilter = 'ALL';

function filterHistoryTab(filter, btn) {
    currentHistoryFilter = filter;
    document.querySelectorAll('.btn-history-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    openHistoryModal();
}

function cancelOrderFromHistory(orderId) {
    cancelOrder(orderId);
    openHistoryModal();
}

function openHistoryModal() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = RESTAURANT_DATA.openOrders.filter(o => {
        if (currentHistoryFilter === 'OPEN') return o.status === 'OPEN';
        if (currentHistoryFilter === 'PAID') return o.status === 'PAID';
        if (currentHistoryFilter === 'CANCELLED') return o.status === 'CANCELLED';
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#64748b; padding:24px;">No orders found for selected filter (${currentHistoryFilter})</td></tr>`;
    } else {
        filtered.forEach(o => {
            const sub = o.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
            const vat = (sub * (o.vatPercent || 5)) / 100;
            const payable = sub + vat;

            let actionBtns = '';
            if (o.status === 'OPEN') {
                actionBtns = `
                    <button class="btn-bo-control" onclick="reloadOpenOrderFromHistory('${o.id}')" title="Add items or process payment">
                        ➕ Add / Settle
                    </button>
                    <button class="btn-bo-control" style="background:#fff7ed; color:#ea580c; border-color:#ffedd5; margin-left:4px;" onclick="reprintKOTFromHistory('${o.id}')" title="Reprint Kitchen Order Tickets">
                        🔥 Reprint KOT
                    </button>
                    <button class="btn-bo-control danger" style="color: #ef4444; border-color: #fca5a5; margin-left: 4px;" onclick="cancelOrderFromHistory('${o.id}')">
                        ❌ Cancel
                    </button>
                `;
            } else if (o.status === 'PAID') {
                actionBtns = `
                    <button class="btn-bo-control" style="background:#f0fdf4; color:#16a34a; border-color:#bbf7d0;" onclick="reprintReceiptFromHistory('${o.id}')" title="Reprint Customer Invoice">
                        🖨️ Reprint Invoice
                    </button>
                    <button class="btn-bo-control" style="background:#fff7ed; color:#ea580c; border-color:#ffedd5; margin-left:4px;" onclick="reprintKOTFromHistory('${o.id}')" title="Reprint Kitchen Order Tickets">
                        🔥 Reprint KOT
                    </button>
                `;
            } else {
                actionBtns = `<span style="font-size:11px; color:#94a3b8; font-weight: 600;">Cancelled Order</span>`;
            }

            const statusClass = o.status === 'OPEN' ? 'low-stock' : (o.status === 'CANCELLED' ? 'out-of-stock' : 'in-stock');

            tbody.innerHTML += `
                <tr>
                    <td><strong>${o.id}</strong></td>
                    <td><span class="table-selector">${o.tableName}</span></td>
                    <td>${o.orderType}</td>
                    <td>${o.createdAt}</td>
                    <td><span class="stock-badge ${statusClass}">${o.status}</span></td>
                    <td><strong>৳${payable.toFixed(2)}</strong></td>
                    <td>${actionBtns}</td>
                </tr>
            `;
        });
    }

    document.getElementById('historyModal').classList.add('active');
    if (window.lucide) lucide.createIcons();
}

function closeHistoryModal() {
    document.getElementById('historyModal').classList.remove('active');
}

function reloadOpenOrderFromHistory(orderId) {
    const order = RESTAURANT_DATA.openOrders.find(o => o.id === orderId);
    if (order) {
        closeHistoryModal();
        loadTableOpenOrder(order.tableId);
        switchMainView('sales');
        showToast(`Reloaded invoice ${order.id} for ${order.tableName}`);
    }
}

// --- REPRINT FUNCTIONS ---
function reprintReceiptFromHistory(orderId) {
    const order = RESTAURANT_DATA.openOrders.find(o => o.id === orderId);
    if (!order || !order.cart || order.cart.length === 0) {
        showToast('❌ No items found for this order.');
        return;
    }
    printInvoiceReceipt(orderId, order.cart, { isReprint: true });
    showToast('🖨️ Reprinting invoice with DUPLICATE watermark...');
}

function reprintKOTFromHistory(orderId) {
    const order = RESTAURANT_DATA.openOrders.find(o => o.id === orderId);
    if (!order || !order.cart || order.cart.length === 0) {
        showToast('❌ No items found for this order.');
        return;
    }
    printKOT(orderId, order.cart, state.selectedWarehouse || 'W1', { isReprint: true });
    showToast('🔥 Reprinting KOT tokens with DUPLICATE watermark...');
}

// --- 7. CART COMPUTATIONS ---
function addToCart(product, qty = 1, unitPrice = null, options = []) {
    const remaining = getRemainingStock(product.id);
    if (remaining < qty) {
        showToast(`⚠️ Cannot add "${product.name}" - Only ${remaining} available in stock.`);
        return;
    }

    const price = unitPrice !== null ? unitPrice : product.price;
    const itemKey = `${product.id}_${options.join('_')}`;

    const existing = state.cart.find(item => item.key === itemKey);
    if (existing) {
        existing.qty += qty;
    } else {
        state.cart.push({
            key: itemKey,
            productId: product.id,
            name: product.name,
            price: price,
            qty: qty,
            options: options,
            maxStock: remaining
        });
    }

    renderPOS();
    showToast(`Added ${product.name} to invoice`);
}

function updateCartQty(key, delta) {
    const item = state.cart.find(i => i.key === key);
    if (!item) return;

    if (delta > 0) {
        const remaining = getRemainingStock(item.productId);
        if (remaining < delta) {
            showToast(`⚠️ Exceeds available stock (${remaining} remaining)`);
            return;
        }
    }

    item.qty += delta;
    if (item.qty <= 0) {
        state.cart = state.cart.filter(i => i.key !== key);
    }

    // Auto-release table if all cart items were removed while editing an open order
    if (state.cart.length === 0 && state.selectedTable) {
        const openOrder = RESTAURANT_DATA.openOrders.find(
            o => o.tableId === state.selectedTable && o.status === 'OPEN'
        );
        if (openOrder) {
            state.originalOrderCart.forEach(origItem => {
                const product = RESTAURANT_DATA.products.find(p => p.id === origItem.productId);
                if (product) product.stock += origItem.qty;
            });
            openOrder.status = 'CANCELLED';
            const tableObj = RESTAURANT_DATA.tables.find(t => t.id === state.selectedTable);
            if (tableObj) {
                tableObj.status = 'AVAILABLE';
                tableObj.orderId = null;
            }
            state.originalOrderCart = [];
            state.activeInvoiceId = `INV-${Date.now().toString().slice(-6)}`;
            const invNoEl = document.getElementById('invoiceNo');
            if (invNoEl) invNoEl.textContent = state.activeInvoiceId;
            showToast('🗑️ All items removed — order cancelled & table released.');
            renderFloorLayoutSystem();
        }
    }

    renderPOS();
}

function clearCart() {
    let openOrder = null;
    if (state.selectedTable) {
        openOrder = RESTAURANT_DATA.openOrders.find(
            o => o.tableId === state.selectedTable && o.status === 'OPEN'
        );
    }
    if (!openOrder && state.activeInvoiceId) {
        openOrder = RESTAURANT_DATA.openOrders.find(
            o => o.id === state.activeInvoiceId && o.status === 'OPEN'
        );
    }

    if (openOrder) {
        if (openOrder.cart) {
            openOrder.cart.forEach(item => {
                const product = RESTAURANT_DATA.products.find(p => p.id === item.productId);
                if (product) product.stock += item.qty;
            });
        }
        openOrder.status = 'CANCELLED';
    }

    const targetTableId = openOrder ? openOrder.tableId : state.selectedTable;
    if (targetTableId) {
        const tableObj = RESTAURANT_DATA.tables.find(t => t.id === targetTableId);
        if (tableObj) {
            tableObj.status = 'AVAILABLE';
            tableObj.orderId = null;
            tableObj.reservation = null;
        }
    }

    state.cart = [];
    state.originalOrderCart = [];
    state.discountPercent = 0;
    state.customDiscountAmount = 0;

    state.activeInvoiceId = `INV-${Date.now().toString().slice(-6)}`;
    const invNoEl = document.getElementById('invoiceNo');
    if (invNoEl) invNoEl.textContent = state.activeInvoiceId;

    renderPOS();
    renderFloorLayoutSystem();
    showToast('🗑️ Invoice cleared — table is now free.');
}

function renderCart() {
    const tbody = document.getElementById('cartTableBody');
    const emptyState = document.getElementById('emptyCartState');

    tbody.innerHTML = '';
    if (state.cart.length === 0) {
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';

        state.cart.forEach(item => {
            const optionsText = item.options.length > 0 ? `<div class="cart-item-meta">${item.options.join(', ')}</div>` : '';
            const lineTotal = item.price * item.qty;

            tbody.innerHTML += `
                <tr class="cart-row">
                    <td>
                        <div class="cart-item-title">${item.name}</div>
                        ${optionsText}
                        <div class="cart-item-meta">৳${item.price} each</div>
                    </td>
                    <td style="text-align: center;">
                        <div class="cart-qty-ctrl">
                            <button class="btn-qty-mini" onclick="updateCartQty('${item.key}', -1)">-</button>
                            <span class="qty-val-mini">${item.qty}</span>
                            <button class="btn-qty-mini" onclick="updateCartQty('${item.key}', 1)">+</button>
                        </div>
                    </td>
                    <td style="text-align: right;">
                        <span class="cart-amount">৳${lineTotal}</span>
                    </td>
                </tr>
            `;
        });
    }

    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let discount = 0;
    if (state.discountPercent > 0) {
        discount = (subtotal * state.discountPercent) / 100;
    } else if (state.customDiscountAmount > 0) {
        discount = state.customDiscountAmount;
    }

    const taxableAmount = Math.max(0, subtotal - discount);
    const vat = (taxableAmount * state.vatPercent) / 100;
    const payable = taxableAmount + vat;

    document.getElementById('valSubtotal').textContent = `৳${subtotal.toFixed(2)}`;
    document.getElementById('valDiscount').textContent = `-৳${discount.toFixed(2)}`;
    document.getElementById('valVat').textContent = `৳${vat.toFixed(2)}`;
    document.getElementById('valPayable').textContent = `৳${payable.toFixed(2)}`;
    document.getElementById('btnPayAmount').textContent = Math.round(payable);

    lucide.createIcons();
}

function applyDiscount(percent) {
    state.discountPercent = percent;
    state.customDiscountAmount = 0;
    renderCart();
    showToast(`Applied ${percent}% discount`);
}

function applyCustomDiscount() {
    const val = prompt("Enter Custom Discount Amount in BDT (৳):", "50");
    if (val !== null && !isNaN(val)) {
        state.customDiscountAmount = parseFloat(val);
        state.discountPercent = 0;
        renderCart();
        showToast(`Applied ৳${val} discount`);
    }
}

function setOrderType(btn) {
    document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.orderType = btn.dataset.type;
    showToast(`Order type set to: ${state.orderType}`);
}

// --- 8. BACK-OFFICE EDITORS ---
function openBackofficeModal() {
    renderBoCategorySeqTable();
    renderBoCategorySelectList();
    renderBoItemEditor();
    renderBoDaypartsTable();
    document.getElementById('backofficeModal').classList.add('active');
    lucide.createIcons();
}

function closeBackofficeModal() {
    document.getElementById('backofficeModal').classList.remove('active');
}

function switchBoTab(tabId, btn) {
    document.querySelectorAll('.bo-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.bo-tab-content').forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// TAB 1: CATEGORY SEQUENCER
function renderBoCategorySeqTable() {
    const tbody = document.getElementById('boCategoryTableBody');
    tbody.innerHTML = '';

    RESTAURANT_DATA.categories.forEach((cat, index) => {
        const dpBadges = cat.dayparts.map(dp => `<span class="badge-dp">${dp.toUpperCase()}</span>`).join(' ');
        const isFirst = index === 0;
        const isLast = index === RESTAURANT_DATA.categories.length - 1;

        const row = document.createElement('tr');
        row.className = 'draggable-row';
        row.draggable = true;
        row.dataset.index = index;

        row.innerHTML = `
            <td class="drag-handle-cell">☰</td>
            <td><strong>#${index + 1}</strong></td>
            <td><span style="font-size: 18px; margin-right: 6px;">${cat.icon}</span> <strong>${cat.name}</strong></td>
            <td>${dpBadges}</td>
            <td style="text-align: center;">
                <button class="btn-bo-control" onclick="moveCategoryUp(${index})" ${isFirst ? 'disabled style="opacity:0.4;"' : ''}>
                    ⬆️ Up
                </button>
                <button class="btn-bo-control" onclick="moveCategoryDown(${index})" ${isLast ? 'disabled style="opacity:0.4;"' : ''}>
                    ⬇️ Down
                </button>
            </td>
        `;

        row.ondragstart = (e) => {
            state.draggedCatIndex = index;
            row.classList.add('dragging');
        };

        row.ondragover = (e) => e.preventDefault();

        row.ondrop = (e) => {
            e.preventDefault();
            const targetIndex = index;
            if (state.draggedCatIndex !== null && state.draggedCatIndex !== targetIndex) {
                const draggedItem = RESTAURANT_DATA.categories.splice(state.draggedCatIndex, 1)[0];
                RESTAURANT_DATA.categories.splice(targetIndex, 0, draggedItem);
                renderBoCategorySeqTable();
                renderBoCategorySelectList();
                showToast(`Re-ordered category "${draggedItem.name}"`);
            }
        };

        row.ondragend = () => {
            row.classList.remove('dragging');
            state.draggedCatIndex = null;
        };

        tbody.appendChild(row);
    });
}

function moveCategoryUp(index) {
    if (index <= 0) return;
    const temp = RESTAURANT_DATA.categories[index];
    RESTAURANT_DATA.categories[index] = RESTAURANT_DATA.categories[index - 1];
    RESTAURANT_DATA.categories[index - 1] = temp;

    renderBoCategorySeqTable();
    renderBoCategorySelectList();
    showToast(`Moved "${temp.name}" category up`);
}

function moveCategoryDown(index) {
    if (index >= RESTAURANT_DATA.categories.length - 1) return;
    const temp = RESTAURANT_DATA.categories[index];
    RESTAURANT_DATA.categories[index] = RESTAURANT_DATA.categories[index + 1];
    RESTAURANT_DATA.categories[index + 1] = temp;

    renderBoCategorySeqTable();
    renderBoCategorySelectList();
    showToast(`Moved "${temp.name}" category down`);
}

// TAB 2: ITEM EDITOR WITH ENABLE / DISABLE
function renderBoCategorySelectList() {
    const container = document.getElementById('boCatSelectList');
    container.innerHTML = '';

    RESTAURANT_DATA.categories.forEach(cat => {
        const isActive = state.boSelectedCatId === cat.id ? 'active' : '';
        container.innerHTML += `
            <button class="bo-cat-btn ${isActive}" onclick="selectBoCategory('${cat.id}')">
                <span>${cat.icon} ${cat.name}</span>
                <i data-lucide="chevron-right"></i>
            </button>
        `;
    });
}

function selectBoCategory(catId) {
    state.boSelectedCatId = catId;
    renderBoCategorySelectList();
    renderBoItemEditor();
    lucide.createIcons();
}

function renderBoItemEditor() {
    const listEl = document.getElementById('boItemEditorList');
    const titleEl = document.getElementById('boSelectedCatTitle');
    const cat = RESTAURANT_DATA.categories.find(c => c.id === state.boSelectedCatId);

    if (cat) titleEl.textContent = `Managing Items in "${cat.name}"`;

    let items = RESTAURANT_DATA.products.filter(p => p.catId === state.boSelectedCatId);

    listEl.innerHTML = '';
    if (items.length === 0) {
        listEl.innerHTML = `<p style="padding: 20px; color: #64748b;">No items in this category</p>`;
        return;
    }

    items.forEach((item, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === items.length - 1;

        const pinBtnClass = item.isPinned ? 'pinned' : 'unpinned';
        const pinBtnLabel = item.isPinned ? '⭐ PINNED' : '📌 Pin';

        const isEnabled = item.enabled !== false;
        const toggleClass = isEnabled ? 'enabled' : 'disabled';
        const toggleLabel = isEnabled ? '🟢 Enabled' : '⚪ Disabled';

        listEl.innerHTML += `
            <div class="bo-item-row">
                <div class="bo-item-info">
                    <span class="bo-item-avatar">${item.avatar}</span>
                    <div>
                        <div class="bo-item-name">${idx + 1}. ${item.name}</div>
                        <div class="bo-item-sub">
                            <span>Price: ৳${item.price}</span>
                            <span>•</span>
                            <label>Stock Qty:</label>
                            <input type="number" class="bo-stock-input" value="${item.stock}" min="0" onchange="updateItemStock(${item.id}, this.value)">
                        </div>
                    </div>
                </div>
                <div class="bo-item-actions">
                    <button class="btn-item-toggle ${toggleClass}" onclick="toggleItemEnabled(${item.id})" title="Toggle visibility on Sales Screen">
                        ${toggleLabel}
                    </button>
                    <button class="btn-pin-toggle ${pinBtnClass}" onclick="toggleItemPin(${item.id})">
                        ${pinBtnLabel}
                    </button>
                    <button class="btn-bo-control" onclick="moveItemUp(${item.id})" ${isFirst ? 'disabled style="opacity:0.4;"' : ''}>
                        ⬆️ Up
                    </button>
                    <button class="btn-bo-control" onclick="moveItemDown(${item.id})" ${isLast ? 'disabled style="opacity:0.4;"' : ''}>
                        ⬇️ Down
                    </button>
                </div>
            </div>
        `;
    });
}

function toggleItemEnabled(itemId) {
    const item = RESTAURANT_DATA.products.find(p => p.id === itemId);
    if (item) {
        item.enabled = item.enabled === false ? true : false;
        renderBoItemEditor();
        showToast(item.enabled ? `Enabled "${item.name}" (Visible on Sales Screen)` : `Disabled "${item.name}" (Hidden from Sales Screen)`);
    }
}

function moveItemUp(itemId) {
    const items = RESTAURANT_DATA.products.filter(p => p.catId === state.boSelectedCatId);
    const idx = items.findIndex(p => p.id === itemId);
    if (idx <= 0) return;

    const globalIdx1 = RESTAURANT_DATA.products.findIndex(p => p.id === items[idx].id);
    const globalIdx2 = RESTAURANT_DATA.products.findIndex(p => p.id === items[idx - 1].id);

    const temp = RESTAURANT_DATA.products[globalIdx1];
    RESTAURANT_DATA.products[globalIdx1] = RESTAURANT_DATA.products[globalIdx2];
    RESTAURANT_DATA.products[globalIdx2] = temp;

    renderBoItemEditor();
    showToast(`Moved item up`);
}

function moveItemDown(itemId) {
    const items = RESTAURANT_DATA.products.filter(p => p.catId === state.boSelectedCatId);
    const idx = items.findIndex(p => p.id === itemId);
    if (idx < 0 || idx >= items.length - 1) return;

    const globalIdx1 = RESTAURANT_DATA.products.findIndex(p => p.id === items[idx].id);
    const globalIdx2 = RESTAURANT_DATA.products.findIndex(p => p.id === items[idx + 1].id);

    const temp = RESTAURANT_DATA.products[globalIdx1];
    RESTAURANT_DATA.products[globalIdx1] = RESTAURANT_DATA.products[globalIdx2];
    RESTAURANT_DATA.products[globalIdx2] = temp;

    renderBoItemEditor();
    showToast(`Moved item down`);
}

function toggleItemPin(itemId) {
    const item = RESTAURANT_DATA.products.find(p => p.id === itemId);
    if (item) {
        item.isPinned = !item.isPinned;
        renderBoItemEditor();
        showToast(item.isPinned ? `Pinned "${item.name}" to top` : `Unpinned "${item.name}"`);
    }
}

function updateItemStock(itemId, newStockVal) {
    const item = RESTAURANT_DATA.products.find(p => p.id === itemId);
    if (item) {
        item.stock = parseInt(newStockVal) || 0;
        showToast(`Updated stock for "${item.name}" to ${item.stock}`);
    }
}

// TAB 3: DAYPARTS & QUICK FILTERS
function renderBoDaypartsTable() {
    const tbody = document.getElementById('boDaypartsTableBody');
    tbody.innerHTML = '';

    RESTAURANT_DATA.dayparts.forEach((dp) => {
        const assignedCatNames = RESTAURANT_DATA.categories
            .filter(c => c.dayparts.includes(dp.id))
            .map(c => `${c.icon} ${c.name}`)
            .join(', ') || '<span style="color:#94a3b8; font-style:italic;">None</span>';

        tbody.innerHTML += `
            <tr>
                <td><strong>${dp.emoji || '☀️'} ${dp.name}</strong></td>
                <td><input type="time" class="form-select-sm" value="${dp.startTime}" onchange="updateDaypartTime('${dp.id}', 'startTime', this.value)"></td>
                <td><input type="time" class="form-select-sm" value="${dp.endTime}" onchange="updateDaypartTime('${dp.id}', 'endTime', this.value)"></td>
                <td><span style="font-size: 11px; font-weight:700;">${dp.days.join(', ')}</span></td>
                <td><span style="font-size: 11px; color:#1e40af; font-weight:600;">${assignedCatNames}</span></td>
                <td>
                    <button class="btn-bo-control" onclick="toggleDaypartEnabled('${dp.id}')">
                        ${dp.enabled !== false ? '🟢 Active' : '🔴 Disabled'}
                    </button>
                </td>
                <td style="text-align: center;">
                    <button class="btn-bo-control" style="background:#e0f2fe; color:#0284c7; margin-right:4px;" onclick="openEditDaypartModal('${dp.id}')">
                        ✏️ Edit & Assign Categories
                    </button>
                    <button class="btn-bo-control danger" style="color:#ef4444; border-color:#fca5a5;" onclick="deleteDaypart('${dp.id}')">
                        🗑️ Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

function openAddDaypartModal() {
    const container = document.getElementById('dpFormCategoryCheckboxes');
    container.innerHTML = '';

    RESTAURANT_DATA.categories.forEach(cat => {
        container.innerHTML += `
            <label class="checkbox-card">
                <input type="checkbox" value="${cat.id}" checked>
                <span>${cat.icon} ${cat.name}</span>
            </label>
        `;
    });

    document.getElementById('dpFormName').value = '';
    document.getElementById('addDaypartModal').classList.add('active');
}

function closeAddDaypartModal() {
    document.getElementById('addDaypartModal').classList.remove('active');
}

function saveNewDaypart() {
    const name = document.getElementById('dpFormName').value.trim() || 'New Quick Filter';
    const emoji = document.getElementById('dpFormEmoji').value.trim() || '☀️';
    const startTime = document.getElementById('dpFormStart').value || '12:00';
    const endTime = document.getElementById('dpFormEnd').value || '16:00';

    const newDpId = `dp_${Date.now()}`;
    const selectedCatIds = [];

    document.querySelectorAll('#dpFormCategoryCheckboxes input[type="checkbox"]:checked').forEach(cb => {
        selectedCatIds.push(cb.value);
    });

    const newDaypart = {
        id: newDpId,
        name: name,
        icon: 'clock',
        emoji: emoji,
        startTime: startTime,
        endTime: endTime,
        timeDisplay: `(${formatTime12Hour(startTime)} - ${formatTime12Hour(endTime)})`,
        description: `Auto-filtered menu for ${name}`,
        days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        enabled: true
    };

    RESTAURANT_DATA.dayparts.push(newDaypart);

    selectedCatIds.forEach(catId => {
        const cat = RESTAURANT_DATA.categories.find(c => c.id === catId);
        if (cat && !cat.dayparts.includes(newDpId)) {
            cat.dayparts.push(newDpId);
        }
    });

    closeAddDaypartModal();
    showToast(`Created Quick Filter "${name}" with ${selectedCatIds.length} categories!`);
    renderBoDaypartsTable();
    renderPOS();
}

function openEditDaypartModal(dpId) {
    const dp = RESTAURANT_DATA.dayparts.find(d => d.id === dpId);
    if (!dp) return;

    state.editingDaypartId = dpId;

    document.getElementById('editDpFormName').value = dp.name;
    document.getElementById('editDpFormEmoji').value = dp.emoji || '☀️';
    document.getElementById('editDpFormStart').value = dp.startTime || '12:00';
    document.getElementById('editDpFormEnd').value = dp.endTime || '16:00';

    const container = document.getElementById('editDpFormCategoryCheckboxes');
    container.innerHTML = '';

    RESTAURANT_DATA.categories.forEach(cat => {
        const isChecked = cat.dayparts.includes(dpId) ? 'checked' : '';
        container.innerHTML += `
            <label class="checkbox-card">
                <input type="checkbox" value="${cat.id}" ${isChecked}>
                <span>${cat.icon} ${cat.name}</span>
            </label>
        `;
    });

    document.getElementById('editDaypartModal').classList.add('active');
    lucide.createIcons();
}

function closeEditDaypartModal() {
    document.getElementById('editDaypartModal').classList.remove('active');
    state.editingDaypartId = null;
}

function saveEditDaypart() {
    if (!state.editingDaypartId) return;

    const dp = RESTAURANT_DATA.dayparts.find(d => d.id === state.editingDaypartId);
    if (!dp) return;

    const name = document.getElementById('editDpFormName').value.trim() || dp.name;
    const emoji = document.getElementById('editDpFormEmoji').value.trim() || dp.emoji;
    const startTime = document.getElementById('editDpFormStart').value || dp.startTime;
    const endTime = document.getElementById('editDpFormEnd').value || dp.endTime;

    dp.name = name;
    dp.emoji = emoji;
    dp.startTime = startTime;
    dp.endTime = endTime;
    dp.timeDisplay = `(${formatTime12Hour(startTime)} - ${formatTime12Hour(endTime)})`;

    const selectedCatIds = [];
    document.querySelectorAll('#editDpFormCategoryCheckboxes input[type="checkbox"]:checked').forEach(cb => {
        selectedCatIds.push(cb.value);
    });

    // Sync category assignments
    RESTAURANT_DATA.categories.forEach(cat => {
        if (selectedCatIds.includes(cat.id)) {
            if (!cat.dayparts.includes(dp.id)) {
                cat.dayparts.push(dp.id);
            }
        } else {
            cat.dayparts = cat.dayparts.filter(id => id !== dp.id);
        }
    });

    closeEditDaypartModal();
    showToast(`✅ Updated Quick Filter "${name}" & category assignments!`);
    renderBoDaypartsTable();
    renderPOS();
}

function deleteDaypart(dpId) {
    const dpIndex = RESTAURANT_DATA.dayparts.findIndex(d => d.id === dpId);
    if (dpIndex < 0) return;

    const dpName = RESTAURANT_DATA.dayparts[dpIndex].name;
    if (!confirm(`Are you sure you want to delete Quick Filter "${dpName}"?`)) return;

    RESTAURANT_DATA.dayparts.splice(dpIndex, 1);

    // Remove dpId from all categories
    RESTAURANT_DATA.categories.forEach(cat => {
        cat.dayparts = cat.dayparts.filter(id => id !== dpId);
    });

    if (state.quickFilter === dpId) {
        state.quickFilter = 'all';
    }

    showToast(`🗑️ Deleted Quick Filter "${dpName}"`);
    renderBoDaypartsTable();
    renderPOS();
}

function updateDaypartTime(daypartId, key, val) {
    const dp = getDaypartObj(daypartId);
    if (dp) {
        dp[key] = val;
        dp.timeDisplay = `(${formatTime12Hour(dp.startTime)} - ${formatTime12Hour(dp.endTime)})`;
        showToast(`Updated ${dp.name} schedule`);
    }
}

function toggleDaypartEnabled(daypartId) {
    const dp = getDaypartObj(daypartId);
    if (dp) {
        dp.enabled = dp.enabled === false ? true : false;
        renderBoDaypartsTable();
        showToast(`${dp.name} is now ${dp.enabled ? 'Active' : 'Disabled'}`);
    }
}

function formatTime12Hour(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12 < 10 ? '0' + h12 : h12}:${m < 10 ? '0' + m : m} ${ampm}`;
}

function changeSortMode(mode) {
    state.sortMode = mode;
    const ruleText = {
        'custom': 'Back-Office Custom Sequence',
        'hybrid': 'Manual Pinned + Velocity',
        'bestseller': '7-Day Velocity Auto-Sort',
        'alphabetical': 'Alphabetical (A-Z)'
    };
    document.getElementById('sortRuleText').textContent = ruleText[mode];
    showToast(`Sequence rule set to: ${ruleText[mode]}`);
    renderProductGrid();
}

function saveBackofficeConfig() {
    closeBackofficeModal();
    showToast("✅ Applied all category sequence, item visibility & daypart updates!");
    renderPOS();
}

// --- 9. MODALS & GENERAL HANDLERS ---
function openItemModal(product) {
    state.pendingModalProduct = product;
    state.modalQty = 1;

    document.getElementById('modalItemTitle').textContent = product.name;
    document.getElementById('modalItemPrice').textContent = `৳${product.price}`;
    document.getElementById('modalQty').textContent = "1";
    document.getElementById('modInstruction').value = '';

    calcModalTotal();
    document.getElementById('itemModal').classList.add('active');
    lucide.createIcons();
}

function closeItemModal() {
    document.getElementById('itemModal').classList.remove('active');
}

function selectModOption(btn) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.mod-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    calcModalTotal();
}

function changeModalQty(delta) {
    state.modalQty = Math.max(1, state.modalQty + delta);
    document.getElementById('modalQty').textContent = state.modalQty;
    calcModalTotal();
}

function calcModalTotal() {
    if (!state.pendingModalProduct) return;
    const basePrice = state.pendingModalProduct.price;

    const activeSizeBtn = document.querySelector('#sizeOptions .mod-btn.active');
    const addPrice = activeSizeBtn ? parseFloat(activeSizeBtn.dataset.priceAdd || 0) : 0;

    let addonsSum = 0;
    document.querySelectorAll('.mod-addons input[type="checkbox"]:checked').forEach(cb => {
        addonsSum += parseFloat(cb.dataset.price || 0);
    });

    const unitTotal = basePrice + addPrice + addonsSum;
    const total = unitTotal * state.modalQty;

    document.getElementById('modalTotalPrice').textContent = `৳${total}`;
}

function confirmAddItemModal() {
    if (!state.pendingModalProduct) return;

    const activeSizeBtn = document.querySelector('#sizeOptions .mod-btn.active');
    const sizeText = activeSizeBtn ? activeSizeBtn.textContent.split('(')[0].trim() : '';

    let options = [];
    if (sizeText) options.push(sizeText);

    document.querySelectorAll('.mod-addons input[type="checkbox"]:checked').forEach(cb => {
        options.push(cb.value);
    });

    const instruction = document.getElementById('modInstruction').value.trim();
    if (instruction) options.push(`Note: ${instruction}`);

    const basePrice = state.pendingModalProduct.price;
    const addPrice = activeSizeBtn ? parseFloat(activeSizeBtn.dataset.priceAdd || 0) : 0;
    let addonsSum = 0;
    document.querySelectorAll('.mod-addons input[type="checkbox"]:checked').forEach(cb => {
        addonsSum += parseFloat(cb.dataset.price || 0);
    });

    const finalUnitPrice = basePrice + addPrice + addonsSum;

    addToCart(state.pendingModalProduct, state.modalQty, finalUnitPrice, options);
    closeItemModal();
}

function openPaymentModal() {
    if (state.cart.length === 0) {
        showToast("Cart is empty!");
        return;
    }

    // Calculate totals for modal display
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountAmt = Math.round(subtotal * (state.discountPercent / 100));
    const discountedTotal = subtotal - discountAmt;
    const vatAmt = Math.round(discountedTotal * (state.vatPercent / 100));
    const grandTotal = discountedTotal + vatAmt;

    // Set the payable amount in modal
    const payModalAmt = document.getElementById('payModalAmount');
    if (payModalAmt) payModalAmt.textContent = `৳${grandTotal.toFixed(2)}`;

    // Reset tender input and change
    const tenderInput = document.getElementById('tenderInput');
    if (tenderInput) tenderInput.value = '';
    const changeVal = document.getElementById('changeVal');
    if (changeVal) changeVal.textContent = '৳0.00';

    // Show the modal
    document.getElementById('paymentModal').classList.add('active');
    lucide.createIcons();
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
}

function selectPayMethod(method, btn) {
    document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    showToast(`Payment method selected: ${method.toUpperCase()}`);
}

function addTender(amount) {
    const input = document.getElementById('tenderInput');
    const curr = parseFloat(input.value || 0);
    input.value = curr + amount;
    calcChange();
}

function setExactTender() {
    const payableText = document.getElementById('valPayable').textContent;
    document.getElementById('tenderInput').value = parseFloat(payableText.replace('৳', ''));
    calcChange();
}

function calcChange() {
    const payableText = document.getElementById('valPayable').textContent;
    const payable = parseFloat(payableText.replace('৳', '')) || 0;
    const tender = parseFloat(document.getElementById('tenderInput').value) || 0;
    const change = Math.max(0, tender - payable);

    document.getElementById('changeVal').textContent = `৳${change.toFixed(2)}`;
}

function sendToKOT() {
    if (state.cart.length === 0) {
        showToast("Cart is empty!");
        return;
    }
    // sendToKOT is an alias for KOT & Pay Later flow
    processPayLater();
}

function openHoldOrder() {
    if (state.cart.length === 0) return;
    processPayLater();
}

function handleSearch() {
    const input = document.getElementById('searchInput');
    state.searchQuery = input.value;

    const clearBtn = document.getElementById('clearSearchBtn');
    clearBtn.style.display = state.searchQuery ? 'block' : 'none';

    renderProductGrid();
    lucide.createIcons();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    state.searchQuery = '';
    document.getElementById('clearSearchBtn').style.display = 'none';
    renderProductGrid();
    lucide.createIcons();
}

function filterByDaypartChip(dpType, btn) {
    state.quickFilter = dpType;
    renderQuickFilterChips();
    renderCategories();
    renderProductGrid();
    lucide.createIcons();
}

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = message;
    toast.classList.add('active');

    setTimeout(() => {
        toast.classList.remove('active');
    }, 2800);
}

// --- EDIT TABLE FEATURE ---
function openEditTableModal(tableObj) {
    state.editingTableObj = tableObj;
    
    document.getElementById('editTblFormName').value = tableObj.name;
    
    // Populate floor select info (disabled)
    const floorSelect = document.getElementById('editTblFormFloor');
    floorSelect.innerHTML = '';
    const currentFloor = RESTAURANT_DATA.floors.find(f => f.id === tableObj.floorId);
    if (currentFloor) {
        floorSelect.innerHTML = `<option>${currentFloor.name}</option>`;
    }
    
    document.getElementById('editTblFormShape').value = tableObj.shape;
    document.getElementById('editTblFormCapacity').value = tableObj.capacity;
    document.getElementById('editTblFormRotation').value = tableObj.rotation || 0;
    
    document.getElementById('editTableModal').classList.add('active');
    lucide.createIcons();
}

function closeEditTableModal() {
    document.getElementById('editTableModal').classList.remove('active');
    state.editingTableObj = null;
}

function saveEditTable() {
    if (!state.editingTableObj) return;
    
    const t = state.editingTableObj;
    const oldCapacity = parseInt(t.capacity);
    const oldShape = t.shape;
    
    t.name = document.getElementById('editTblFormName').value.trim() || t.name;
    t.shape = document.getElementById('editTblFormShape').value;
    t.capacity = parseInt(document.getElementById('editTblFormCapacity').value);
    t.rotation = document.getElementById('editTblFormRotation').value;
    
    // If shape or capacity changed, reset chairs so they get regenerated
    if (t.shape !== oldShape || t.capacity !== oldCapacity) {
        t.chairs = null;
    }
    
    closeEditTableModal();
    showToast(`Updated Table ${t.name}`);
    renderFloorCanvas();
}

// --- EDIT FLOOR FEATURE ---
function openEditFloorModal() {
    const floor = RESTAURANT_DATA.floors.find(f => f.id === state.activeFloorId);
    if (!floor) return;
    
    document.getElementById('editFloorNameInput').value = floor.name;
    document.getElementById('editFloorShapeStyle').value = floor.style;
    document.getElementById('editFloorWidth').value = floor.width || 900;
    document.getElementById('editFloorHeight').value = floor.height || 600;
    
    document.getElementById('editFloorModal').classList.add('active');
    lucide.createIcons();
}

function closeEditFloorModal() {
    document.getElementById('editFloorModal').classList.remove('active');
}

function saveEditFloor() {
    const floor = RESTAURANT_DATA.floors.find(f => f.id === state.activeFloorId);
    if (!floor) return;
    
    const newName = document.getElementById('editFloorNameInput').value.trim();
    if (!newName) {
        showToast('Floor name cannot be empty.');
        return;
    }
    
    const newWidth = parseInt(document.getElementById('editFloorWidth').value) || 900;
    const newHeight = parseInt(document.getElementById('editFloorHeight').value) || 600;
    
    floor.name = newName;
    floor.style = document.getElementById('editFloorShapeStyle').value;
    floor.width = Math.min(2400, Math.max(600, newWidth));
    floor.height = Math.min(1600, Math.max(400, newHeight));
    
    closeEditFloorModal();
    showToast(`Floor "${floor.name}" updated — Canvas: ${floor.width}×${floor.height}px`);
    renderFloorLayoutSystem();
}


// --- 10. PRINT ENGINE ---

function openPrintPrompt(callback) {
    if (window.confirm('Would you like to print?')) {
        callback();
    }
}

function getPrintPageWrapper(contentHtml, title = "Receipt") {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
    @page { 
        size: 68mm auto; 
        margin: 0; 
    }
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }
    html {
        background: #f1f5f9;
        display: flex;
        justify-content: center;
        padding: 20px 0;
    }
    body {
        width: 68mm;
        max-width: 68mm;
        margin: 0 auto;
        padding: 10px;
        background: #ffffff;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        font-family: 'Courier New', Courier, monospace;
        font-size: 11px;
        color: #000;
        line-height: 1.3;
    }
    @media print {
        html { 
            background: #ffffff; 
            padding: 0; 
            display: block; 
        }
        body { 
            box-shadow: none; 
            padding: 2px 4px; 
            width: 68mm; 
            max-width: 68mm; 
            margin: 0; 
        }
    }
    .ticket-container {
        width: 100%;
        margin-bottom: 15px;
        border-bottom: 2px dashed #000;
        padding-bottom: 12px;
        page-break-after: always;
    }
    .ticket-container:last-child {
        border-bottom: none;
        page-break-after: avoid;
    }
    .watermark-banner {
        border: 2px solid #000;
        background: #000;
        color: #fff;
        text-align: center;
        font-weight: 900;
        font-size: 11px;
        padding: 4px 0;
        margin-bottom: 6px;
        letter-spacing: 1px;
        text-transform: uppercase;
    }
    .watermark-box-warning {
        border: 1.5px dashed #000;
        text-align: center;
        font-size: 10px;
        font-weight: 900;
        padding: 4px;
        margin: 8px 0 4px 0;
        text-transform: uppercase;
    }
    .header-brand {
        text-align: center;
        font-size: 14px;
        font-weight: 900;
        text-transform: uppercase;
        margin-bottom: 2px;
    }
    .header-sub {
        text-align: center;
        font-size: 9px;
        margin-bottom: 6px;
    }
    .table-banner {
        background: #000;
        color: #fff;
        text-align: center;
        font-size: 14px;
        font-weight: 900;
        padding: 4px 0;
        margin: 6px 0;
        letter-spacing: 0.5px;
    }
    .ticket-type-badge {
        text-align: center;
        font-weight: 800;
        font-size: 10px;
        margin: 4px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .meta-line {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        margin: 2px 0;
    }
    .divider {
        border-top: 1px dashed #000;
        margin: 6px 0;
    }
    table.items-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 4px;
    }
    table.items-table th {
        font-size: 10px;
        text-transform: uppercase;
        border-bottom: 1px solid #000;
        padding: 3px 0;
        text-align: left;
    }
    table.items-table td {
        padding: 4px 0;
        border-bottom: 1px dotted #aaa;
        font-size: 11px;
        vertical-align: top;
    }
    .col-qty { width: 35px; text-align: right; font-weight: bold; }
    .col-price { width: 50px; text-align: right; }
    .col-total { width: 55px; text-align: right; font-weight: bold; }
    .item-title { font-weight: bold; }
    .item-badge-new { font-size: 9px; background: #000; color: #fff; padding: 1px 3px; border-radius: 2px; margin-left: 4px; }
    .totals-table {
        width: 100%;
        margin-top: 6px;
        font-size: 11px;
    }
    .totals-table td { padding: 2px 0; }
    .grand-total-row td {
        border-top: 1px solid #000;
        border-bottom: 2px double #000;
        font-weight: 900;
        font-size: 12px;
        padding: 4px 0;
    }
    .footer-msg {
        text-align: center;
        margin-top: 10px;
        font-size: 10px;
    }
</style>
</head>
<body>
${contentHtml}
</body>
</html>`;
}

function openPrintDialog(htmlContent) {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
    } else {
        alert('Popup blocked! Please allow popups for printing.');
    }
}

// 1. PRINT CUSTOMER INVOICE RECEIPT ONLY
function printInvoiceReceipt(orderId, items, options = {}) {
    if (!items || items.length === 0) return;
    
    let tableNumber = "Counter";
    let order = RESTAURANT_DATA.openOrders.find(o => o.id === orderId);
    if (order) {
        tableNumber = order.tableName || "Counter";
    } else if (state.selectedTable) {
        const tableObj = RESTAURANT_DATA.tables.find(t => t.id === state.selectedTable);
        if (tableObj) tableNumber = tableObj.name;
    }

    const isReprint = options.isReprint || false;
    const invoiceHtml = generateInvoiceHTML(orderId, items, tableNumber, isReprint);
    const fullPageHtml = getPrintPageWrapper(invoiceHtml, `Invoice - ${orderId}`);
    openPrintDialog(fullPageHtml);
}

// 2. PRINT KITCHEN ORDER TICKETS (KOT) ONLY
function printKOT(orderId, items, warehouseId, options = {}) {
    if (!items || items.length === 0) return;
    
    let tableNumber = "Counter";
    let order = RESTAURANT_DATA.openOrders.find(o => o.id === orderId);
    if (order) {
        tableNumber = order.tableName || "Counter";
    } else if (state.selectedTable) {
        const tableObj = RESTAURANT_DATA.tables.find(t => t.id === state.selectedTable);
        if (tableObj) tableNumber = tableObj.name;
    }
    
    const bucketA = [];
    const bucketsB = {};
    const bucketC = [];
    
    items.forEach(item => {
        let p = RESTAURANT_DATA.products.find(prod => prod.id === item.productId);
        if (!p) p = item; 

        if (!p.is_kitchen) {
            bucketA.push(item);
        } else {
            const mapping = RESTAURANT_DATA.kitchenItemMappings.find(m => m.warehouseId === warehouseId && m.itemId === p.id);
            if (mapping) {
                const k = RESTAURANT_DATA.kitchens.find(k => k.id === mapping.kitchenId);
                if (k && k.status === 'Active') {
                    if (!bucketsB[k.id]) bucketsB[k.id] = { kitchenId: k.id, kitchenName: k.name, items: [] };
                    bucketsB[k.id].items.push(item);
                } else {
                    bucketC.push(item); 
                }
            } else {
                bucketC.push(item); 
            }
        }
    });
    
    const isReprint = options.isReprint || false;
    const targetKitchenId = options.targetKitchenId || null;
    const ticketTag = options.ticketTag || (isReprint ? 'DUPLICATE / REPRINT' : 'KOT');
    
    let ticketsHtml = '';
    
    if ((!targetKitchenId || targetKitchenId === 'counter') && bucketA.length > 0) {
        ticketsHtml += generateTicketHTML(orderId, 'KOT - COUNTER / BAR', bucketA, tableNumber, ticketTag, isReprint);
    }
    
    Object.values(bucketsB).forEach(b => {
        if ((!targetKitchenId || targetKitchenId === String(b.kitchenId)) && b.items.length > 0) {
            ticketsHtml += generateTicketHTML(orderId, 'KOT - ' + b.kitchenName, b.items, tableNumber, ticketTag, isReprint);
        }
    });
    
    if ((!targetKitchenId || targetKitchenId === 'unmapped') && bucketC.length > 0) {
        ticketsHtml += generateTicketHTML(orderId, 'KOT - UNMAPPED KITCHEN ITEMS', bucketC, tableNumber, ticketTag, isReprint);
    }
    
    if (!ticketsHtml) return;
    const fullPageHtml = getPrintPageWrapper(ticketsHtml, `KOT - ${orderId}`);
    openPrintDialog(fullPageHtml);
}

function generateInvoiceHTML(orderId, items, tableNumber, isReprint = false) {
    let subtotal = 0;
    const nowStr = new Date().toLocaleString();
    
    let html = `<div class="ticket-container">
        ${isReprint ? '<div class="watermark-banner">★ DUPLICATE RECEIPT COPY ★</div>' : ''}
        <div class="header-brand">MANAGERIUM RESTAURANT</div>
        <div class="header-sub">Dhanmondi Warehouse • Dhaka, Bangladesh<br>Phone: +880 1700-000000</div>
        ${isReprint ? '<div class="ticket-type-badge">*** REPRINT INVOICE ***</div>' : ''}
        <div class="table-banner">TABLE: ${tableNumber.toUpperCase()}</div>
        <div class="meta-line"><span>Invoice: <strong>${orderId}</strong></span><span>Date: ${nowStr}</span></div>
        <div class="divider"></div>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Item Description</th>
                    <th class="col-qty">Qty</th>
                    <th class="col-price">Price</th>
                    <th class="col-total">Total</th>
                </tr>
            </thead>
            <tbody>`;
            
    items.forEach(item => {
        const itemTotal = item.qty * item.price;
        subtotal += itemTotal;
        html += `<tr>
            <td><span class="item-title">${item.name}</span></td>
            <td class="col-qty">${item.qty}</td>
            <td class="col-price">৳${item.price}</td>
            <td class="col-total">৳${itemTotal.toFixed(2)}</td>
        </tr>`;
    });
    
    const discountAmt = Math.round(subtotal * (state.discountPercent / 100));
    const discountedTotal = subtotal - discountAmt;
    const vatAmt = Math.round(discountedTotal * (state.vatPercent / 100));
    const grandTotal = discountedTotal + vatAmt;

    html += `</tbody></table>
        <div class="divider"></div>
        <table class="totals-table">
            <tr><td>Subtotal:</td><td style="text-align:right;">৳${subtotal.toFixed(2)}</td></tr>`;
            
    if (discountAmt > 0) {
        html += `<tr><td>Discount (${state.discountPercent}%):</td><td style="text-align:right;">-৳${discountAmt.toFixed(2)}</td></tr>`;
    }
            
    html += `<tr><td>SD & VAT (${state.vatPercent}%):</td><td style="text-align:right;">৳${vatAmt.toFixed(2)}</td></tr>
            <tr class="grand-total-row"><td>PAYABLE TOTAL:</td><td style="text-align:right;">৳${grandTotal.toFixed(2)}</td></tr>
        </table>
        ${isReprint ? '<div class="watermark-box-warning">[ DUPLICATE RECEIPT COPY ]</div>' : ''}
        <div class="footer-msg">*** THANK YOU FOR DINING WITH US ***<br>Please Visit Again!</div>
    </div>`;
    return html;
}

function generateTicketHTML(orderId, title, items, tableNumber, ticketTag = 'KOT', isReprint = false) {
    const nowStr = new Date().toLocaleString();
    let totalQty = items.reduce((sum, i) => sum + i.qty, 0);

    let html = `<div class="ticket-container">
        ${isReprint ? '<div class="watermark-banner">★ DUPLICATE COPY ★</div>' : ''}
        <div class="header-brand">${title}</div>
        <div class="ticket-type-badge">*** ${ticketTag.toUpperCase()} ***</div>
        <div class="table-banner">TABLE: ${tableNumber.toUpperCase()}</div>
        <div class="meta-line"><span>Order: <strong>${orderId}</strong></span><span>Time: ${nowStr}</span></div>
        <div class="divider"></div>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Item Description</th>
                    <th class="col-qty">QTY</th>
                </tr>
            </thead>
            <tbody>`;
            
    items.forEach(item => {
        let badgeHtml = '';
        if (item.isAddition) {
            badgeHtml = ` <span class="item-badge-new">+NEW</span>`;
        } else if (item.isReduction || item.isDeleted) {
            badgeHtml = ` <span class="item-badge-new" style="background:#dc2626;">-CANCELLED</span>`;
        }

        const qtyDisplay = (item.isReduction || item.isDeleted) ? `-${item.qty}` : `${item.qty}`;
        html += `<tr>
            <td><span class="item-title">[ ${qtyDisplay}x ] ${item.name}</span>${badgeHtml}</td>
            <td class="col-qty" style="font-size: 14px; ${item.isReduction || item.isDeleted ? 'color:#dc2626;' : ''}">${qtyDisplay}</td>
        </tr>`;
    });
    
    html += `</tbody></table>
        <div class="divider"></div>
        <div class="meta-line"><span>Total Items: <strong>${items.length}</strong></span><span>Total Qty: <strong>${totalQty}</strong></span></div>
        ${isReprint ? '<div class="watermark-box-warning">[ DUPLICATE TOKEN COPY ]</div>' : ''}
    </div>`;
    return html;
}
