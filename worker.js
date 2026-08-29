// worker.js
// Runs in a background thread to keep the main UI responsive.
// Loads SheetJS locally, parses Excel files, and searches for records.

importScripts('lib/xlsx.full.min.js');

let workbook = null;
let currentSheetName = null;
let currentRows = []; // 2D array representation of the active sheet
let headers = [];

// Helper function to normalize phone numbers (strip non-digit characters)
function normalizePhone(value) {
    if (value === null || value === undefined) return '';
    // Convert to string and strip all non-digit characters
    return String(value).replace(/\D/g, '');
}

// Function to auto-detect the phone number column index based on column data and headers
function guessPhoneColumnIndex() {
    if (currentRows.length <= 1) return -1;
    
    const numRowsToScan = Math.min(currentRows.length, 100);
    const colScores = new Array(headers.length).fill(0);
    
    // Scan up to 100 rows to see which column has the highest density of phone-like values
    for (let i = 1; i < numRowsToScan; i++) {
        const row = currentRows[i];
        if (!row) continue;
        for (let j = 0; j < headers.length; j++) {
            const val = row[j];
            if (val !== undefined && val !== null && val !== '') {
                const normalized = normalizePhone(val);
                // A phone number usually has between 7 and 15 digits
                if (normalized.length >= 7 && normalized.length <= 15) {
                    colScores[j]++;
                }
            }
        }
    }
    
    // Find the column index with the highest score
    let bestIndex = -1;
    let maxScore = 0;
    for (let j = 0; j < colScores.length; j++) {
        if (colScores[j] > maxScore) {
            maxScore = colScores[j];
            bestIndex = j;
        }
    }
    
    // Fallback: If no column has phone-like data values, fall back to matching headers against keywords
    if (bestIndex === -1 || maxScore === 0) {
        const phoneKeywords = ['phone', 'contact', 'mobile', 'tel', 'number', 'cell', 'ph', 'mobi'];
        for (let j = 0; j < headers.length; j++) {
            const headerLower = headers[j].toLowerCase();
            for (const keyword of phoneKeywords) {
                if (headerLower.includes(keyword)) {
                    return j;
                }
            }
        }
    }
    
    return bestIndex;
}

self.onmessage = function (e) {
    const { action, payload } = e.data;

    try {
        if (action === 'load') {
            const { fileBuffer } = payload;
            
            // Parse workbook
            workbook = XLSX.read(fileBuffer, {
                type: 'array',
                cellDates: true,
                cellText: true,
                cellStyles: false
            });

            const sheetNames = workbook.SheetNames;
            if (sheetNames.length === 0) {
                throw new Error('The uploaded file contains no sheets.');
            }

            // Load the first sheet by default
            loadSheet(sheetNames[0]);
            const guessedIndex = guessPhoneColumnIndex();

            self.postMessage({
                status: 'loaded',
                payload: {
                    sheetNames,
                    selectedSheet: sheetNames[0],
                    headers,
                    rowCount: Math.max(0, currentRows.length - 1), // exclude header row
                    guessedPhoneColumnIndex: guessedIndex
                }
            });
        } 
        
        else if (action === 'selectSheet') {
            const { sheetName } = payload;
            if (!workbook) throw new Error('No active workbook loaded.');
            
            loadSheet(sheetName);
            const guessedIndex = guessPhoneColumnIndex();

            self.postMessage({
                status: 'sheetChanged',
                payload: {
                    selectedSheet: sheetName,
                    headers,
                    rowCount: Math.max(0, currentRows.length - 1),
                    guessedPhoneColumnIndex: guessedIndex
                }
            });
        } 
        
        else if (action === 'search') {
            const { query, phoneColumnIndex } = payload;
            if (currentRows.length === 0) {
                throw new Error('No sheet data loaded.');
            }

            const searchResults = [];
            const normalizedQuery = normalizePhone(query);

            if (!normalizedQuery) {
                throw new Error('Please enter a valid phone number search query.');
            }

            // Start searching from index 1 (skip headers)
            for (let i = 1; i < currentRows.length; i++) {
                const row = currentRows[i];
                if (!row) continue;
                let isMatch = false;

                if (phoneColumnIndex !== undefined && phoneColumnIndex !== null && phoneColumnIndex >= 0) {
                    // Search in the specific column
                    const val = row[phoneColumnIndex];
                    const normalizedVal = normalizePhone(val);
                    
                    // Match if either exact, or if one is a suffix of the other (handles country codes)
                    if (normalizedVal && (normalizedVal === normalizedQuery || 
                        normalizedVal.endsWith(normalizedQuery) || 
                        normalizedQuery.endsWith(normalizedVal))) {
                        isMatch = true;
                    }
                } else {
                    // Search across all columns if no specific column is selected
                    for (let j = 0; j < row.length; j++) {
                        const val = row[j];
                        const normalizedVal = normalizePhone(val);
                        // Make sure we only match reasonably-sized digit strings to avoid matching short numbers like '1'
                        if (normalizedVal && normalizedVal.length >= 6 && 
                            (normalizedVal === normalizedQuery || 
                             normalizedVal.endsWith(normalizedQuery) || 
                             normalizedQuery.endsWith(normalizedVal))) {
                            isMatch = true;
                            break;
                        }
                    }
                }

                if (isMatch) {
                    // Map headers to row values
                    const record = {};
                    headers.forEach((header, index) => {
                        // Use header name or a default fallback if header is empty
                        const key = header || `Column ${index + 1}`;
                        // Safeguard in case row is shorter than headers
                        let val = (row[index] !== undefined && row[index] !== null) ? row[index] : '';

                        // Format Date objects to be clean (removes timezone clutter)
                        if (val instanceof Date && !isNaN(val.getTime())) {
                            const hours = val.getHours();
                            const minutes = val.getMinutes();
                            const seconds = val.getSeconds();
                            
                            const yyyy = val.getFullYear();
                            const mm = String(val.getMonth() + 1).padStart(2, '0');
                            const dd = String(val.getDate()).padStart(2, '0');
                            const dateStr = `${dd}-${mm}-${yyyy}`;
                            
                            // If time is exactly midnight, show only date. Otherwise show both date and time.
                            if (hours === 0 && minutes === 0 && seconds === 0) {
                                val = dateStr;
                            } else {
                                const hh = String(hours).padStart(2, '0');
                                const min = String(minutes).padStart(2, '0');
                                const sec = String(seconds).padStart(2, '0');
                                val = `${dateStr} ${hh}:${min}:${sec}`;
                            }
                        } else if (typeof val === 'string' && val.includes('00:00:00 GMT')) {
                            // Safety fallback: if for some reason the value is already a string with timezone info
                            const parsedDate = new Date(val);
                            if (!isNaN(parsedDate.getTime())) {
                                const yyyy = parsedDate.getFullYear();
                                const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
                                const dd = String(parsedDate.getDate()).padStart(2, '0');
                                val = `${dd}-${mm}-${yyyy}`;
                            }
                        }

                        record[key] = val;
                    });
                    
                    searchResults.push({
                        rowIndex: i,
                        data: record
                    });
                }
            }

            self.postMessage({
                status: 'searchCompleted',
                payload: {
                    results: searchResults,
                    query: query
                }
            });
        }
    } catch (error) {
        self.postMessage({
            status: 'error',
            payload: {
                message: error.message
            }
        });
    }
};

function loadSheet(sheetName) {
    currentSheetName = sheetName;
    const worksheet = workbook.Sheets[sheetName];
    
    // Parse sheet as raw 2D array (header: 1 maintains empty fields and index positions)
    currentRows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ''
    });

    if (currentRows.length === 0) {
        headers = [];
        return;
    }

    // Extract headers (first row). Make sure all headers are unique/clean
    headers = currentRows[0].map((h, i) => {
        const val = String(h).trim();
        return val || `Column ${i + 1}`;
    });
}
