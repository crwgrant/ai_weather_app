const form = document.getElementById('weather-form');
const zipCodeInput = document.getElementById('zip-code');
const resultsDiv = document.getElementById('weather-results');

// --- Event Listener for Page Load --- 
document.addEventListener('DOMContentLoaded', () => {
    const lastZip = localStorage.getItem('lastSearchedZip');
    if (lastZip) {
        zipCodeInput.value = lastZip;
        // console.log(`Prefilled zip code input with last searched: ${lastZip}`);
    }
});

// --- Local Storage Helper Functions ---
function getHistoryFromLocalStorage(zipCode) {
    const key = `weatherHistory_${zipCode}`;
    const storedHistory = localStorage.getItem(key);
    try {
        return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (e) {
        console.error("Error parsing history from Local Storage:", e);
        return []; // Return empty array on parsing error
    }
}

function saveHistoryToLocalStorage(zipCode, historyArray) {
    const key = `weatherHistory_${zipCode}`;
    try {
        localStorage.setItem(key, JSON.stringify(historyArray));
    } catch (e) {
        console.error("Error saving history to Local Storage:", e);
        alert("Error saving history. Local Storage might be full or disabled.");
    }
}

// --- Main Form Submit Handler ---
form.addEventListener('submit', async (event) => {
    event.preventDefault(); 
    const zipCode = zipCodeInput.value.trim();
    resultsDiv.innerHTML = '<p class="text-center text-gray-500">Loading...</p>';

    if (!zipCode) {
        resultsDiv.innerHTML = '<p class="text-center text-red-500">Please enter a zip code.</p>';
        return;
    }

    try {
        // Fetch only the latest weather from the backend
        const response = await fetch(`/weather/${zipCode}`);
        const data = await response.json();

        if (!response.ok) {
            resultsDiv.innerHTML = `<p class="text-center text-red-500">Error: ${data.detail || 'Could not fetch weather data.'}</p>`;
        } else {
            // --- Save last searched zip on success --- 
            localStorage.setItem('lastSearchedZip', zipCode);
            // console.log(`Saved last searched zip code to Local Storage: ${zipCode}`);

            const latestData = data.latest;
            // Fetch history from Local Storage for this zip code
            const historyData = getHistoryFromLocalStorage(zipCode);

            // Store latest data globally for the save button
            window.currentLatestData = latestData; 
            window.currentZipCode = zipCode; 
            
            // --- Display Latest Weather Data --- 
            let latestHtml = `
                <h2 class="text-xl font-semibold mb-4 text-center text-gray-800">Latest Weather in ${latestData.city || 'N/A'}</h2>
                <div class="overflow-x-auto rounded-lg border border-gray-200 mb-2">
                    <table class="min-w-full divide-y divide-gray-200 bg-white text-sm">
                        <tbody class="divide-y divide-gray-200">
                            <!-- Rows for latest data -->
                            <tr><td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Temperature</td><td class="whitespace-nowrap px-4 py-2 text-gray-700">${latestData.temperature !== null ? latestData.temperature + '&deg;F' : 'N/A'}</td></tr>
                            <tr><td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Feels Like</td><td class="whitespace-nowrap px-4 py-2 text-gray-700">${latestData.feels_like !== null ? latestData.feels_like + '&deg;F' : 'N/A'}</td></tr>
                            <tr><td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Condition</td><td class="whitespace-nowrap px-4 py-2 text-gray-700">${latestData.weather || 'N/A'} (${latestData.description || 'N/A'})</td></tr>
                            <tr><td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Humidity</td><td class="whitespace-nowrap px-4 py-2 text-gray-700">${latestData.humidity !== null ? latestData.humidity + '%' : 'N/A'}</td></tr>
                            <tr><td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Wind Speed</td><td class="whitespace-nowrap px-4 py-2 text-gray-700">${latestData.wind_speed !== null ? latestData.wind_speed + ' mph' : 'N/A'}</td></tr>
                             <tr><td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Coordinates</td><td class="whitespace-nowrap px-4 py-2 text-gray-700">Lat: ${latestData.latitude || 'N/A'}, Lon: ${latestData.longitude || 'N/A'}</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="text-center mb-6"> 
                    <button id="save-history-btn" onclick="saveCurrentWeatherToHistory()" class="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out">
                        Save to Browser History
                    </button>
                </div>
            `;

            // --- Prepare Historical Weather Display (from Local Storage) --- 
            let historyContentHtml = renderHistoryTable(zipCode, historyData); 

            // Combine latest and historical HTML
            resultsDiv.innerHTML = `
                ${latestHtml}
                <div id="history-content" class="mt-6">
                    ${historyContentHtml}
                </div>
            `;
        }
    } catch (error) {
        console.error('Fetch error:', error);
        resultsDiv.innerHTML = '<p class="text-center text-red-500">An error occurred while fetching data. Please check the console.</p>';
    }
});

// --- Helper Function to Render History Table --- 
function renderHistoryTable(zipCode, historyArray) {
     if (historyArray && historyArray.length > 0) {
        let tableRowsHtml = '';
        // Sort by timestamp descending before rendering
        historyArray.sort((a, b) => b.savedAt - a.savedAt);
        historyArray.forEach(record => {
            const recordId = record.id; // Use the client-generated ID
            tableRowsHtml += `
                <tr id="history-row-${recordId}">
                    <td class="whitespace-nowrap px-4 py-2 text-gray-700">${formatDateTime(new Date(record.savedAt))}</td>
                    <td class="whitespace-nowrap px-4 py-2 text-gray-700">${record.temperature !== null ? record.temperature : 'N/A'}</td>
                    <td class="whitespace-nowrap px-4 py-2 text-gray-700">${record.weather || 'N/A'} (${record.description || 'N/A'})</td>
                    <td class="whitespace-nowrap px-4 py-2 text-gray-700">${record.humidity !== null ? record.humidity : 'N/A'}</td>
                    <td class="whitespace-nowrap px-4 py-2 text-gray-700">${record.windSpeed !== null ? record.windSpeed : 'N/A'}</td>
                    <td class="whitespace-nowrap px-4 py-2 text-gray-700">
                        <button onclick="deleteHistoryRecord('${zipCode}', '${recordId}')" class="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-400 transition duration-150 ease-in-out">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        });

        return `
            <h2 class="text-xl font-semibold mb-4 text-center text-gray-800">Browser History for ${zipCode}</h2>
            <div class="overflow-x-auto rounded-lg border border-gray-200">
                <table class="min-w-full divide-y divide-gray-200 bg-white text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">Timestamp</th>
                            <th class="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">Temp (°F)</th>
                            <th class="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">Condition</th>
                            <th class="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">Humidity (%)</th>
                            <th class="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">Wind (mph)</th>
                            <th class="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200" id="history-table-body">
                        ${tableRowsHtml} 
                    </tbody>
                </table>
            </div>
        `;
    } else {
        return '<p id="no-history-msg" class="text-center text-gray-500 mt-6">No historical data found in browser storage for this zip code.</p>';
    }
}

// --- Helper Function to Format Datetime --- 
function formatDateTime(dateObject) {
    if (!dateObject) return 'N/A';
    try {
        // Use Date object directly if available
        return dateObject instanceof Date ? dateObject.toLocaleString() : new Date(dateObject).toLocaleString();
    } catch (e) {
        return String(dateObject); // Return original if parsing fails
    }
}

// --- Function to Handle Save to History (Local Storage) --- 
async function saveCurrentWeatherToHistory() {
    const dataToSave = window.currentLatestData;
    const zipCodeForSave = window.currentZipCode;
    const saveButton = document.getElementById('save-history-btn');

    if (!dataToSave || !zipCodeForSave) {
        alert('No current weather data available to save.');
        return;
    }
    
    if (saveButton) saveButton.disabled = true; 
    if (saveButton) saveButton.textContent = 'Saving...';

    try {
        const historyArray = getHistoryFromLocalStorage(zipCodeForSave);
        
        // Create new record with client-side ID and timestamp
        const newRecord = {
            ...dataToSave, // Spread the weather data
            id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // Simple unique ID
            savedAt: Date.now() // Timestamp in milliseconds
        };

        historyArray.push(newRecord);
        saveHistoryToLocalStorage(zipCodeForSave, historyArray);
        // console.log("Successfully saved to Local Storage:", newRecord);

        // --- Update History Display --- 
        const historyContainer = document.getElementById('history-content');
        if (!historyContainer) { 
            console.error("History container not found!");
            return; 
        }
        
        // Re-render the entire history table section with the updated array
        historyContainer.innerHTML = renderHistoryTable(zipCodeForSave, historyArray);
                 
        if (saveButton) saveButton.textContent = 'Saved!'; 

    } catch (error) {
        console.error('Error saving history to Local Storage:', error);
        alert(`Error saving history: ${error.message}`); 
        if (saveButton) saveButton.disabled = false; 
        if (saveButton) saveButton.textContent = 'Save to Browser History';
    }
}

// --- Function to Handle Delete from History (Local Storage) --- 
async function deleteHistoryRecord(zipCode, recordId) {
    // console.log(`Attempting to delete record ${recordId} for zip ${zipCode} from Local Storage`);
    try {
        let historyArray = getHistoryFromLocalStorage(zipCode);
        const initialLength = historyArray.length;
        
        // Filter out the record to delete
        historyArray = historyArray.filter(record => record.id !== recordId);

        if (historyArray.length < initialLength) {
             saveHistoryToLocalStorage(zipCode, historyArray);
             // console.log(`Successfully deleted record ${recordId} from Local Storage.`);

             // --- Update History Display --- 
             const historyContainer = document.getElementById('history-content');
             if (historyContainer) {
                 // Re-render the history table section
                 historyContainer.innerHTML = renderHistoryTable(zipCode, historyArray);
             } else {
                 console.error("History container not found for deletion update!");
             }
        } else {
            console.warn(`Record ${recordId} not found in Local Storage history for zip ${zipCode}.`);
        }

    } catch (error) {
        console.error('Error deleting record from Local Storage:', error);
        alert(`Error deleting record ${recordId}: ${error.message}`);
    }
}

// Helper function to prepend a row to the history table (NO LONGER NEEDED with full re-render)
// function prependHistoryRow(tableBody, record) { ... } 