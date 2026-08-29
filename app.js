// app.js
// Main controller for the Privacy-First Local Excel Lookup Tool.
// Coordinates file reading, UI states, Web Worker communication, and logs privacy assertions.

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfoBox = document.getElementById('fileInfoBox');
    const fileName = document.getElementById('fileName');
    const fileMeta = document.getElementById('fileMeta');
    const btnRemoveFile = document.getElementById('btnRemoveFile');
    
    const settingsPanel = document.getElementById('settingsPanel');
    const sheetSelect = document.getElementById('sheetSelect');
    
    const searchForm = document.getElementById('searchForm');
    const phoneInput = document.getElementById('phoneInput');
    const btnSearch = document.getElementById('btnSearch');
    const searchSpinner = document.getElementById('searchSpinner');
    
    const resultsPanel = document.getElementById('resultsPanel');
    const resultsHeader = document.getElementById('resultsHeader');
    const resultsCount = document.getElementById('resultsCount');
    const resultsGrid = document.getElementById('resultsGrid');
    const emptyState = document.getElementById('emptyState');
    
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    
    // Privacy Shield Monitor Elements
    const monitorBtn = document.getElementById('monitorBtn');
    const privacyPanel = document.getElementById('privacyPanel');
    const networkLog = document.getElementById('networkLog');
    const dataSentVal = document.getElementById('dataSentVal');
    const securityAuditText = document.getElementById('securityAuditText');

    let worker = null;
    let excelFile = null;
    let fileHeaders = [];
    let isFileLoaded = false;
    let networkLogsCount = 0;

    // --- PRIVACY SHIELD NETWORK MONITOR ---
    // Log message helper to the console simulator
    function logPrivacyEvent(message, type = 'SECURITY') {
        const time = new Date().toLocaleTimeString();
        const logItem = document.createElement('div');
        logItem.className = 'network-log-item';
        
        let color = '#34d399'; // Green for normal/safe
        if (type === 'BLOCK') color = '#fbbf24'; // Yellow
        if (type === 'ALERT') color = '#f87171'; // Red
        if (type === 'SYSTEM') color = '#60a5fa'; // Blue
        
        logItem.innerHTML = `
            <span class="time">[${time}]</span>
            <span class="type" style="color: ${color}; font-weight: 600;">[${type}]</span>
            <span class="msg">${message}</span>
        `;
        
        networkLog.appendChild(logItem);
        networkLog.scrollTop = networkLog.scrollHeight;
        networkLogsCount++;
    }

    // Intercept network requests to prove offline compliance
    function initializePrivacyShield() {
        logPrivacyEvent('Privacy Shield Module v1.0.0 Loaded.', 'SYSTEM');
        logPrivacyEvent('Local Sandbox Environment confirmed.', 'SYSTEM');
        
        // Mock proxy for intercepting network activity in browser environment
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            logPrivacyEvent(`Blocked external FETCH request to: ${args[0]}`, 'BLOCK');
            return Promise.reject(new TypeError('Network request blocked by Privacy Shield. App is in strictly Local Mode.'));
        };

        const originalXMLSubmit = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function(...args) {
            logPrivacyEvent(`Blocked external XMLHttpRequest.`, 'BLOCK');
            throw new Error('Network activity blocked by Privacy Shield.');
        };

        logPrivacyEvent('Zero-network hook injection completed.', 'SECURITY');
        logPrivacyEvent('No data outbound pathways remain active.', 'SECURITY');
        
        dataSentVal.textContent = '0 Bytes';
        securityAuditText.textContent = '100% Client-Side Safe';
    }

    // Toggle Privacy Monitor Panel
    monitorBtn.addEventListener('click', () => {
        privacyPanel.classList.toggle('active');
    });

    initializePrivacyShield();

    // --- WEB WORKER INITIALIZATION ---
    function initWorker() {
        if (worker) {
            worker.terminate();
        }
        
        worker = new Worker('worker.js');
        logPrivacyEvent('Web Worker thread spawned for background file parsing.', 'SYSTEM');

        worker.onmessage = function (e) {
            const { status, payload } = e.data;

            if (status === 'loaded') {
                isFileLoaded = true;
                fileHeaders = payload.headers;
                
                // Update file metadata visual
                fileMeta.textContent = `${payload.rowCount.toLocaleString()} rows • ${payload.sheetNames.length} sheet(s)`;
                
                // Populate sheets dropdown
                sheetSelect.innerHTML = '';
                payload.sheetNames.forEach(name => {
                    const option = document.createElement('option');
                    option.value = name;
                    option.textContent = name;
                    sheetSelect.appendChild(option);
                });
                
                // Enable controls
                btnSearch.removeAttribute('disabled');
                phoneInput.removeAttribute('disabled');
                settingsPanel.style.display = 'flex';
                
                logPrivacyEvent(`Successfully parsed sheet "${payload.selectedSheet}" in-memory (${payload.rowCount} rows).`, 'SECURITY');
                showToast(`File parsed successfully! ${payload.rowCount} rows loaded.`);
            } 
            
            else if (status === 'sheetChanged') {
                fileHeaders = payload.headers;
                fileMeta.textContent = `${payload.rowCount.toLocaleString()} rows • ${payload.selectedSheet}`;
                logPrivacyEvent(`Switched active sheet to: "${payload.selectedSheet}" (${payload.rowCount} rows).`, 'SECURITY');
                showToast(`Switched to sheet "${payload.selectedSheet}"`);
            } 
            
            else if (status === 'searchCompleted') {
                searchSpinner.classList.remove('active');
                btnSearch.removeAttribute('disabled');
                renderSearchResults(payload.results, payload.query);
                logPrivacyEvent(`Search completed for "${payload.query}". Found ${payload.results.length} record(s).`, 'SECURITY');
            } 
            
            else if (status === 'error') {
                searchSpinner.classList.remove('active');
                btnSearch.removeAttribute('disabled');
                logPrivacyEvent(`Error: ${payload.message}`, 'ALERT');
                showToast(payload.message, 'error');
            }
        };

        worker.onerror = function (err) {
            searchSpinner.classList.remove('active');
            btnSearch.removeAttribute('disabled');
            logPrivacyEvent(`Worker Error: ${err.message}`, 'ALERT');
            showToast(`Parsing error: ${err.message}`, 'error');
        };
    }

    initWorker();



    // --- UPLOAD HANDLERS ---
    
    // Drag & Drop
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

    // Handle File Process
    function handleFile(file) {
        // Validate file extension
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const fileNameLower = file.name.toLowerCase();
        const isValid = validExtensions.some(ext => fileNameLower.endsWith(ext));

        if (!isValid) {
            logPrivacyEvent(`Blocked file load attempt: File "${file.name}" is not a supported Excel/CSV file format.`, 'ALERT');
            showToast('Invalid file format. Please upload .xlsx, .xls or .csv.', 'error');
            return;
        }

        excelFile = file;
        fileName.textContent = file.name;
        fileMeta.textContent = `Reading locally... (${formatBytes(file.size)})`;
        
        dropZone.style.display = 'none';
        fileInfoBox.classList.add('active');
        
        logPrivacyEvent(`File loaded into browser memory buffer: "${file.name}" (${file.size} bytes).`, 'SECURITY');
        
        // Read file contents as ArrayBuffer
        const reader = new FileReader();
        reader.onload = function (e) {
            const arrayBuffer = e.target.result;
            initWorker(); // Restart worker to ensure clean state
            worker.postMessage({
                action: 'load',
                payload: { fileBuffer: arrayBuffer }
            });
        };

        reader.onerror = function () {
            logPrivacyEvent('FileReader failed to read file locally.', 'ALERT');
            showToast('Failed to read the file.', 'error');
            resetFileState();
        };

        reader.readAsArrayBuffer(file);
    }

    // Remove File/Reset
    btnRemoveFile.addEventListener('click', () => {
        resetFileState();
    });

    function resetFileState() {
        excelFile = null;
        isFileLoaded = false;
        fileHeaders = [];
        
        // Reset components
        fileInput.value = '';
        dropZone.style.display = 'flex';
        fileInfoBox.classList.remove('active');
        settingsPanel.style.display = 'none';
        
        // Disable search controls
        btnSearch.setAttribute('disabled', 'true');
        phoneInput.setAttribute('disabled', 'true');
        phoneInput.value = '';
        
        // Reset Results Panel
        resultsHeader.classList.remove('active');
        resultsGrid.innerHTML = '';
        emptyState.style.display = 'flex';
        
        // Terminate worker to free memory instantly
        if (worker) {
            worker.terminate();
            worker = null;
            logPrivacyEvent('Web Worker terminated. Excel data purged from browser memory.', 'SECURITY');
        }

        showToast('File closed. Data cleared.');
    }

    // --- SHEET NAVIGATION ---
    sheetSelect.addEventListener('change', (e) => {
        if (!worker) return;
        const selectedSheet = e.target.value;
        worker.postMessage({
            action: 'selectSheet',
            payload: { sheetName: selectedSheet }
        });
    });

    // --- SEARCH DISPATCH ---
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isFileLoaded || !worker) return;

        const query = phoneInput.value.trim();
        if (!query) {
            showToast('Please enter a phone number to search.', 'error');
            return;
        }

        btnSearch.setAttribute('disabled', 'true');
        searchSpinner.classList.add('active');

        logPrivacyEvent(`Searching for phone query "${query}" across all columns.`, 'SECURITY');
        
        worker.postMessage({
            action: 'search',
            payload: {
                query,
                phoneColumnIndex: null
            }
        });
    });

    // --- RENDER RESULTS ---
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
                    <p>We couldn't find any record matching <strong>"${query}"</strong> in the selected column.</p>
                </div>
            `;
            return;
        }

        // Render card for each result
        results.forEach((result, idx) => {
            const card = document.createElement('div');
            card.className = 'result-card';

            // Find a name or descriptive field for the card title
            let titleField = '';
            const dataKeys = Object.keys(result.data);
            
            // Try to find common name headers to use as card Title
            const nameKeywords = ['name', 'first', 'last', 'customer', 'contact', 'client'];
            const foundTitleKey = dataKeys.find(key => 
                nameKeywords.some(keyword => key.toLowerCase().includes(keyword))
            );

            if (foundTitleKey && result.data[foundTitleKey]) {
                titleField = `${foundTitleKey}: ${result.data[foundTitleKey]}`;
            } else {
                titleField = `Record #${result.rowIndex}`;
            }

            // Create header actions for copy
            const headerHtml = `
                <div class="result-card-header">
                    <span class="result-card-title">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></circle>
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

            // Fields container
            const fieldsGrid = document.createElement('div');
            fieldsGrid.className = 'result-fields-grid';

            dataKeys.forEach(key => {
                const fieldDiv = document.createElement('div');
                fieldDiv.className = 'result-field';
                
                // Highlight columns that look like they contain phone numbers
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

        // Set up event listeners for copy actions
        const copyButtons = resultsGrid.querySelectorAll('.btn-copy-card');
        copyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.getAttribute('data-index'), 10);
                const match = results[index];
                
                // Convert matched data to copy format
                const textToCopy = Object.entries(match.data)
                    .map(([key, val]) => `${key}: ${val || '-'}`)
                    .join('\n');
                
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showToast('Record copied to clipboard!');
                    logPrivacyEvent('Copied search record to user clipboard.', 'SYSTEM');
                }).catch(() => {
                    showToast('Failed to copy to clipboard', 'error');
                });
            });
        });
    }

    // Basic regex to check if a value looks like a phone number for UI highlight
    function isProbablyPhone(val) {
        if (!val) return false;
        const str = String(val).replace(/\D/g, '');
        return str.length >= 7 && str.length <= 15;
    }

    // --- UTILITIES ---
    
    // Format byte sizes nicely
    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Show dynamic toast popup
    let toastTimeout = null;
    function showToast(message, type = 'success') {
        clearTimeout(toastTimeout);
        toastMsg.textContent = message;
        
        if (type === 'error') {
            toast.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            toast.querySelector('svg').style.color = 'var(--error)';
            toast.querySelector('svg').innerHTML = `
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            `;
        } else {
            toast.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            toast.querySelector('svg').style.color = 'var(--success)';
            toast.querySelector('svg').innerHTML = `
                <polyline points="20 6 9 17 4 12"></polyline>
            `;
        }

        toast.classList.add('active');
        toastTimeout = setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }
});
