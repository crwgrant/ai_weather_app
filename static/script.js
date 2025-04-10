const form = document.getElementById('weather-form');
const zipCodeInput = document.getElementById('zip-code');
const resultsDiv = document.getElementById('weather-results');

form.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default page reload
    const zipCode = zipCodeInput.value.trim();
    resultsDiv.innerHTML = '<p class="text-center text-gray-500">Loading...</p>'; // Show loading indicator

    if (!zipCode) {
        resultsDiv.innerHTML = '<p class="text-center text-red-500">Please enter a zip code.</p>';
        return;
    }

    try {
        const response = await fetch(`/weather/${zipCode}`);
        const data = await response.json();

        if (!response.ok) {
            // Display API error message from FastAPI
            resultsDiv.innerHTML = `<p class="text-center text-red-500">Error: ${data.detail || 'Could not fetch weather data.'}</p>`;
        } else {
            const latestData = data.latest;
            const historyData = data.history;

            // --- Display Latest Weather Data --- 
            // Store latest data globally for the save button
            window.currentLatestData = latestData; 
            window.currentZipCode = zipCode; // Store zip code too
            
            let latestHtml = `
                <h2 class="text-xl font-semibold mb-4 text-center text-gray-800">Latest Weather in ${latestData.city || 'N/A'}</h2>
                <div class="overflow-x-auto rounded-lg border border-gray-200 mb-2">
                    <table class="min-w-full divide-y divide-gray-200 bg-white text-sm">
                        <tbody class="divide-y divide-gray-200">
                            <tr>
                                <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Temperature</td>
                                <td class="whitespace-nowrap px-4 py-2 text-gray-700">${latestData.temperature !== null ? latestData.temperature + '&deg;F' : 'N/A'}</td>
                            </tr>
                            <tr>
                                <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Feels Like</td>
                                <td class="whitespace-nowrap px-4 py-2 text-gray-700">${latestData.feels_like !== null ? latestData.feels_like + '&deg;F' : 'N/A'}</td>
                            </tr>
                            <tr>
                                <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Condition</td>
                                <td class="whitespace-nowrap px-4 py-2 text-gray-700">${latestData.weather || 'N/A'} (${latestData.description || 'N/A'})</td>
                            </tr>
                            <tr>
                                <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Humidity</td>
                                <td class="whitespace-nowrap px-4 py-2 text-gray-700">${latestData.humidity !== null ? latestData.humidity + '%' : 'N/A'}</td>
                            </tr>
                            <tr>
                                <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Wind Speed</td>
                                <td class="whitespace-nowrap px-4 py-2 text-gray-700">${latestData.wind_speed !== null ? latestData.wind_speed + ' mph' : 'N/A'}</td>
                            </tr>
                             <tr>
                                <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Coordinates</td>
                                <td class="whitespace-nowrap px-4 py-2 text-gray-700">Lat: ${latestData.latitude || 'N/A'}, Lon: ${latestData.longitude || 'N/A'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="text-center mb-6"> 
                    <button id="save-history-btn" 
                            onclick="saveCurrentWeatherToHistory()" 
                            class="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out">
                        Save to History
                    </button>
                </div>
            `;

            // --- Prepare Historical Weather Display --- 
            let historyContentHtml = ''; 
            if (historyData && historyData.length > 0) {
                let tableRowsHtml = '';
                historyData.forEach(record => {
                    const recordId = record.id; 
                    tableRowsHtml += `
                        <tr id="history-row-${recordId}">
                            <td class="whitespace-nowrap px-4 py-2 text-gray-700">${formatDateTime(record.createdAt)}</td>
                            <td class="whitespace-nowrap px-4 py-2 text-gray-700">${record.temperature !== null ? record.temperature : 'N/A'}</td>
                            <td class="whitespace-nowrap px-4 py-2 text-gray-700">${record.weather || 'N/A'} (${record.description || 'N/A'})</td>
                            <td class="whitespace-nowrap px-4 py-2 text-gray-700">${record.humidity !== null ? record.humidity : 'N/A'}</td>
                            <td class="whitespace-nowrap px-4 py-2 text-gray-700">${record.windSpeed !== null ? record.windSpeed : 'N/A'}</td>
                            <td class="whitespace-nowrap px-4 py-2 text-gray-700">
                                <button 
                                    onclick="deleteHistoryRecord(${recordId})" 
                                    class="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-400 transition duration-150 ease-in-out">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    `;
                });

                historyContentHtml = `
                    <h2 class="text-xl font-semibold mb-4 text-center text-gray-800">Historical Data for ${zipCode}</h2>
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
                historyContentHtml = '<p id="no-history-msg" class="text-center text-gray-500 mt-6">No historical data found for this zip code.</p>';
            }

            // Combine latest and historical HTML (wrapped in its own container)
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

// --- Helper Function to Format Datetime --- Moved to outer scope
function formatDateTime(isoString) {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString();
    } catch (e) {
        return isoString; // Return original if parsing fails
    }
}

// --- Function to Handle Save to History --- 
async function saveCurrentWeatherToHistory() {
    const dataToSave = window.currentLatestData;
    const zipCodeForSave = window.currentZipCode;
    const saveButton = document.getElementById('save-history-btn');

    if (!dataToSave || !zipCodeForSave) {
        alert('No current weather data available to save.');
        return;
    }
    
    // Disable button to prevent multiple clicks
    if (saveButton) saveButton.disabled = true; 
    if (saveButton) saveButton.textContent = 'Saving...';

    // Ensure zipCode is part of the payload if not already included
    const payload = { ...dataToSave, zipCode: zipCodeForSave }; 

    console.log("Attempting to POST data:", payload);

    try {
        const response = await fetch('/weather/history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const newRecord = await response.json(); 

        // --- Update History Display --- 
        const historyContainer = document.getElementById('history-content');
        if (!historyContainer) { 
            console.error("History container not found!");
            return; 
        }

        let historyTableBody = document.getElementById('history-table-body');
        const noHistoryMsg = document.getElementById('no-history-msg');

        if (noHistoryMsg) {
            // If "No history" message is present, remove it and create table structure
            historyContainer.innerHTML = ` 
                <h2 class="text-xl font-semibold mb-4 text-center text-gray-800">Historical Data for ${zipCodeForSave}</h2>
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
                            <!-- New row will be prepended here -->
                        </tbody>
                    </table>
                </div>
            `;
            // Get the newly created table body
            historyTableBody = document.getElementById('history-table-body'); 
        }

        // Prepend the new row if table body exists
        if (historyTableBody) {
            prependHistoryRow(historyTableBody, newRecord);
        } else {
             console.error("History table body not found after attempting to create it!");
        }
         
        if (saveButton) saveButton.textContent = 'Saved!'; // Keep button disabled, change text

    } catch (error) {
        console.error('Error saving history:', error);
        // Keep the error alert for feedback on failures
        alert(`Error saving history: ${error.message}`); 
         // Re-enable button on error
         if (saveButton) saveButton.disabled = false; 
         if (saveButton) saveButton.textContent = 'Save to History';
    }
}

// Helper function to prepend a row to the history table
function prependHistoryRow(tableBody, record) {
     const newRow = tableBody.insertRow(0); // Insert at the top
     newRow.id = `history-row-${record.id}`;
     newRow.innerHTML = `
        <td class="whitespace-nowrap px-4 py-2 text-gray-700">${formatDateTime(record.createdAt)}</td>
        <td class="whitespace-nowrap px-4 py-2 text-gray-700">${record.temperature !== null ? record.temperature : 'N/A'}</td>
        <td class="whitespace-nowrap px-4 py-2 text-gray-700">${record.weather || 'N/A'} (${record.description || 'N/A'})</td>
        <td class="whitespace-nowrap px-4 py-2 text-gray-700">${record.humidity !== null ? record.humidity : 'N/A'}</td>
        <td class="whitespace-nowrap px-4 py-2 text-gray-700">${record.windSpeed !== null ? record.windSpeed : 'N/A'}</td>
        <td class="whitespace-nowrap px-4 py-2 text-gray-700">
            <button 
                onclick="deleteHistoryRecord(${record.id})" 
                class="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-400 transition duration-150 ease-in-out">
                Delete
            </button>
        </td>
    `;
}

// --- Existing Delete Function --- 
async function deleteHistoryRecord(recordId) {
    console.log(`Attempting to delete record ${recordId}`);
    try {
        const response = await fetch(`/weather/history/${recordId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        // If successful, remove the row from the table
        const rowToRemove = document.getElementById(`history-row-${recordId}`);
        if (rowToRemove) {
            rowToRemove.remove();
            console.log(`Successfully removed row for record ${recordId}`);
            // Optional: Check if table body is now empty and show message
            const historyTableBody = document.getElementById('history-table-body');
            if (historyTableBody && historyTableBody.rows.length === 0) {
                // Find the history section and replace table with message
                // This is a bit simplistic; might need better DOM traversal
                 const historyContainer = historyTableBody.closest('div.overflow-x-auto').parentNode;
                 if(historyContainer){
                    historyContainer.innerHTML = '<p class="text-center text-gray-500 mt-6">No historical data remaining for this zip code.</p>';
                 }
            }
        } else {
            console.warn(`Could not find row history-row-${recordId} to remove.`);
        }

    } catch (error) {
        console.error('Error deleting record:', error);
         // Keep the error alert for feedback on failures
        alert(`Error deleting record ${recordId}: ${error.message}`);
    }
} 