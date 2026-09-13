
// ── DATA ───────────────────────────────────────────────────────────────────
// Use global RESTAURANT_DATA loaded from data.js
const DATA = RESTAURANT_DATA;


let nextId = 4;

// ── INIT ──────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    populateFilterDropdowns();
    renderTable(DATA.kitchens);
    lucide.createIcons();
});

function populateFilterDropdowns() {
    const offSel = document.getElementById('filterOffice');
    DATA.offices.forEach(o => {
        offSel.innerHTML += `<option value="${o.id}">${o.name}</option>`;
    });
    offSel.value = '';

    const whSel = document.getElementById('filterWarehouse');
    DATA.warehouses.forEach(w => {
        whSel.innerHTML += `<option value="${w.id}">${w.name}</option>`;
    });
    whSel.value = '';
}

function getOfficeName(id)    { return (DATA.offices.find(o => o.id === id)    || {}).name || '-'; }
function getWarehouseName(id) { return (DATA.warehouses.find(w => w.id === id) || {}).name || '-'; }

// ── FILTER ────────────────────────────────────────────────────────────────
function applyFilters() {
    const office    = document.getElementById('filterOffice').value;
    const warehouse = document.getElementById('filterWarehouse').value;
    const status    = document.getElementById('filterStatus').value;

    const filtered = DATA.kitchens.filter(k => {
        return (!office    || k.officeId    === office)
            && (!warehouse || k.warehouseId === warehouse)
            && (!status    || k.status      === status);
    });
    renderTable(filtered);
}

// ── RENDER TABLE ──────────────────────────────────────────────────────────
function renderTable(rows) {
    const tbody = document.getElementById('kitchenTableBody');
    document.getElementById('paginationText').textContent = `1-${rows.length} of ${rows.length}`;

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:#94a3b8;font-weight:600;">No kitchens found</td></tr>';
        return;
    }

    tbody.innerHTML = rows.map((k, i) => `
        <tr>
            <td style="text-align:center;font-weight:700;color:#64748b">${i + 1}</td>
            <td>${getOfficeName(k.officeId)}</td>
            <td>${getWarehouseName(k.warehouseId)}</td>
            <td style="font-weight:700;color:#0f172a">${k.name}</td>
            <td style="text-align:center">${k.assignedItems}</td>
            <td>
<label class="switch" style="position: relative; display: inline-block; width: 44px; height: 22px;">
    <input type="checkbox" ${k.status === 'Active' ? 'checked' : ''} onchange="toggleKitchenStatus(${k.id}, this.checked)" style="opacity: 0; width: 0; height: 0;">
    <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${k.status === 'Active' ? '#10b981' : '#cbd5e1'}; border-radius: 22px; transition: .4s;">
        <span style="position: absolute; content: ''; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: .4s; transform: ${k.status === 'Active' ? 'translateX(22px)' : 'translateX(0)'};"></span>
    </span>
</label>
<span style="font-size: 11px; font-weight: 700; margin-left: 6px; color: ${k.status === 'Active' ? '#10b981' : '#64748b'};">${k.status}</span>
</td>
            <td>
                <div class="kitchen-action-btns" style="justify-content:center">
                    <button class="btn-kitchen-edit"  onclick="openEditModal(${k.id})">Edit</button>
                    
<button class="btn-kitchen-items" onclick="openItemsModal(${k.id})">Items</button>
<button class="btn-modal-cancel" style="padding: 5px 12px; font-size: 12px; background: #fee2e2; color: #dc2626;" onclick="deleteKitchen(${k.id})">Delete</button>

                </div>
            </td>
        </tr>
    `).join('');
}

// ── MODAL ─────────────────────────────────────────────────────────────────
function openCreateModal() {
    document.getElementById('modalTitle').textContent = 'Create New Kitchen';
    document.getElementById('editingId').value = '';
    document.getElementById('modalKitchenName').value = '';
    document.getElementById('modalStatus').value = 'Active';
    populateModalOffice('');
    document.getElementById('kitchenModalOverlay').classList.add('active');
    lucide.createIcons();
}

function openEditModal(id) {
    const k = DATA.kitchens.find(k => k.id === id);
    if (!k) return;
    document.getElementById('modalTitle').textContent = 'Edit Kitchen';
    document.getElementById('editingId').value = id;
    document.getElementById('modalKitchenName').value = k.name;
    document.getElementById('modalStatus').value = k.status;
    populateModalOffice(k.officeId);
    populateModalWarehouse(k.warehouseId);
    document.getElementById('kitchenModalOverlay').classList.add('active');
    lucide.createIcons();
}

function closeModal() {
    document.getElementById('kitchenModalOverlay').classList.remove('active');
}

function populateModalOffice(selectedId) {
    const sel = document.getElementById('modalOffice');
    sel.innerHTML = '<option value="">-- Select Office --</option>';
    DATA.offices.forEach(o => {
        sel.innerHTML += `<option value="${o.id}" ${o.id === selectedId ? 'selected' : ''}>${o.name}</option>`;
    });
    populateModalWarehouse('');
}

function populateModalWarehouse(selectedId) {
    const officeId = document.getElementById('modalOffice').value;
    const sel = document.getElementById('modalWarehouse');
    sel.innerHTML = '<option value="">-- Select Warehouse --</option>';
    DATA.warehouses
        .filter(w => !officeId || w.officeId === officeId)
        .forEach(w => {
            sel.innerHTML += `<option value="${w.id}" ${w.id === selectedId ? 'selected' : ''}>${w.name}</option>`;
        });
}

function saveKitchen() {
    const editId = document.getElementById('editingId').value;
    const officeId = document.getElementById('modalOffice').value;
    const warehouseId = document.getElementById('modalWarehouse').value;
    const name = document.getElementById('modalKitchenName').value.trim();
    const status = document.getElementById('modalStatus').value;

    if (!officeId || !warehouseId || !name) {
        alert('Please fill in Office, Warehouse, and Kitchen Name.');
        return;
    }

    // Uniqueness check: same name in same warehouse
    const duplicate = DATA.kitchens.find(k => 
        k.warehouseId === warehouseId && 
        k.name.toLowerCase() === name.toLowerCase() && 
        (!editId || k.id !== parseInt(editId))
    );
    if (duplicate) {
        alert(`A kitchen named "${name}" already exists in this warehouse.`);
        return;
    }

    if (editId) {
        const k = DATA.kitchens.find(k => k.id === parseInt(editId));
        if (k) { k.officeId = officeId; k.warehouseId = warehouseId; k.name = name; k.status = status; }
    } else {
        DATA.kitchens.push({ id: nextId++, officeId, warehouseId, name, status, assignedItems: 0 });
    }

    closeModal();
    applyFilters();
        if (window.saveKitchenData) window.saveKitchenData();
}

// Close modal on overlay click
document.getElementById('kitchenModalOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// --- ITEMS MODAL LOGIC ---
function openItemsModal(kitchenId) {
    const k = DATA.kitchens.find(k => k.id === kitchenId);
    if (!k) return;
    document.getElementById('itemsModalTitle').textContent = 'Assign Items - ' + k.name + ' (' + getWarehouseName(k.warehouseId) + ')';
    document.getElementById('itemsKitchenId').value = k.id;
    document.getElementById('itemsWarehouseId').value = k.warehouseId;
    document.getElementById('searchAvailable').value = '';
    document.getElementById('searchAssigned').value = '';
    
    renderAvailableItems();
    renderAssignedItems();
    
    document.getElementById('itemsModalOverlay').classList.add('active');
}

function closeItemsModal() {
    document.getElementById('itemsModalOverlay').classList.remove('active');
    applyFilters();
        if (window.saveKitchenData) window.saveKitchenData(); 
}

function renderAvailableItems() {
    const kitchenId = parseInt(document.getElementById('itemsKitchenId').value);
    const warehouseId = document.getElementById('itemsWarehouseId').value;
    const search = document.getElementById('searchAvailable').value.toLowerCase();
    
    const available = DATA.products.filter(p => {
        if (!p.is_kitchen) return false;
        if (search && !p.name.toLowerCase().includes(search)) return false;
        
        const mapping = DATA.kitchenItemMappings.find(m => m.warehouseId === warehouseId && m.itemId === p.id);
        return !mapping;
    });
    
    const list = document.getElementById('availableItemsList');
    list.innerHTML = available.map(p => `<div style="display: flex; align-items: center; padding: 6px; border-bottom: 1px solid #f1f5f9;"><input type="checkbox" class="chk-available" value="${p.id}" style="margin-right: 8px;"> ${p.name} (${p.code})</div>`).join('');
}

function renderAssignedItems() {
    const kitchenId = parseInt(document.getElementById('itemsKitchenId').value);
    const warehouseId = document.getElementById('itemsWarehouseId').value;
    const search = document.getElementById('searchAssigned').value.toLowerCase();
    
    const mappings = DATA.kitchenItemMappings.filter(m => m.kitchenId === kitchenId && m.warehouseId === warehouseId);
    const assigned = mappings.map(m => DATA.products.find(p => p.id === m.itemId)).filter(p => p);
    
    const filtered = assigned.filter(p => !search || p.name.toLowerCase().includes(search));
    
    document.getElementById('assignedCount').textContent = assigned.length;
    
    const list = document.getElementById('assignedItemsList');
    list.innerHTML = filtered.map(p => `<div style="display: flex; align-items: center; padding: 6px; border-bottom: 1px solid #f1f5f9;"><input type="checkbox" class="chk-assigned" value="${p.id}" style="margin-right: 8px;"> ${p.name} (${p.code})  <button onclick="removeSingleItem(${p.id})" style="margin-left: auto; border:none; background:transparent; color:#dc2626; cursor:pointer;">&times;</button></div>`).join('');
}

function assignSelectedItems() {
    const kitchenId = parseInt(document.getElementById('itemsKitchenId').value);
    const warehouseId = document.getElementById('itemsWarehouseId').value;
    const checkboxes = document.querySelectorAll('.chk-available:checked');
    
    checkboxes.forEach(cb => {
        const itemId = parseInt(cb.value);
        DATA.kitchenItemMappings.push({ kitchenId, warehouseId, itemId });
    });
    
    renderAvailableItems();
    renderAssignedItems();
    if (window.saveKitchenData) window.saveKitchenData();
}

function removeSelectedItems() {
    const kitchenId = parseInt(document.getElementById('itemsKitchenId').value);
    const warehouseId = document.getElementById('itemsWarehouseId').value;
    const checkboxes = document.querySelectorAll('.chk-assigned:checked');
    
    const idsToRemove = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    DATA.kitchenItemMappings = DATA.kitchenItemMappings.filter(m => 
        !(m.kitchenId === kitchenId && m.warehouseId === warehouseId && idsToRemove.includes(m.itemId))
    );
    
    renderAvailableItems();
    renderAssignedItems();
    if (window.saveKitchenData) window.saveKitchenData();
}

function removeSingleItem(itemId) {
    const kitchenId = parseInt(document.getElementById('itemsKitchenId').value);
    const warehouseId = document.getElementById('itemsWarehouseId').value;
    
    DATA.kitchenItemMappings = DATA.kitchenItemMappings.filter(m => 
        !(m.kitchenId === kitchenId && m.warehouseId === warehouseId && m.itemId === itemId)
    );
    
    renderAvailableItems();
    renderAssignedItems();
    if (window.saveKitchenData) window.saveKitchenData();
}

function toggleKitchenStatus(id, isActive) {
    const k = DATA.kitchens.find(k => k.id === id);
    if (k) {
        k.status = isActive ? 'Active' : 'Inactive';
        applyFilters();
        if (window.saveKitchenData) window.saveKitchenData();
    }
}

function deleteKitchen(id) {
    const k = DATA.kitchens.find(k => k.id === id);
    if (!k) return;
    
    const assignedCount = DATA.kitchenItemMappings.filter(m => m.kitchenId === id).length;
    if (assignedCount > 0) {
        alert('Cannot delete kitchen because it has ' + assignedCount + ' assigned items. Please remove items first.');
        return;
    }
    
    if (confirm('Are you sure you want to delete kitchen "' + k.name + '"?')) {
        DATA.kitchens = DATA.kitchens.filter(k => k.id !== id);
        applyFilters();
        if (window.saveKitchenData) window.saveKitchenData();
    }
}

const origApplyFilters = applyFilters;
applyFilters = function() {
    DATA.kitchens.forEach(k => {
        k.assignedItems = DATA.kitchenItemMappings.filter(m => m.kitchenId === k.id).length;
    });
    origApplyFilters();
};

// --- PRINT KOT LOGIC ---
function testPrintKOT() {
    // Generate a dummy order based on products in W1 (Dhanmondi Warehouse)
    const orderItems = DATA.products.slice(0, 10).map(p => ({
        ...p,
        qty: Math.floor(Math.random() * 3) + 1
    }));
    
    printKOT('INV-TEST-001', orderItems, 'W1');
}

function printKOT(orderId, items, warehouseId) {
    const bucketA = [];
    const bucketsB = {}; // keyed by kitchenId
    const bucketC = [];
    
    items.forEach(item => {
        if (!item.is_kitchen) {
            bucketA.push(item);
        } else {
            const mapping = DATA.kitchenItemMappings.find(m => m.warehouseId === warehouseId && m.itemId === item.id);
            if (mapping) {
                const k = DATA.kitchens.find(k => k.id === mapping.kitchenId);
                if (k && k.status === 'Active') {
                    if (!bucketsB[k.id]) bucketsB[k.id] = { kitchenName: k.name, items: [] };
                    bucketsB[k.id].items.push(item);
                } else {
                    bucketC.push(item); // Fallback if inactive
                }
            } else {
                bucketC.push(item); // Unmapped
            }
        }
    });
    
    // Generate HTML for print
    let printHtml = '<html><head><title>Print KOT</title><style>body { font-family: monospace; font-size: 14px; } .ticket { margin-bottom: 40px; border-bottom: 2px dashed #000; padding-bottom: 20px; } table { width: 100%; text-align: left; border-collapse: collapse; } th, td { padding: 4px 0; border-bottom: 1px dotted #ccc; } .qty-col { width: 50px; text-align: right; }</style></head><body>';
    
    if (bucketA.length > 0) {
        printHtml += generateTicketHTML(orderId, 'STANDARD RECEIPT', bucketA);
    }
    
    Object.values(bucketsB).forEach(b => {
        if (b.items.length > 0) {
            printHtml += generateTicketHTML(orderId, 'KOT - ' + b.kitchenName, b.items);
        }
    });
    
    if (bucketC.length > 0) {
        printHtml += generateTicketHTML(orderId, 'KOT - UNMAPPED KITCHEN ITEMS', bucketC);
    }
    
    printHtml += '</body></html>';
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHtml);
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        // printWindow.close(); // optional
    }, 500);
}

function generateTicketHTML(orderId, title, items) {
    let html = `<div class="ticket">
        <h2 style="text-align:center; margin:0 0 10px 0;">${title}</h2>
        <div>Order: ${orderId}</div>
        <div>Date: ${new Date().toLocaleString()}</div>
        <hr style="border: 1px dashed #000; margin: 10px 0;">
        <table>
            <thead><tr><th>Item</th><th class="qty-col">Qty</th></tr></thead>
            <tbody>`;
            
    items.forEach(item => {
        html += `<tr><td>${item.name}</td><td class="qty-col">${item.qty}</td></tr>`;
    });
    
    html += `</tbody></table></div>`;
    return html;
}

