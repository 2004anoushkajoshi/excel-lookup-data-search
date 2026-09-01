// app.js
// Main Controller for GlanceX Directory Engine with Tab Session Isolation, Password Toggles & SVG Aesthetics

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const btnModeIndependent = document.getElementById('btnModeIndependent');
    const btnModeDependent = document.getElementById('btnModeDependent');
    const badgeText = document.getElementById('badgeText');
    const userAccountChip = document.getElementById('userAccountChip');
    const chipUsername = document.getElementById('chipUsername');
    const chipRole = document.getElementById('chipRole');
    const btnHeaderLogout = document.getElementById('btnHeaderLogout');

    // Independent Controls
    const independentUploadPanel = document.getElementById('independentUploadPanel');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfoBox = document.getElementById('fileInfoBox');
    const fileName = document.getElementById('fileName');
    const fileMeta = document.getElementById('fileMeta');
    const btnRemoveFile = document.getElementById('btnRemoveFile');
    const settingsPanel = document.getElementById('settingsPanel');
    const sheetSelect = document.getElementById('sheetSelect');

    // Dependent Controls
    const dependentFileStatusPanel = document.getElementById('dependentFileStatusPanel');
    const depFileName = document.getElementById('depFileName');
    const depFileMeta = document.getElementById('depFileMeta');
    const depExpiryBadge = document.getElementById('depExpiryBadge');
    const offlineCacheBadge = document.getElementById('offlineCacheBadge');
    const depSettingsPanel = document.getElementById('depSettingsPanel');
    const depSheetSelect = document.getElementById('depSheetSelect');

    // Login Card
    const loginCard = document.getElementById('loginCard');
    const loginForm = document.getElementById('loginForm');
    const loginUsername = document.getElementById('loginUsername');
    const loginPassword = document.getElementById('loginPassword');

    // Admin Navigation & Tabs
    const adminTabsBar = document.getElementById('adminTabsBar');
    const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
    const adminTabContents = document.querySelectorAll('.admin-tab-content');
    
    // Admin Upload Tab
    const adminUploadForm = document.getElementById('adminUploadForm');
    const adminDropZone = document.getElementById('adminDropZone');
    const adminFileInput = document.getElementById('adminFileInput');
    const adminFilePreview = document.getElementById('adminFilePreview');
    const expirySelect = document.getElementById('expirySelect');
    const customDateGroup = document.getElementById('customDateGroup');
    const customExpiryDate = document.getElementById('customExpiryDate');
    const btnAdminUploadSubmit = document.getElementById('btnAdminUploadSubmit');
    const activeFileStatusBox = document.getElementById('activeFileStatusBox');
    const btnAdminClearSheet = document.getElementById('btnAdminClearSheet');

    // Admin User Management Tab
    const createUserForm = document.getElementById('createUserForm');
    const newUsername = document.getElementById('newUsername');
    const newPassword = document.getElementById('newPassword');
    const newContact = document.getElementById('newContact');
    const userTableBody = document.getElementById('userTableBody');

    // Admin Reset User Password Modal
    const adminResetUserModal = document.getElementById('adminResetUserModal');
    const adminResetUserForm = document.getElementById('adminResetUserForm');
    const resetTargetUsername = document.getElementById('resetTargetUsername');
    const adminVerifyPass = document.getElementById('adminVerifyPass');
    const resetUserNewPass = document.getElementById('resetUserNewPass');
    const resetUserConfirmPass = document.getElementById('resetUserConfirmPass');
    const btnCloseAdminResetModal = document.getElementById('btnCloseAdminResetModal');
    const btnCancelAdminResetModal = document.getElementById('btnCancelAdminResetModal');
    let resetTargetUserId = null;

    // Admin Security Tab
    const adminChangePassForm = document.getElementById('adminChangePassForm');
    const adminCurrentPass = document.getElementById('adminCurrentPass');
    const adminNewPass = document.getElementById('adminNewPass');
    const adminConfirmPass = document.getElementById('adminConfirmPass');

    // Normal User Bar & Password Modal
    const userInfoBar = document.getElementById('userInfoBar');
    const loggedNormalUsername = document.getElementById('loggedNormalUsername');
    const loggedNormalContact = document.getElementById('loggedNormalContact');
    const btnUserLogout = document.getElementById('btnUserLogout');
    const btnUserChangePassModal = document.getElementById('btnUserChangePassModal');
    const userPassModal = document.getElementById('userPassModal');
    const btnCloseUserPassModal = document.getElementById('btnCloseUserPassModal');
    const btnCancelUserPassModal = document.getElementById('btnCancelUserPassModal');
    const userChangePassForm = document.getElementById('userChangePassForm');
    const userCurrentPass = document.getElementById('userCurrentPass');
    const userNewPass = document.getElementById('userNewPass');
    const userConfirmPass = document.getElementById('userConfirmPass');

    // Search Query & Results
    const searchForm = document.getElementById('searchForm');
    const phoneInput = document.getElementById('phoneInput');
    const btnSearch = document.getElementById('btnSearch');
    const searchSpinner = document.getElementById('searchSpinner');
    const resultsHeader = document.getElementById('resultsHeader');
    const resultsCount = document.getElementById('resultsCount');
    const resultsGrid = document.getElementById('resultsGrid');
    const emptyState = document.getElementById('emptyState');
    const emptyStateDescription = document.getElementById('emptyStateDescription');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');

    // Privacy Monitor
    const monitorBtn = document.getElementById('monitorBtn');
    const privacyPanel = document.getElementById('privacyPanel');
    const networkLog = document.getElementById('networkLog');
    const dataSentVal = document.getElementById('dataSentVal');
    const securityAuditText = document.getElementById('securityAuditText');

    // --- STATE MANAGEMENT (SESSION-ISOLATED PER TAB) ---
    let currentMode = 'independent';
    let worker = null;
    let excelFile = null;
    let adminSelectedFile = null;
    let isFileLoaded = false;

    // Use sessionStorage so every open browser tab has its own isolated session space!
    let authToken = sessionStorage.getItem('glancex_jwt_token') || null;
    let currentUser = JSON.parse(sessionStorage.getItem('glancex_user_info') || 'null');

    // --- PASSWORD EYE TOGGLE BUTTONS ---
    document.querySelectorAll('.btn-toggle-pass').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;

            if (input.type === 'password') {
                input.type = 'text';
                btn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
            } else {
                input.type = 'password';
                btn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
        });
    });

    // --- ISOLATED PRIVACY SHIELD NETWORK MONITOR ---
    function logPrivacyEvent(message, type = 'SECURITY') {
        const time = new Date().toLocaleTimeString();
        const logItem = document.createElement('div');
        logItem.className = 'network-log-item';
        
        let color = '#34d399';
        if (type === 'BLOCK') color = '#fbbf24';
        if (type === 'ALERT') color = '#f87171';
        if (type === 'SYSTEM') color = '#60a5fa';
        
        logItem.innerHTML = `
            <span class="time">[${time}]</span>
            <span class="type" style="color: ${color}; font-weight: 600;">[${type}]</span>
            <span class="msg">${message}</span>
        `;
        
        networkLog.appendChild(logItem);
        networkLog.scrollTop = networkLog.scrollHeight;
    }

    function initializePrivacyShield() {
        networkLog.innerHTML = '';
        logPrivacyEvent('Privacy Shield Module Active (Tab Isolated).', 'SYSTEM');
        if (currentMode === 'independent') {
            dataSentVal.textContent = '0 Bytes (Local RAM Search)';
            securityAuditText.textContent = '100% In-Browser Privacy';
            logPrivacyEvent('Independent Mode: 100% client-side zero-network search isolation.', 'SECURITY');
        } else {
            dataSentVal.textContent = '0 Bytes (Search Queries Local)';
            securityAuditText.textContent = 'JWT & AES-256 Cloud Encrypted';
            logPrivacyEvent('Dependent Mode: JWT Bearer Auth & AES-256 Cloud Encryption active.', 'SECURITY');
        }
    }

    monitorBtn.addEventListener('click', () => {
        privacyPanel.classList.toggle('active');
        monitorBtn.classList.toggle('active');
    });

    initializePrivacyShield();

    // --- ACTIVE REAL-TIME NETWORK TRAFFIC INTERCEPTOR ---
    let totalSearchQueryBytesSent = 0;
    const originalFetch = window.fetch;

    window.fetch = async function (url, options = {}) {
        let bodySize = 0;
        if (options && options.body) {
            try {
                if (typeof options.body === 'string') {
                    bodySize = new Blob([options.body]).size;
                } else if (options.body instanceof FormData || options.body instanceof Blob) {
                    bodySize = options.body.size || 0;
                }
            } catch (e) {}
        }

        const urlStr = String(url);

        if (currentMode === 'independent') {
            if (urlStr.includes('/api/')) {
                dataSentVal.textContent = `${bodySize} Bytes (LEAK DETECTED & BLOCKED)`;
                dataSentVal.style.color = '#f87171';
                logPrivacyEvent(`ALERT: Unexpected network fetch attempt to "${urlStr}" (${bodySize} bytes). Intercepted & Blocked!`, 'ALERT');
                throw new Error('Independent Mode: Network requests blocked to enforce zero-leak privacy.');
            }
        } else {
            if (bodySize > 0) {
                totalSearchQueryBytesSent += bodySize;
                dataSentVal.textContent = `${totalSearchQueryBytesSent.toLocaleString()} Bytes (Auth & Sync)`;
                logPrivacyEvent(`Network payload sent to ${urlStr}: ${bodySize} bytes over SSL/TLS.`, 'SYSTEM');
            }
        }

        return originalFetch.apply(this, arguments);
    };

    // --- WEB WORKER INITIALIZATION ---
    function initWorker() {
        if (worker) {
            worker.terminate();
        }
        
        worker = new Worker('worker.js?v=' + Date.now());
        logPrivacyEvent('Web Worker spawned for background file parsing.', 'SYSTEM');

        worker.onmessage = function (e) {
            const { status, payload } = e.data;

            if (status === 'loaded') {
                isFileLoaded = true;
                
                if (currentMode === 'independent') {
                    updateIndepProgress(100, 'Data Parsed & Ready for Search!');
                    setTimeout(() => hideIndepProgress(), 1500);
                } else {
                    updateAdminProgress(100, '✅ 100% Published, Encrypted & Ready for Search!');
                    setTimeout(() => hideAdminProgress(), 2000);
                }

                const sheetSelectElem = (currentMode === 'dependent') ? depSheetSelect : sheetSelect;
                const settingsPanelElem = (currentMode === 'dependent') ? depSettingsPanel : settingsPanel;

                if (currentMode === 'independent') {
                    const dropZoneIcon = document.getElementById('dropZoneIcon');
                    const btnRemoveIndepFile = document.getElementById('btnRemoveIndepFile');
                    const dropZoneTitle = document.getElementById('dropZoneTitle');
                    const dropZoneSubtext = document.getElementById('dropZoneSubtext');
                    
                    if (dropZoneIcon) dropZoneIcon.style.display = 'none';
                    if (btnRemoveIndepFile) btnRemoveIndepFile.style.display = 'flex';
                    if (dropZoneTitle && excelFile) dropZoneTitle.innerHTML = `<strong>${excelFile.name}</strong>`;
                    if (dropZoneSubtext) dropZoneSubtext.textContent = `${payload.rowCount.toLocaleString()} rows • ${payload.selectedSheet}`;
                } else if (depFileMeta) {
                    depFileMeta.textContent = `${payload.rowCount.toLocaleString()} rows • ${payload.sheetNames.length} sheet(s)`;
                }

                sheetSelectElem.innerHTML = '';
                payload.sheetNames.forEach(name => {
                    const option = document.createElement('option');
                    option.value = name;
                    option.textContent = name;
                    sheetSelectElem.appendChild(option);
                });
                
                btnSearch.removeAttribute('disabled');
                phoneInput.removeAttribute('disabled');
                settingsPanelElem.style.display = 'flex';
                
                logPrivacyEvent(`Parsed worksheet "${payload.selectedSheet}" in memory (${payload.rowCount} rows).`, 'SECURITY');
                showToast(`Data parsed! ${payload.rowCount} rows ready for search.`);
            } 
            else if (status === 'sheetChanged') {
                if (currentMode === 'independent') {
                    const dropZoneSubtext = document.getElementById('dropZoneSubtext');
                    if (dropZoneSubtext) dropZoneSubtext.textContent = `✅ ${payload.rowCount.toLocaleString()} rows • ${payload.selectedSheet} • Click to change file`;
                } else if (depFileMeta) {
                    depFileMeta.textContent = `${payload.rowCount.toLocaleString()} rows • ${payload.selectedSheet}`;
                }
                logPrivacyEvent(`Switched active worksheet to: "${payload.selectedSheet}".`, 'SECURITY');
                showToast(`Switched worksheet to "${payload.selectedSheet}"`);
            } 
            else if (status === 'searchCompleted') {
                searchSpinner.classList.remove('active');
                btnSearch.removeAttribute('disabled');
                renderSearchResults(payload.results, payload.query);
                logPrivacyEvent(`Search finished for "${payload.query}". Found ${payload.results.length} record(s).`, 'SECURITY');
            } 
            else if (status === 'error') {
                searchSpinner.classList.remove('active');
                btnSearch.removeAttribute('disabled');
                logPrivacyEvent(`Worker Error: ${payload.message}`, 'ALERT');
                showToast(payload.message, 'error');
            }
        };

        worker.onerror = function (err) {
            searchSpinner.classList.remove('active');
            btnSearch.removeAttribute('disabled');
            logPrivacyEvent(`Worker Thread Error: ${err.message}`, 'ALERT');
            showToast(`Parsing error: ${err.message}`, 'error');
        };
    }

    initWorker();

    // --- MODE SWITCHER LOGIC ---
    btnModeIndependent.addEventListener('click', () => setMode('independent'));
    btnModeDependent.addEventListener('click', () => setMode('dependent'));

    function setMode(mode) {
        currentMode = mode;
        resetFileState();

        if (mode === 'independent') {
            btnModeIndependent.classList.add('active');
            btnModeDependent.classList.remove('active');
            badgeText.textContent = 'Independent Local Sandbox';

            independentUploadPanel.style.display = 'flex';
            dependentFileStatusPanel.style.display = 'none';
            loginCard.style.display = 'none';
            adminTabsBar.style.display = 'none';
            userInfoBar.style.display = 'none';
            userAccountChip.style.display = 'none';
            document.getElementById('mainDashboardGrid').style.display = 'grid';
            hideAllAdminTabContents();

            emptyStateDescription.textContent = 'Upload any local Excel/CSV sheet. Data parsing and searching happen 100% locally in your browser memory without logging in.';

            dataSentVal.textContent = '0 Bytes (Local RAM Search)';
            securityAuditText.textContent = '100% In-Browser Privacy';
            logPrivacyEvent('Switched to Independent Mode (Local Sandbox).', 'SYSTEM');
            logPrivacyEvent('Zero-network search query isolation enforced. No data sent to server.', 'SECURITY');
        } else {
            btnModeDependent.classList.add('active');
            btnModeIndependent.classList.remove('active');
            badgeText.textContent = 'Centralized Auth & AES-256';
            independentUploadPanel.style.display = 'none';

            emptyStateDescription.textContent = 'Centralized Shared Directory Mode. Log in as Admin to manage users and upload shared sheets, or log in as User to search shared sheets.';

            dataSentVal.textContent = '0 Bytes (Search Queries Local)';
            securityAuditText.textContent = 'JWT & AES-256 Cloud Encrypted';
            logPrivacyEvent('Switched to Dependent Mode (Centralized Shared Sheets).', 'SYSTEM');
            logPrivacyEvent('Security Policy: JWT Auth & AES-256 Encrypted MongoDB storage active.', 'SECURITY');

            verifyAuthAndRenderDependentUI();
        }
    }

    function hideAllAdminTabContents() {
        adminTabContents.forEach(c => c.style.display = 'none');
    }

    // --- AUTHENTICATION & DEPENDENT UI MANAGEMENT ---
    async function verifyAuthAndRenderDependentUI() {
        if (!authToken) {
            showLoginCard();
            return;
        }

        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await res.json();

            if (!res.ok) {
                clearAuthSession();
                showLoginCard();
                return;
            }

            currentUser = data.user;
            sessionStorage.setItem('glancex_user_info', JSON.stringify(currentUser));
            renderUserDashboard(currentUser);
        } catch (err) {
            logPrivacyEvent('Network offline during session check. Using tab-cached credentials.', 'BLOCK');
            if (currentUser) {
                renderUserDashboard(currentUser);
            } else {
                showLoginCard();
            }
        }
    }

    function showLoginCard() {
        loginCard.style.display = 'flex';
        adminTabsBar.style.display = 'none';
        userInfoBar.style.display = 'none';
        dependentFileStatusPanel.style.display = 'none';
        userAccountChip.style.display = 'none';
        document.getElementById('mainDashboardGrid').style.display = 'none';
        hideAllAdminTabContents();
    }

    function renderUserDashboard(user) {
        loginCard.style.display = 'none';
        userAccountChip.style.display = 'flex';
        chipUsername.textContent = user.username;
        chipRole.textContent = user.role;

        if (user.role === 'admin') {
            adminTabsBar.style.display = 'block';
            userInfoBar.style.display = 'none';
            
            // Open Admin Upload & Control Dashboard by default upon login
            switchAdminTab('tab-upload');

            // Fetch active sheet & user list
            fetchAdminActiveFileMeta();
            loadUserDirectory();
            loadActiveSharedSheet();
        } else {
            // Normal User
            adminTabsBar.style.display = 'none';
            hideAllAdminTabContents();
            document.getElementById('mainDashboardGrid').style.display = 'grid';
            userInfoBar.style.display = 'flex';
            dependentFileStatusPanel.style.display = 'flex';
            
            loggedNormalUsername.textContent = user.username;
            loggedNormalContact.textContent = `Contact: ${user.contactNumber || 'Not specified'}`;

            // Load shared sheet for normal user
            loadActiveSharedSheet();
        }
    }

    function clearAuthSession() {
        authToken = null;
        currentUser = null;
        sessionStorage.removeItem('glancex_jwt_token');
        sessionStorage.removeItem('glancex_user_info');
    }

    // Login Form Handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = loginUsername.value.trim();
        const password = loginPassword.value.trim();

        if (!username || !password) {
            showToast('Please enter both username and password.', 'error');
            return;
        }

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || 'Login failed', 'error');
                logPrivacyEvent(`Login failed for username "${username}": ${data.error}`, 'ALERT');
                return;
            }

            authToken = data.token;
            currentUser = data.user;
            sessionStorage.setItem('glancex_jwt_token', authToken);
            sessionStorage.setItem('glancex_user_info', JSON.stringify(currentUser));

            showToast(`Welcome back, ${currentUser.username}!`);
            logPrivacyEvent(`User "${currentUser.username}" logged in successfully (${currentUser.role}).`, 'SECURITY');

            renderUserDashboard(currentUser);
        } catch (err) {
            showToast('Unable to connect to authentication server.', 'error');
            logPrivacyEvent(`Login network error: ${err.message}`, 'ALERT');
        }
    });

    const btnAdminNavLogout = document.getElementById('btnAdminNavLogout');

    // Logout Handlers
    btnHeaderLogout.addEventListener('click', handleLogout);
    btnUserLogout.addEventListener('click', handleLogout);
    if (btnAdminNavLogout) btnAdminNavLogout.addEventListener('click', handleLogout);

    function handleLogout() {
        clearAuthSession();
        resetFileState();
        initializePrivacyShield();
        showToast('Logged out successfully.');
        logPrivacyEvent('Session logged out.', 'SYSTEM');
        showLoginCard();
    }

    // --- ADMIN NAVIGATION TABS ---
    adminTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchAdminTab(targetTab);
        });
    });

    function switchAdminTab(tabId) {
        adminTabBtns.forEach(b => b.classList.remove('active'));
        adminTabContents.forEach(c => c.style.display = 'none');

        const activeBtn = Array.from(adminTabBtns).find(b => b.getAttribute('data-tab') === tabId);
        if (activeBtn) activeBtn.classList.add('active');

        const mainDashboardGrid = document.getElementById('mainDashboardGrid');

        if (tabId === 'tab-search') {
            mainDashboardGrid.style.display = 'grid';
            dependentFileStatusPanel.style.display = 'flex';
            if (!isFileLoaded) {
                loadActiveSharedSheet();
            }
        } else {
            mainDashboardGrid.style.display = 'none';
            const activeContent = document.getElementById(tabId);
            if (activeContent) activeContent.style.display = 'block';
        }

        if (tabId === 'tab-users') {
            loadUserDirectory();
        }

        if (tabId === 'tab-security') {
            resetAdminChangePassForm();
        }
    }

    function resetAdminChangePassForm() {
        if (adminCurrentPass) { adminCurrentPass.value = ''; adminCurrentPass.type = 'password'; }
        if (adminNewPass) { adminNewPass.value = ''; adminNewPass.type = 'password'; }
        if (adminConfirmPass) { adminConfirmPass.value = ''; adminConfirmPass.type = 'password'; }
        resetEyeIcons(['adminCurrentPass', 'adminNewPass', 'adminConfirmPass']);
    }

    // --- ADMIN FILE UPLOAD & EXPIRY ---
    const btnRemoveAdminFile = document.getElementById('btnRemoveAdminFile');
    if (btnRemoveAdminFile) {
        btnRemoveAdminFile.addEventListener('click', (e) => {
            e.stopPropagation();
            resetAdminSelectedFile();
        });
    }

    function resetAdminSelectedFile() {
        adminSelectedFile = null;
        adminFileInput.value = '';
        const adminDropZoneIcon = document.getElementById('adminDropZoneIcon');
        const btnRemoveAdminFileElem = document.getElementById('btnRemoveAdminFile');
        const adminDropZoneTitle = document.getElementById('adminDropZoneTitle');
        const adminDropZoneSubtext = document.getElementById('adminDropZoneSubtext');

        if (adminDropZoneIcon) adminDropZoneIcon.style.display = 'block';
        if (btnRemoveAdminFileElem) btnRemoveAdminFileElem.style.display = 'none';
        if (adminDropZoneTitle) adminDropZoneTitle.innerHTML = 'Click or drag file to upload shared sheet';
        if (adminDropZoneSubtext) adminDropZoneSubtext.textContent = 'Supports .xlsx, .xls, .csv';
        if (adminDropZone) adminDropZone.classList.remove('file-loaded');
        if (btnAdminUploadSubmit) btnAdminUploadSubmit.setAttribute('disabled', 'true');
    }

    function setAdminSelectedFile(file) {
        adminSelectedFile = file;
        const adminDropZoneIcon = document.getElementById('adminDropZoneIcon');
        const btnRemoveAdminFileElem = document.getElementById('btnRemoveAdminFile');
        const adminDropZoneTitle = document.getElementById('adminDropZoneTitle');
        const adminDropZoneSubtext = document.getElementById('adminDropZoneSubtext');

        if (adminDropZoneIcon) adminDropZoneIcon.style.display = 'none';
        if (btnRemoveAdminFileElem) btnRemoveAdminFileElem.style.display = 'flex';
        if (adminDropZoneTitle) adminDropZoneTitle.innerHTML = `<strong>${file.name}</strong>`;
        if (adminDropZoneSubtext) adminDropZoneSubtext.textContent = `${formatBytes(file.size)} • Click to change file`;
        if (adminDropZone) adminDropZone.classList.add('file-loaded');
        if (btnAdminUploadSubmit) btnAdminUploadSubmit.removeAttribute('disabled');
    }

    expirySelect.addEventListener('change', (e) => {
        customDateGroup.style.display = (e.target.value === 'custom') ? 'flex' : 'none';
    });

    adminDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        adminDropZone.classList.add('dragover');
    });

    adminDropZone.addEventListener('dragleave', () => {
        adminDropZone.classList.remove('dragover');
    });

    adminDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        adminDropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            setAdminSelectedFile(e.dataTransfer.files[0]);
        }
    });

    adminDropZone.addEventListener('click', () => adminFileInput.click());

    adminFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            setAdminSelectedFile(e.target.files[0]);
        }
    });

    function updateAdminProgress(percent, statusText) {
        const wrapper = document.getElementById('adminProgressWrapper');
        const fill = document.getElementById('adminProgressBarFill');
        const text = document.getElementById('adminProgressStatus');
        const percentVal = document.getElementById('adminProgressPercent');

        if (wrapper) wrapper.style.display = 'flex';
        if (fill) fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        if (percentVal) percentVal.textContent = `${Math.min(100, Math.max(0, percent))}%`;
        if (text) text.textContent = statusText;
    }

    function hideAdminProgress() {
        const wrapper = document.getElementById('adminProgressWrapper');
        if (wrapper) wrapper.style.display = 'none';
    }

    adminUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!adminSelectedFile) {
            showToast('Please select an Excel or CSV file to upload.', 'error');
            return;
        }

        const activeToken = authToken || sessionStorage.getItem('glancex_jwt_token');
        const formData = new FormData();
        formData.append('sheetFile', adminSelectedFile);
        formData.append('expiryType', expirySelect.value);
        if (expirySelect.value === 'custom' && customExpiryDate.value) {
            formData.append('customDate', customExpiryDate.value);
        }

        updateAdminProgress(5, 'Encrypting & preparing upload...');
        btnAdminUploadSubmit.setAttribute('disabled', 'true');

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/file/upload', true);
        xhr.setRequestHeader('Authorization', `Bearer ${activeToken}`);

        xhr.upload.onprogress = function (evt) {
            if (evt.lengthComputable) {
                const percent = Math.max(5, Math.round((evt.loaded / evt.total) * 50));
                updateAdminProgress(percent, `Uploading shared sheet to cloud... (${formatBytes(evt.loaded)} / ${formatBytes(evt.total)})`);
            }
        };

        xhr.onload = function () {
            btnAdminUploadSubmit.removeAttribute('disabled');
            if (xhr.status === 201) {
                updateAdminProgress(65, 'AES-256 Encrypting & saving to MongoDB Atlas...');
                showToast('Shared file uploaded to cloud successfully!');
                logPrivacyEvent(`Admin uploaded shared sheet "${adminSelectedFile.name}". Expiry: ${expirySelect.value}.`, 'SECURITY');
                
                const currentFile = adminSelectedFile;
                const reader = new FileReader();
                reader.onload = function(evt) {
                    updateAdminProgress(82, 'Parsing worksheets & indexing rows in memory...');
                    initWorker();
                    worker.postMessage({ action: 'load', payload: { fileBuffer: evt.target.result } });
                };
                reader.readAsArrayBuffer(currentFile);

                resetAdminSelectedFile();
                fetchAdminActiveFileMeta();
                switchAdminTab('tab-search');
            } else {
                let data = {};
                try { data = JSON.parse(xhr.responseText); } catch(e) {}
                showToast(data.error || 'Failed to upload file.', 'error');
                hideAdminProgress();
            }
        };

        xhr.onerror = function () {
            btnAdminUploadSubmit.removeAttribute('disabled');
            showToast('Upload network error.', 'error');
            hideAdminProgress();
        };

        xhr.send(formData);
    });

    async function fetchAdminActiveFileMeta() {
        try {
            const res = await fetch('/api/file/meta', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await res.json();

            if (res.ok && data.fileMeta) {
                const meta = data.fileMeta;
                const expiresFormatted = meta.expiresAt ? new Date(meta.expiresAt).toLocaleString() : 'No Expiry (Perpetual)';
                
                activeFileStatusBox.innerHTML = `
                    <div style="color: var(--success); font-weight: 600; font-size: 0.95rem; margin-bottom: 0.25rem;">
                        📄 ${meta.fileName}
                    </div>
                    <div style="color: var(--text-muted); font-size: 0.8rem;">
                        Size: ${formatBytes(meta.fileSize)} • Uploaded: ${new Date(meta.uploadedAt).toLocaleDateString()}
                    </div>
                    <div style="color: var(--warning); font-size: 0.8rem; margin-top: 0.25rem;">
                        ⏱️ Expiry: ${expiresFormatted}
                    </div>
                `;
                btnAdminClearSheet.style.display = 'block';
            } else {
                activeFileStatusBox.innerHTML = `<p style="color: var(--text-dark);">No active shared sheet currently uploaded.</p>`;
                btnAdminClearSheet.style.display = 'none';
            }
        } catch (err) {
            activeFileStatusBox.innerHTML = `<p style="color: var(--text-dark);">Offline or unable to fetch status.</p>`;
        }
    }

    btnAdminClearSheet.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to clear the active shared sheet for all users?')) return;

        try {
            const res = await fetch('/api/file/clear', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                showToast('Active shared sheet removed.');
                fetchAdminActiveFileMeta();
                resetFileState();
            }
        } catch (err) {
            showToast('Failed to clear sheet.', 'error');
        }
    });

    // --- ADMIN USER MANAGEMENT ---
    createUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usernameVal = newUsername.value.trim();
        const passwordVal = newPassword.value.trim();
        const contactVal = newContact.value.trim();

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ username: usernameVal, password: passwordVal, contactNumber: contactVal })
            });

            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || 'Failed to create user', 'error');
                return;
            }

            showToast(`User account "${usernameVal}" created successfully!`);
            logPrivacyEvent(`Admin created new normal user "${usernameVal}".`, 'SECURITY');

            newUsername.value = '';
            newPassword.value = '';
            newContact.value = '';
            loadUserDirectory();
        } catch (err) {
            showToast('Error creating user.', 'error');
        }
    });

    async function loadUserDirectory() {
        try {
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await res.json();

            if (res.ok && data.users) {
                userTableBody.innerHTML = '';
                if (data.users.length === 0) {
                    userTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-dark);">No normal users created yet.</td></tr>`;
                    return;
                }

                data.users.forEach(u => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${u.username}</strong></td>
                        <td>${u.contactNumber || '-'}</td>
                        <td>
                            <button type="button" class="btn-table-action btn-reset-pass" data-username="${u.username}">Reset Password</button>
                            <button type="button" class="btn-table-action delete btn-del-user" data-username="${u.username}">Delete</button>
                        </td>
                    `;
                    userTableBody.appendChild(tr);
                });
            }
        } catch (err) {
            userTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--error);">Error loading directory.</td></tr>`;
        }
    }

    if (userTableBody) {
        userTableBody.addEventListener('click', (evt) => {
            const btnReset = evt.target.closest('.btn-reset-pass');
            if (btnReset) {
                resetTargetUserId = btnReset.getAttribute('data-username');
                if (resetTargetUsername) resetTargetUsername.textContent = resetTargetUserId;
                resetAdminResetUserModalForm();
                if (adminResetUserModal) adminResetUserModal.style.display = 'flex';
                return;
            }

            const btnDel = evt.target.closest('.btn-del-user');
            if (btnDel) {
                const userName = btnDel.getAttribute('data-username');
                if (confirm(`Are you sure you want to delete user "${userName}"?`)) {
                    deleteUser(userName);
                }
            }
        });
    }

    function resetAdminResetUserModalForm() {
        if (adminVerifyPass) { adminVerifyPass.value = ''; adminVerifyPass.type = 'password'; }
        if (resetUserNewPass) { resetUserNewPass.value = ''; resetUserNewPass.type = 'password'; }
        if (resetUserConfirmPass) { resetUserConfirmPass.value = ''; resetUserConfirmPass.type = 'password'; }
        resetEyeIcons(['adminVerifyPass', 'resetUserNewPass', 'resetUserConfirmPass']);
    }

    btnCloseAdminResetModal.addEventListener('click', () => {
        resetAdminResetUserModalForm();
        adminResetUserModal.style.display = 'none';
    });

    btnCancelAdminResetModal.addEventListener('click', () => {
        resetAdminResetUserModalForm();
        adminResetUserModal.style.display = 'none';
    });

    adminResetUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!resetTargetUserId) return;
        if (resetUserNewPass.value !== resetUserConfirmPass.value) {
            showToast('New user passwords do not match.', 'error');
            return;
        }

        const activeToken = authToken || sessionStorage.getItem('glancex_jwt_token');

        try {
            const res = await fetch(`/api/admin/users/${encodeURIComponent(resetTargetUserId)}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${activeToken}`
                },
                body: JSON.stringify({
                    adminPassword: adminVerifyPass.value,
                    newPassword: resetUserNewPass.value
                })
            });

            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || 'Failed to reset password', 'error');
                return;
            }

            showToast(data.message || `Password for user "${resetTargetUserId}" updated successfully!`);
            logPrivacyEvent(`Admin reset password for user "${resetTargetUserId}".`, 'SECURITY');
            adminResetUserModal.style.display = 'none';
            resetAdminResetUserModalForm();
            loadUserDirectory();
        } catch (err) {
            showToast('Error resetting user password.', 'error');
        }
    });

    async function deleteUser(userId) {
        const activeToken = authToken || sessionStorage.getItem('glancex_jwt_token');
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${activeToken}` }
            });
            if (res.ok) {
                showToast('User deleted successfully.');
                loadUserDirectory();
            }
        } catch (err) {
            showToast('Failed to delete user.', 'error');
        }
    }

    // --- ADMIN SECURITY PASSWORD CHANGE ---
    adminChangePassForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (adminNewPass.value !== adminConfirmPass.value) {
            showToast('New passwords do not match.', 'error');
            return;
        }

        const activeToken = authToken || sessionStorage.getItem('glancex_jwt_token');

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${activeToken}`
                },
                body: JSON.stringify({ currentPassword: adminCurrentPass.value, newPassword: adminNewPass.value })
            });

            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || 'Failed to update password', 'error');
                return;
            }

            showToast('Admin password updated successfully!');
            resetAdminChangePassForm();
        } catch (err) {
            showToast('Password update error.', 'error');
        }
    });

    function resetEyeIcons(targetIds) {
        targetIds.forEach(id => {
            const btn = document.querySelector(`.btn-toggle-pass[data-target="${id}"]`);
            if (btn) {
                btn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
        });
    }

    // --- NORMAL USER PASSWORD MODAL ---
    btnUserChangePassModal.addEventListener('click', () => {
        resetUserChangePassForm();
        userPassModal.style.display = 'flex';
    });

    function resetUserChangePassForm() {
        if (userCurrentPass) { userCurrentPass.value = ''; userCurrentPass.type = 'password'; }
        if (userNewPass) { userNewPass.value = ''; userNewPass.type = 'password'; }
        if (userConfirmPass) { userConfirmPass.value = ''; userConfirmPass.type = 'password'; }
        resetEyeIcons(['userCurrentPass', 'userNewPass', 'userConfirmPass']);
    }

    btnCloseUserPassModal.addEventListener('click', () => {
        resetUserChangePassForm();
        userPassModal.style.display = 'none';
    });

    btnCancelUserPassModal.addEventListener('click', () => {
        resetUserChangePassForm();
        userPassModal.style.display = 'none';
    });

    userChangePassForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (userNewPass.value !== userConfirmPass.value) {
            showToast('New passwords do not match.', 'error');
            return;
        }

        const activeToken = authToken || sessionStorage.getItem('glancex_jwt_token');

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${activeToken}`
                },
                body: JSON.stringify({ currentPassword: userCurrentPass.value, newPassword: userNewPass.value })
            });

            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || 'Failed to change password', 'error');
                return;
            }

            showToast('Password updated successfully!');
            userPassModal.style.display = 'none';
            resetUserChangePassForm();
        } catch (err) {
            showToast('Error changing password.', 'error');
        }
    });

    // --- FETCH ACTIVE SHARED SHEET FOR USER/ADMIN ---
    async function loadActiveSharedSheet() {
        depFileName.textContent = 'Checking server for active shared file...';
        depFileMeta.textContent = 'Connecting...';

        const activeToken = authToken || sessionStorage.getItem('glancex_jwt_token');

        try {
            const res = await fetch('/api/file/current', {
                headers: { 'Authorization': `Bearer ${activeToken}` }
            });

            if (!res.ok) {
                const errData = await res.json();
                depFileName.textContent = 'No Active Shared File';
                depFileMeta.textContent = errData.error || 'Admin has not uploaded a file yet.';
                depExpiryBadge.style.display = 'none';
                offlineCacheBadge.style.display = 'none';
                return;
            }

            const arrayBuffer = await res.arrayBuffer();
            const expiresAtHeader = res.headers.get('X-File-Expires-At');

            // Save to tab-scoped offline cache
            try {
                const base64String = arrayBufferToBase64(arrayBuffer);
                sessionStorage.setItem('glancex_cached_file_data', base64String);
                sessionStorage.setItem('glancex_cached_file_expiry', expiresAtHeader || '');
            } catch (e) {}

            processSharedSheetBuffer(arrayBuffer, expiresAtHeader);
            logPrivacyEvent('Downloaded active shared sheet from server.', 'SECURITY');
        } catch (err) {
            logPrivacyEvent('Wi-Fi offline. Loading cached sheet from tab storage...', 'BLOCK');
            
            const cachedBase64 = sessionStorage.getItem('glancex_cached_file_data');
            const cachedExpiry = sessionStorage.getItem('glancex_cached_file_expiry');

            if (cachedBase64) {
                const arrayBuffer = base64ToArrayBuffer(cachedBase64);
                processSharedSheetBuffer(arrayBuffer, cachedExpiry, true);
                showToast('Loaded shared sheet from local offline cache.');
            } else {
                depFileName.textContent = 'Offline & No Cached File';
                depFileMeta.textContent = 'Please connect to Wi-Fi once to fetch the shared file.';
                depExpiryBadge.style.display = 'none';
                offlineCacheBadge.style.display = 'none';
            }
        }
    }

    function processSharedSheetBuffer(arrayBuffer, expiresAtStr, isOffline = false) {
        initWorker();
        worker.postMessage({ action: 'load', payload: { fileBuffer: arrayBuffer } });

        depFileName.textContent = 'Active Shared Sheet (Loaded)';
        depFileMeta.textContent = isOffline ? 'Offline Mode • Cached in Browser' : 'Synchronized with Server';

        if (expiresAtStr) {
            const expiresDate = new Date(expiresAtStr);
            if (expiresDate < new Date()) {
                sessionStorage.removeItem('glancex_cached_file_data');
                sessionStorage.removeItem('glancex_cached_file_expiry');
                resetFileState();
                
                depFileName.textContent = 'Shared Sheet Expired';
                depFileMeta.textContent = 'This file has reached its expiration date and was purged.';
                depExpiryBadge.style.display = 'flex';
                depExpiryBadge.innerHTML = `
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    Shared sheet EXPIRED & PURGED
                `;
                depExpiryBadge.className = 'status-badge-pill warning';
                offlineCacheBadge.style.display = 'none';
                return;
            } else {
                const remainingHours = Math.round((expiresDate - new Date()) / (1000 * 60 * 60));
                depExpiryBadge.innerHTML = `
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Active until: ${expiresDate.toLocaleDateString()} (${remainingHours} hrs left)
                `;
                depExpiryBadge.className = 'status-badge-pill warning';
            }
        } else {
            depExpiryBadge.innerHTML = `
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Active: Perpetual (No Expiry)
            `;
            depExpiryBadge.className = 'status-badge-pill warning';
        }

        offlineCacheBadge.style.display = 'flex';
    }

    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    function base64ToArrayBuffer(base64) {
        const binary_string = window.atob(base64);
        const bytes = new Uint8Array(binary_string.length);
        for (let i = 0; i < binary_string.length; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // --- UPLOAD HANDLERS FOR INDEPENDENT MODE ---
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function updateIndepProgress(percent, statusText) {
        const wrapper = document.getElementById('indepProgressWrapper');
        const fill = document.getElementById('indepProgressBarFill');
        const text = document.getElementById('indepProgressStatus');
        const percentVal = document.getElementById('indepProgressPercent');

        if (wrapper) wrapper.style.display = 'flex';
        if (fill) fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        if (percentVal) percentVal.textContent = `${Math.min(100, Math.max(0, percent))}%`;
        if (text) text.textContent = statusText;
    }

    function hideIndepProgress() {
        const wrapper = document.getElementById('indepProgressWrapper');
        if (wrapper) wrapper.style.display = 'none';
    }

    const btnRemoveIndepFile = document.getElementById('btnRemoveIndepFile');
    if (btnRemoveIndepFile) {
        btnRemoveIndepFile.addEventListener('click', (e) => {
            e.stopPropagation();
            resetFileState();
        });
    }

    function handleFile(file) {
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const fileNameLower = file.name.toLowerCase();
        const isValid = validExtensions.some(ext => fileNameLower.endsWith(ext));

        if (!isValid) {
            showToast('Invalid file format. Please upload .xlsx, .xls or .csv.', 'error');
            return;
        }

        excelFile = file;
        const dropZoneIcon = document.getElementById('dropZoneIcon');
        const btnRemoveIndepFileElem = document.getElementById('btnRemoveIndepFile');
        const dropZoneTitle = document.getElementById('dropZoneTitle');
        const dropZoneSubtext = document.getElementById('dropZoneSubtext');
        
        if (dropZoneIcon) dropZoneIcon.style.display = 'none';
        if (btnRemoveIndepFileElem) btnRemoveIndepFileElem.style.display = 'flex';
        if (dropZoneTitle) dropZoneTitle.innerHTML = `<strong>${file.name}</strong>`;
        if (dropZoneSubtext) dropZoneSubtext.textContent = `Reading locally... (${formatBytes(file.size)})`;
        dropZone.classList.add('file-loaded');
        
        updateIndepProgress(10, 'Reading file bytes...');

        const reader = new FileReader();
        reader.onprogress = function (evt) {
            if (evt.lengthComputable) {
                const percent = Math.round((evt.loaded / evt.total) * 50);
                updateIndepProgress(percent, `Reading file bytes... (${formatBytes(evt.loaded)} / ${formatBytes(evt.total)})`);
            }
        };

        reader.onload = function (e) {
            updateIndepProgress(65, 'Parsing worksheets in Web Worker RAM...');
            const arrayBuffer = e.target.result;
            initWorker();
            worker.postMessage({
                action: 'load',
                payload: { fileBuffer: arrayBuffer }
            });
        };

        reader.onerror = function () {
            showToast('Failed to read the file.', 'error');
            hideIndepProgress();
            resetFileState();
        };

        reader.readAsArrayBuffer(file);
    }

    function resetFileState() {
        excelFile = null;
        isFileLoaded = false;
        
        hideIndepProgress();
        fileInput.value = '';
        
        const dropZoneIcon = document.getElementById('dropZoneIcon');
        const btnRemoveIndepFileElem = document.getElementById('btnRemoveIndepFile');
        const dropZoneTitle = document.getElementById('dropZoneTitle');
        const dropZoneSubtext = document.getElementById('dropZoneSubtext');
        
        if (dropZoneIcon) dropZoneIcon.style.display = 'block';
        if (btnRemoveIndepFileElem) btnRemoveIndepFileElem.style.display = 'none';
        if (dropZoneTitle) dropZoneTitle.innerHTML = `<strong>Drag & drop file</strong> or click to browse`;
        if (dropZoneSubtext) dropZoneSubtext.textContent = `Supports .xlsx, .xls, .csv`;
        dropZone.classList.remove('file-loaded');

        settingsPanel.style.display = 'none';
        depSettingsPanel.style.display = 'none';
        
        btnSearch.setAttribute('disabled', 'true');
        phoneInput.setAttribute('disabled', 'true');
        phoneInput.value = '';
        
        resultsHeader.classList.remove('active');
        resultsGrid.innerHTML = '';
        emptyState.style.display = 'flex';
        
        if (worker) {
            worker.terminate();
            worker = null;
        }
    }

    // --- WORKSHEET SELECTION LISTENERS ---
    sheetSelect.addEventListener('change', (e) => switchWorksheet(e.target.value));
    depSheetSelect.addEventListener('change', (e) => switchWorksheet(e.target.value));

    function switchWorksheet(sheetName) {
        if (!worker) return;
        worker.postMessage({
            action: 'selectSheet',
            payload: { sheetName }
        });
    }

    // --- SEARCH DISPATCH & RENDERING ---
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isFileLoaded || !worker) return;

        const query = phoneInput.value.trim();
        const normalizedDigits = query.replace(/\D/g, '');
        if (!query || normalizedDigits.length < 7) {
            showToast('Please enter at least 7 digits to search.', 'error');
            return;
        }

        btnSearch.setAttribute('disabled', 'true');
        searchSpinner.classList.add('active');

        logPrivacyEvent(`Searching query "${query}" across all columns.`, 'SECURITY');
        
        worker.postMessage({
            action: 'search',
            payload: { query, phoneColumnIndex: null }
        });
    });

    function renderSearchResults(results, query) {
        resultsGrid.innerHTML = '';
        emptyState.style.display = 'none';
        resultsHeader.classList.add('active');
        
        resultsCount.textContent = `${results.length} record(s) found`;

        if (results.length === 0) {
            resultsGrid.innerHTML = `
                <div class="empty-state" style="margin-top: 2rem;">
                    <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                    <h3>No Matches Found</h3>
                    <p>We couldn't find any record matching <strong>"${query}"</strong>.</p>
                </div>
            `;
            return;
        }

        results.forEach((result, idx) => {
            const card = document.createElement('div');
            card.className = 'result-card';

            const dataKeys = Object.keys(result.data);
            const nameKeywords = ['name', 'first', 'last', 'customer', 'contact', 'client'];
            const foundTitleKey = dataKeys.find(key => 
                nameKeywords.some(keyword => key.toLowerCase().includes(keyword))
            );

            let titleField = (foundTitleKey && result.data[foundTitleKey]) ? `${foundTitleKey}: ${result.data[foundTitleKey]}` : `Record #${result.rowIndex}`;

            const headerHtml = `
                <div class="result-card-header">
                    <span class="result-card-title">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        ${titleField}
                    </span>
                    <div class="result-card-actions">
                        <button class="btn-card-action btn-copy-card" data-index="${idx}">
                            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            Copy Record
                        </button>
                    </div>
                </div>
            `;

            const fieldsGrid = document.createElement('div');
            fieldsGrid.className = 'result-fields-grid';

            dataKeys.forEach(key => {
                const fieldDiv = document.createElement('div');
                fieldDiv.className = 'result-field';
                
                if (isProbablyPhone(result.data[key])) {
                    fieldDiv.classList.add('highlighted');
                }

                fieldDiv.innerHTML = `
                    <span class="field-label">${key}</span>
                    <span class="field-value">${result.data[key] || '-'}</span>
                `;
                fieldsGrid.appendChild(fieldDiv);
            });

            card.innerHTML = headerHtml;
            card.appendChild(fieldsGrid);
            resultsGrid.appendChild(card);
        });

        const copyButtons = resultsGrid.querySelectorAll('.btn-copy-card');
        copyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.getAttribute('data-index'), 10);
                const match = results[index];
                const textToCopy = Object.entries(match.data)
                    .map(([key, val]) => `${key}: ${val || '-'}`)
                    .join('\n');
                
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showToast('Record copied to clipboard!');
                }).catch(() => {
                    showToast('Failed to copy to clipboard', 'error');
                });
            });
        });
    }

    function isProbablyPhone(val) {
        if (!val) return false;
        const str = String(val).replace(/\D/g, '');
        return str.length >= 7 && str.length <= 15;
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    let toastTimeout = null;
    function showToast(message, type = 'success') {
        clearTimeout(toastTimeout);
        toastMsg.textContent = message;
        
        if (type === 'error') {
            toast.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            toast.querySelector('svg').style.color = 'var(--error)';
        } else {
            toast.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            toast.querySelector('svg').style.color = 'var(--success)';
        }

        toast.classList.add('active');
        toastTimeout = setTimeout(() => {
            toast.classList.remove('active');
        }, 3200);
    }
});
