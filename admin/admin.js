/* ================================================
   CROWNSTONE SECURITY - Admin Dashboard JavaScript
   Full-Featured Admin Panel with Editing Access
   ================================================
   Features:
   - View, Edit, Delete enquiries
   - Add new enquiry manually
   - Internal notes system per enquiry
   - Duplicate enquiries
   - Print enquiry details
   - Bulk select, status change, delete
   - CSV Export
   - Filtering, Sorting, Search
   - Settings panel
   - Auto-refresh
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ---- DOM Elements ----
    const tableBody = document.getElementById('enquiryTableBody');
    const emptyState = document.getElementById('emptyState');
    const enquiryTable = document.getElementById('enquiryTable');
    const searchInput = document.getElementById('searchInput');
    const filterStatus = document.getElementById('filterStatus');
    const filterService = document.getElementById('filterService');
    const filterSort = document.getElementById('filterSort');
    const resultsCount = document.getElementById('resultsCount');
    const exportBtn = document.getElementById('exportBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const addEnquiryBtn = document.getElementById('addEnquiryBtn');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');

    // Detail Modal
    const detailModal = document.getElementById('detailModal');
    const modalClose = document.getElementById('modalClose');
    const modalBody = document.getElementById('modalBody');
    const modalTitle = document.getElementById('modalTitle');
    const modalStatusSelect = document.getElementById('modalStatusSelect');
    const updateStatusBtn = document.getElementById('updateStatusBtn');
    const duplicateBtn = document.getElementById('duplicateBtn');
    const printBtn = document.getElementById('printBtn');
    const deleteFromModalBtn = document.getElementById('deleteFromModalBtn');

    // Tabs
    const tabView = document.getElementById('tabView');
    const tabEdit = document.getElementById('tabEdit');
    const tabNotes = document.getElementById('tabNotes');
    const tabContentView = document.getElementById('tabContentView');
    const tabContentEdit = document.getElementById('tabContentEdit');
    const tabContentNotes = document.getElementById('tabContentNotes');

    // Edit Form
    const editForm = document.getElementById('editForm');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    // Notes
    const notesList = document.getElementById('notesList');
    const newNoteText = document.getElementById('newNoteText');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const notesBadge = document.getElementById('notesBadge');

    // Add Modal
    const addModal = document.getElementById('addModal');
    const addModalClose = document.getElementById('addModalClose');
    const addEnquiryForm = document.getElementById('addEnquiryForm');
    const cancelAddBtn = document.getElementById('cancelAddBtn');

    // Bulk Actions
    const bulkActionsBar = document.getElementById('bulkActionsBar');
    const selectedCountEl = document.getElementById('selectedCount');
    const bulkStatusBtn = document.getElementById('bulkStatusBtn');
    const bulkMarkReadBtn = document.getElementById('bulkMarkReadBtn');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const bulkDeselectBtn = document.getElementById('bulkDeselectBtn');

    // Bulk Status Modal
    const bulkStatusModal = document.getElementById('bulkStatusModal');
    const bulkStatusClose = document.getElementById('bulkStatusClose');
    const bulkStatusSelect = document.getElementById('bulkStatusSelect');
    const bulkStatusCount = document.getElementById('bulkStatusCount');
    const bulkStatusApplyBtn = document.getElementById('bulkStatusApplyBtn');

    // Sections
    const statsGrid = document.getElementById('statsGrid');
    const tableSection = document.getElementById('tableSection');
    const filtersBar = document.getElementById('filtersBar');
    const settingsSection = document.getElementById('settingsSection');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');

    let currentEnquiryId = null;
    let selectedIds = new Set();
    let autoRefreshInterval = null;

    // ---- Initialize ----
    loadSettings();
    loadDashboard();
    startAutoRefresh();

    // ---- Logout Handler ----
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to sign out?')) {
                localStorage.removeItem('crownstone_admin_auth');
                window.location.href = 'login.html';
            }
        });
    }

    // ==========================================
    // DATA FUNCTIONS
    // ==========================================

    function getEnquiries() {
        const data = localStorage.getItem('crownstone_enquiries');
        return data ? JSON.parse(data) : [];
    }

    function saveEnquiries(enquiries) {
        localStorage.setItem('crownstone_enquiries', JSON.stringify(enquiries));
    }

    function getEnquiryById(id) {
        return getEnquiries().find(e => e.id === id) || null;
    }

    function updateEnquiry(id, updates) {
        const enquiries = getEnquiries();
        const index = enquiries.findIndex(e => e.id === id);
        if (index !== -1) {
            Object.assign(enquiries[index], updates);
            saveEnquiries(enquiries);
        }
        return enquiries;
    }

    function deleteEnquiry(id) {
        const enquiries = getEnquiries().filter(e => e.id !== id);
        saveEnquiries(enquiries);
        return enquiries;
    }

    function addNewEnquiry(data) {
        const enquiries = getEnquiries();
        enquiries.unshift(data);
        saveEnquiries(enquiries);
    }

    function generateId() {
        return 'ENQ-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
    }

    // Notes stored inside each enquiry as an array
    function getNotesForEnquiry(id) {
        const enq = getEnquiryById(id);
        return enq && enq.notes ? enq.notes : [];
    }

    function addNoteToEnquiry(id, noteText) {
        const enquiries = getEnquiries();
        const enq = enquiries.find(e => e.id === id);
        if (!enq) return;
        if (!enq.notes) enq.notes = [];
        enq.notes.push({
            id: 'N-' + Date.now().toString(36),
            text: noteText,
            date: new Date().toISOString()
        });
        saveEnquiries(enquiries);
    }

    function deleteNoteFromEnquiry(enquiryId, noteId) {
        const enquiries = getEnquiries();
        const enq = enquiries.find(e => e.id === enquiryId);
        if (!enq || !enq.notes) return;
        enq.notes = enq.notes.filter(n => n.id !== noteId);
        saveEnquiries(enquiries);
    }

    // ==========================================
    // DASHBOARD & STATS
    // ==========================================

    function loadDashboard() {
        updateStats();
        renderTable();
    }

    function updateStats() {
        const enquiries = getEnquiries();
        const total = enquiries.length;
        const newCount = enquiries.filter(e => e.status === 'new').length;
        const contacted = enquiries.filter(e => e.status === 'contacted').length;
        const completed = enquiries.filter(e => e.status === 'completed').length;

        animateNumber('totalEnquiries', total);
        animateNumber('newEnquiries', newCount);
        animateNumber('contactedEnquiries', contacted);
        animateNumber('completedEnquiries', completed);

        document.getElementById('totalTrend').textContent = `+${total}`;
        document.getElementById('newTrend').textContent = `+${newCount}`;
        document.getElementById('contactedTrend').textContent = contacted.toString();
        document.getElementById('completedTrend').textContent = completed.toString();

        // Sidebar counts
        document.getElementById('enquiryCount').textContent = total;
        document.getElementById('unreadCount').textContent = enquiries.filter(e => !e.read).length;
        document.getElementById('contactedCount').textContent = contacted;
        document.getElementById('completedCount').textContent = completed;
    }

    function animateNumber(elementId, target) {
        const el = document.getElementById(elementId);
        if (!el) return;
        const current = parseInt(el.textContent) || 0;
        if (current === target) return;

        const duration = 400;
        const step = (target - current) / (duration / 16);
        let value = current;

        const timer = setInterval(() => {
            value += step;
            if ((step > 0 && value >= target) || (step < 0 && value <= target)) {
                value = target;
                clearInterval(timer);
            }
            el.textContent = Math.round(value);
        }, 16);
    }

    // ==========================================
    // TABLE RENDERING
    // ==========================================

    function renderTable() {
        let enquiries = getFilteredEnquiries();

        if (enquiries.length === 0) {
            enquiryTable.style.display = 'none';
            emptyState.style.display = 'block';
            resultsCount.textContent = '0 enquiries';
            return;
        }

        enquiryTable.style.display = 'table';
        emptyState.style.display = 'none';
        resultsCount.textContent = `${enquiries.length} enquir${enquiries.length === 1 ? 'y' : 'ies'}`;

        tableBody.innerHTML = enquiries.map(enq => {
            const priority = enq.priority || 'normal';
            const isSelected = selectedIds.has(enq.id);
            const notesCount = (enq.notes && enq.notes.length) || 0;

            return `
            <tr class="${!enq.read ? 'unread' : ''} ${isSelected ? 'selected' : ''}" data-id="${enq.id}">
                <td><input type="checkbox" class="row-checkbox" data-id="${enq.id}" ${isSelected ? 'checked' : ''}></td>
                <td>
                    <span style="font-family:'Outfit',sans-serif;font-weight:600;font-size:0.8rem;color:var(--accent-cyan);">${enq.id}</span>
                    ${priority !== 'normal' ? `<br><span class="priority-dot ${priority}"></span><span style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;">${priority}</span>` : ''}
                </td>
                <td>
                    <div class="customer-name">${escapeHtml(enq.fullName)}</div>
                    <div class="customer-email">${escapeHtml(enq.email)}</div>
                </td>
                <td class="customer-phone">${escapeHtml(enq.phone)}</td>
                <td>${escapeHtml(enq.serviceType)}</td>
                <td>${escapeHtml(enq.propertyType || 'N/A')}</td>
                <td>${formatDate(enq.date)}</td>
                <td><span class="status-badge ${enq.status}">${capitalize(enq.status)}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn view-btn" data-id="${enq.id}" title="View Details">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button class="action-btn edit edit-btn" data-id="${enq.id}" title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="action-btn delete delete-btn" data-id="${enq.id}" title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        }).join('');

        // Event listeners
        tableBody.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => openDetailModal(btn.dataset.id, 'view'));
        });

        tableBody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openDetailModal(btn.dataset.id, 'edit'));
        });

        tableBody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this enquiry?')) {
                    deleteEnquiry(btn.dataset.id);
                    selectedIds.delete(btn.dataset.id);
                    loadDashboard();
                    updateBulkBar();
                    showToast('Enquiry deleted', 'success');
                }
            });
        });

        // Row checkboxes
        tableBody.querySelectorAll('.row-checkbox').forEach(cb => {
            cb.addEventListener('change', () => {
                if (cb.checked) {
                    selectedIds.add(cb.dataset.id);
                } else {
                    selectedIds.delete(cb.dataset.id);
                }
                updateBulkBar();
                updateSelectAllState();
            });
        });

        updateSelectAllState();
    }

    // ==========================================
    // FILTERING & SORTING
    // ==========================================

    function getFilteredEnquiries() {
        let enquiries = getEnquiries();
        const status = filterStatus.value;
        const service = filterService.value;
        const sort = filterSort.value;
        const search = searchInput.value.toLowerCase().trim();

        if (status !== 'all') {
            enquiries = enquiries.filter(e => e.status === status);
        }

        if (service !== 'all') {
            enquiries = enquiries.filter(e => e.serviceType === service);
        }

        if (search) {
            enquiries = enquiries.filter(e =>
                e.fullName.toLowerCase().includes(search) ||
                e.email.toLowerCase().includes(search) ||
                e.phone.includes(search) ||
                e.id.toLowerCase().includes(search) ||
                (e.address && e.address.toLowerCase().includes(search)) ||
                (e.message && e.message.toLowerCase().includes(search))
            );
        }

        switch (sort) {
            case 'newest':
                enquiries.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'oldest':
                enquiries.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'name':
                enquiries.sort((a, b) => a.fullName.localeCompare(b.fullName));
                break;
            case 'priority':
                const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
                enquiries.sort((a, b) => {
                    const readDiff = (a.read ? 1 : 0) - (b.read ? 1 : 0);
                    if (readDiff !== 0) return readDiff;
                    return (priorityOrder[a.priority || 'normal'] || 2) - (priorityOrder[b.priority || 'normal'] || 2);
                });
                break;
        }

        return enquiries;
    }

    filterStatus.addEventListener('change', () => renderTable());
    filterService.addEventListener('change', () => renderTable());
    filterSort.addEventListener('change', () => renderTable());
    searchInput.addEventListener('input', debounce(() => renderTable(), 300));

    // ==========================================
    // SELECT ALL & BULK ACTIONS
    // ==========================================

    selectAllCheckbox.addEventListener('change', () => {
        const checkboxes = tableBody.querySelectorAll('.row-checkbox');
        if (selectAllCheckbox.checked) {
            checkboxes.forEach(cb => {
                cb.checked = true;
                selectedIds.add(cb.dataset.id);
            });
        } else {
            checkboxes.forEach(cb => {
                cb.checked = false;
                selectedIds.delete(cb.dataset.id);
            });
        }
        updateBulkBar();
    });

    function updateSelectAllState() {
        const checkboxes = tableBody.querySelectorAll('.row-checkbox');
        if (checkboxes.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
            return;
        }
        const checkedCount = tableBody.querySelectorAll('.row-checkbox:checked').length;
        selectAllCheckbox.checked = checkedCount === checkboxes.length;
        selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
    }

    function updateBulkBar() {
        if (selectedIds.size > 0) {
            bulkActionsBar.style.display = 'flex';
            selectedCountEl.textContent = selectedIds.size;
        } else {
            bulkActionsBar.style.display = 'none';
        }
    }

    bulkDeselectBtn.addEventListener('click', () => {
        selectedIds.clear();
        renderTable();
        updateBulkBar();
    });

    bulkMarkReadBtn.addEventListener('click', () => {
        const enquiries = getEnquiries();
        enquiries.forEach(e => {
            if (selectedIds.has(e.id)) e.read = true;
        });
        saveEnquiries(enquiries);
        selectedIds.clear();
        loadDashboard();
        updateBulkBar();
        showToast('Marked as read', 'success');
    });

    bulkDeleteBtn.addEventListener('click', () => {
        if (!confirm(`Delete ${selectedIds.size} selected enquiries? This cannot be undone.`)) return;
        let enquiries = getEnquiries().filter(e => !selectedIds.has(e.id));
        saveEnquiries(enquiries);
        selectedIds.clear();
        loadDashboard();
        updateBulkBar();
        showToast('Selected enquiries deleted', 'success');
    });

    bulkStatusBtn.addEventListener('click', () => {
        bulkStatusCount.textContent = selectedIds.size;
        openModalOverlay(bulkStatusModal);
    });

    bulkStatusClose.addEventListener('click', () => closeModalOverlay(bulkStatusModal));
    bulkStatusModal.addEventListener('click', (e) => {
        if (e.target === bulkStatusModal) closeModalOverlay(bulkStatusModal);
    });

    bulkStatusApplyBtn.addEventListener('click', () => {
        const newStatus = bulkStatusSelect.value;
        const enquiries = getEnquiries();
        enquiries.forEach(e => {
            if (selectedIds.has(e.id)) e.status = newStatus;
        });
        saveEnquiries(enquiries);
        selectedIds.clear();
        closeModalOverlay(bulkStatusModal);
        loadDashboard();
        updateBulkBar();
        showToast(`Status changed to "${capitalize(newStatus)}" for selected enquiries`, 'success');
    });

    // ==========================================
    // SIDEBAR NAVIGATION
    // ==========================================

    const navItems = document.querySelectorAll('.sidebar-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;

            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Show/hide sections
            statsGrid.style.display = '';
            tableSection.style.display = '';
            filtersBar.style.display = '';
            settingsSection.style.display = 'none';

            switch (view) {
                case 'dashboard':
                    filterStatus.value = 'all';
                    document.getElementById('pageTitle').textContent = '📊 Dashboard';
                    document.getElementById('dashboardSubtitle').textContent = 'Overview of customer enquiries and activity';
                    break;
                case 'enquiries':
                    filterStatus.value = 'all';
                    document.getElementById('pageTitle').textContent = '📬 All Enquiries';
                    document.getElementById('dashboardSubtitle').textContent = 'Manage all customer enquiries';
                    break;
                case 'new-enquiries':
                    filterStatus.value = 'new';
                    document.getElementById('pageTitle').textContent = '🆕 New Enquiries';
                    document.getElementById('dashboardSubtitle').textContent = 'Unread and new enquiries requiring attention';
                    break;
                case 'contacted':
                    filterStatus.value = 'contacted';
                    document.getElementById('pageTitle').textContent = '📞 Contacted';
                    document.getElementById('dashboardSubtitle').textContent = 'Enquiries that have been contacted';
                    break;
                case 'completed':
                    filterStatus.value = 'completed';
                    document.getElementById('pageTitle').textContent = '✅ Completed';
                    document.getElementById('dashboardSubtitle').textContent = 'Successfully completed enquiries';
                    break;
                case 'add':
                    openAddModal();
                    return;
                case 'settings':
                    document.getElementById('pageTitle').textContent = '⚙️ Settings';
                    document.getElementById('dashboardSubtitle').textContent = 'Admin panel configuration';
                    statsGrid.style.display = 'none';
                    tableSection.style.display = 'none';
                    filtersBar.style.display = 'none';
                    bulkActionsBar.style.display = 'none';
                    settingsSection.style.display = 'block';
                    return;
            }
            renderTable();
        });
    });

    // ==========================================
    // DETAIL MODAL (VIEW / EDIT / NOTES)
    // ==========================================

    function openDetailModal(id, initialTab = 'view') {
        const enq = getEnquiryById(id);
        if (!enq) return;

        currentEnquiryId = id;

        // Mark as read
        updateEnquiry(id, { read: true });
        updateStats();

        modalTitle.textContent = `Enquiry ${enq.id}`;
        modalStatusSelect.value = enq.status;

        // Render view tab
        renderViewTab(enq);

        // Populate edit form
        populateEditForm(enq);

        // Render notes
        renderNotes(enq);

        // Activate initial tab
        switchTab(initialTab);

        openModalOverlay(detailModal);
    }

    function renderViewTab(enq) {
        const priority = enq.priority || 'normal';
        const notesCount = (enq.notes && enq.notes.length) || 0;

        modalBody.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Full Name</span>
                <span class="detail-value">${escapeHtml(enq.fullName)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone</span>
                <span class="detail-value"><a href="tel:${escapeHtml(enq.phone)}" style="color:var(--accent-cyan);">${escapeHtml(enq.phone)}</a></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email</span>
                <span class="detail-value"><a href="mailto:${escapeHtml(enq.email)}" style="color:var(--accent-cyan);">${escapeHtml(enq.email)}</a></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Service Required</span>
                <span class="detail-value">${escapeHtml(enq.serviceType)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Property Type</span>
                <span class="detail-value">${escapeHtml(enq.propertyType || 'Not specified')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Address</span>
                <span class="detail-value">${escapeHtml(enq.address || 'Not provided')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Priority</span>
                <span class="detail-value"><span class="priority-dot ${priority}"></span> ${capitalize(priority)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="detail-value"><span class="status-badge ${enq.status}">${capitalize(enq.status)}</span></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date Submitted</span>
                <span class="detail-value">${formatDateFull(enq.date)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Notes</span>
                <span class="detail-value">${notesCount} note${notesCount !== 1 ? 's' : ''}</span>
            </div>
            <div class="detail-row" style="margin-top:16px; border-top:1px solid var(--border-color); padding-top:16px;">
                <span class="detail-label">Message</span>
                <span class="detail-value" style="line-height:1.8;white-space:pre-wrap;">${escapeHtml(enq.message || 'No message')}</span>
            </div>
        `;
    }

    function populateEditForm(enq) {
        document.getElementById('editFullName').value = enq.fullName || '';
        document.getElementById('editPhone').value = enq.phone || '';
        document.getElementById('editEmail').value = enq.email || '';
        document.getElementById('editServiceType').value = enq.serviceType || 'CCTV Installation';
        document.getElementById('editPropertyType').value = enq.propertyType || 'Not specified';
        document.getElementById('editAddress').value = enq.address || '';
        document.getElementById('editStatus').value = enq.status || 'new';
        document.getElementById('editPriority').value = enq.priority || 'normal';
        document.getElementById('editMessage').value = enq.message || '';
    }

    function renderNotes(enq) {
        const notes = enq.notes || [];
        notesBadge.textContent = notes.length;

        if (notes.length === 0) {
            notesList.innerHTML = '<div class="no-notes">No notes yet. Add an internal note below.</div>';
        } else {
            notesList.innerHTML = notes.map(note => `
                <div class="note-item">
                    <div class="note-header">
                        <span class="note-date">${formatDateFull(note.date)}</span>
                        <button class="note-delete" data-note-id="${note.id}" title="Delete note">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                    <div class="note-text">${escapeHtml(note.text)}</div>
                </div>
            `).join('');

            // Delete note listeners
            notesList.querySelectorAll('.note-delete').forEach(btn => {
                btn.addEventListener('click', () => {
                    deleteNoteFromEnquiry(currentEnquiryId, btn.dataset.noteId);
                    const updatedEnq = getEnquiryById(currentEnquiryId);
                    renderNotes(updatedEnq);
                    showToast('Note deleted', 'success');
                });
            });
        }
    }

    // Tab switching
    function switchTab(tabName) {
        [tabView, tabEdit, tabNotes].forEach(t => t.classList.remove('active'));
        [tabContentView, tabContentEdit, tabContentNotes].forEach(c => c.classList.remove('active'));

        switch (tabName) {
            case 'view':
                tabView.classList.add('active');
                tabContentView.classList.add('active');
                break;
            case 'edit':
                tabEdit.classList.add('active');
                tabContentEdit.classList.add('active');
                break;
            case 'notes':
                tabNotes.classList.add('active');
                tabContentNotes.classList.add('active');
                break;
        }
    }

    tabView.addEventListener('click', () => switchTab('view'));
    tabEdit.addEventListener('click', () => switchTab('edit'));
    tabNotes.addEventListener('click', () => switchTab('notes'));

    // Save edit
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentEnquiryId) return;

        updateEnquiry(currentEnquiryId, {
            fullName: document.getElementById('editFullName').value.trim(),
            phone: document.getElementById('editPhone').value.trim(),
            email: document.getElementById('editEmail').value.trim(),
            serviceType: document.getElementById('editServiceType').value,
            propertyType: document.getElementById('editPropertyType').value,
            address: document.getElementById('editAddress').value.trim(),
            status: document.getElementById('editStatus').value,
            priority: document.getElementById('editPriority').value,
            message: document.getElementById('editMessage').value.trim()
        });

        // Refresh view tab
        const updated = getEnquiryById(currentEnquiryId);
        renderViewTab(updated);
        modalStatusSelect.value = updated.status;
        switchTab('view');
        loadDashboard();
        showToast('Enquiry updated successfully', 'success');
    });

    cancelEditBtn.addEventListener('click', () => {
        const enq = getEnquiryById(currentEnquiryId);
        if (enq) populateEditForm(enq);
        switchTab('view');
    });

    // Add note
    addNoteBtn.addEventListener('click', () => {
        const text = newNoteText.value.trim();
        if (!text) {
            showToast('Please enter a note', 'error');
            return;
        }
        addNoteToEnquiry(currentEnquiryId, text);
        newNoteText.value = '';
        const enq = getEnquiryById(currentEnquiryId);
        renderNotes(enq);
        renderViewTab(enq);
        showToast('Note added', 'success');
    });

    // Update status from modal
    updateStatusBtn.addEventListener('click', () => {
        if (!currentEnquiryId) return;
        updateEnquiry(currentEnquiryId, { status: modalStatusSelect.value });
        const enq = getEnquiryById(currentEnquiryId);
        renderViewTab(enq);
        populateEditForm(enq);
        loadDashboard();
        showToast('Status updated to ' + capitalize(modalStatusSelect.value), 'success');
    });

    // Duplicate
    duplicateBtn.addEventListener('click', () => {
        const enq = getEnquiryById(currentEnquiryId);
        if (!enq) return;

        const duplicate = {
            ...enq,
            id: generateId(),
            date: new Date().toISOString(),
            status: 'new',
            read: false,
            notes: []
        };
        addNewEnquiry(duplicate);
        closeModalOverlay(detailModal);
        loadDashboard();
        showToast('Enquiry duplicated', 'success');
    });

    // Print
    printBtn.addEventListener('click', () => {
        window.print();
    });

    // Delete from modal
    deleteFromModalBtn.addEventListener('click', () => {
        if (!confirm('Delete this enquiry permanently?')) return;
        deleteEnquiry(currentEnquiryId);
        closeModalOverlay(detailModal);
        loadDashboard();
        showToast('Enquiry deleted', 'success');
    });

    // Close detail modal
    modalClose.addEventListener('click', () => closeModalOverlay(detailModal));
    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) closeModalOverlay(detailModal);
    });

    // ==========================================
    // ADD NEW ENQUIRY MODAL
    // ==========================================

    function openAddModal() {
        addEnquiryForm.reset();
        openModalOverlay(addModal);
    }

    addEnquiryBtn.addEventListener('click', openAddModal);

    addEnquiryForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const newEnq = {
            id: generateId(),
            fullName: document.getElementById('addFullName').value.trim(),
            phone: document.getElementById('addPhone').value.trim(),
            email: document.getElementById('addEmail').value.trim(),
            serviceType: document.getElementById('addServiceType').value,
            propertyType: document.getElementById('addPropertyType').value || 'Not specified',
            address: document.getElementById('addAddress').value.trim() || 'Not provided',
            message: document.getElementById('addMessage').value.trim() || 'No message',
            status: document.getElementById('addStatus').value,
            priority: document.getElementById('addPriority').value,
            date: new Date().toISOString(),
            read: true,
            notes: []
        };

        if (!newEnq.fullName || !newEnq.phone || !newEnq.email || !newEnq.serviceType) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        addNewEnquiry(newEnq);
        closeModalOverlay(addModal);
        loadDashboard();
        showToast('New enquiry created: ' + newEnq.id, 'success');
    });

    cancelAddBtn.addEventListener('click', () => closeModalOverlay(addModal));
    addModalClose.addEventListener('click', () => closeModalOverlay(addModal));
    addModal.addEventListener('click', (e) => {
        if (e.target === addModal) closeModalOverlay(addModal);
    });

    // ==========================================
    // EXPORT CSV
    // ==========================================

    exportBtn.addEventListener('click', () => {
        const enquiries = getEnquiries();
        if (enquiries.length === 0) {
            showToast('No enquiries to export', 'error');
            return;
        }

        const headers = ['ID', 'Full Name', 'Phone', 'Email', 'Service', 'Property Type', 'Address', 'Message', 'Status', 'Priority', 'Date', 'Notes Count'];
        const rows = enquiries.map(e => [
            e.id,
            `"${(e.fullName || '').replace(/"/g, '""')}"`,
            e.phone,
            e.email,
            e.serviceType,
            e.propertyType || '',
            `"${(e.address || '').replace(/"/g, '""')}"`,
            `"${(e.message || '').replace(/"/g, '""')}"`,
            e.status,
            e.priority || 'normal',
            formatDateFull(e.date),
            (e.notes && e.notes.length) || 0
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `crownstone_enquiries_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);

        showToast('CSV exported successfully', 'success');
    });

    // ==========================================
    // CLEAR ALL
    // ==========================================

    clearAllBtn.addEventListener('click', () => {
        const count = getEnquiries().length;
        if (count === 0) {
            showToast('No enquiries to clear', 'error');
            return;
        }
        if (confirm(`⚠️ Delete ALL ${count} enquiries? This cannot be undone.`)) {
            localStorage.removeItem('crownstone_enquiries');
            selectedIds.clear();
            loadDashboard();
            updateBulkBar();
            showToast('All enquiries cleared', 'success');
        }
    });

    // ==========================================
    // SETTINGS
    // ==========================================

    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('crownstone_settings') || '{}');
        if (settings.refresh) document.getElementById('settingRefresh').value = settings.refresh;
        if (settings.defaultSort) document.getElementById('settingSort').value = settings.defaultSort;
        if (settings.company) document.getElementById('settingCompany').value = settings.company;
        if (settings.email) document.getElementById('settingEmail').value = settings.email;

        // Contact info fields
        if (settings.phone) document.getElementById('settingPhone').value = settings.phone;
        if (settings.phone2) document.getElementById('settingPhone2').value = settings.phone2;
        if (settings.contactEmail) document.getElementById('settingContactEmail').value = settings.contactEmail;
        if (settings.address1) document.getElementById('settingAddress1').value = settings.address1;
        if (settings.address2) document.getElementById('settingAddress2').value = settings.address2;

        // Apply default sort
        if (settings.defaultSort) {
            filterSort.value = settings.defaultSort;
        }
    }

    saveSettingsBtn.addEventListener('click', () => {
        const settings = {
            refresh: document.getElementById('settingRefresh').value,
            defaultSort: document.getElementById('settingSort').value,
            company: document.getElementById('settingCompany').value,
            email: document.getElementById('settingEmail').value,
            phone: document.getElementById('settingPhone').value.trim(),
            phone2: document.getElementById('settingPhone2').value.trim(),
            contactEmail: document.getElementById('settingContactEmail').value.trim(),
            address1: document.getElementById('settingAddress1').value.trim(),
            address2: document.getElementById('settingAddress2').value.trim()
        };
        localStorage.setItem('crownstone_settings', JSON.stringify(settings));
        filterSort.value = settings.defaultSort;
        startAutoRefresh();
        showToast('Settings saved — website contact info updated!', 'success');
    });

    // ==========================================
    // AUTO-REFRESH
    // ==========================================

    function startAutoRefresh() {
        if (autoRefreshInterval) clearInterval(autoRefreshInterval);
        const settings = JSON.parse(localStorage.getItem('crownstone_settings') || '{}');
        const interval = parseInt(settings.refresh) || 10000;
        if (interval > 0) {
            autoRefreshInterval = setInterval(() => {
                updateStats();
                renderTable();
            }, interval);
        }
    }

    // ==========================================
    // MOBILE SIDEBAR
    // ==========================================

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 &&
                !sidebar.contains(e.target) &&
                !sidebarToggle.contains(e.target) &&
                sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });
    }

    // ESC closes any modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModalOverlay(detailModal);
            closeModalOverlay(addModal);
            closeModalOverlay(bulkStatusModal);
        }
    });

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================

    function openModalOverlay(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModalOverlay(modal) {
        modal.classList.remove('active');
        // Only restore scroll if no other modal is open
        const anyOpen = document.querySelector('.modal-overlay.active');
        if (!anyOpen) document.body.style.overflow = '';
        if (modal === detailModal) currentEnquiryId = null;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    function formatDateFull(dateStr) {
        return new Date(dateStr).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function debounce(fn, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    }

    function showToast(message, type = 'success') {
        const existing = document.querySelector('.notification-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `notification-toast ${type}`;
        toast.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${type === 'success'
                    ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
                    : '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'}
            </svg>
            <span>${message}</span>
        `;

        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%) translateY(100px)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 24px',
            background: type === 'success' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 71, 87, 0.15)',
            border: `1px solid ${type === 'success' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 71, 87, 0.3)'}`,
            borderRadius: '50px',
            color: type === 'success' ? '#00ff88' : '#ff4757',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9rem',
            fontWeight: '500',
            zIndex: '9999',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            transition: 'transform 0.4s ease',
        });

        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(100px)';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

});
