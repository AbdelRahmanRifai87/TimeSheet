// Review page functionality with ES6 imports
import { apiService } from "./apiService.js";
import {
    showToast,
    formatCurrency,
    formatHours,
    formatDate,
    formatTime,
    round,
    roundTimesheetRow,
} from "./helpers.js";

// Global variables
let reviewData = [];
let ratesData = [];
let calculatedData = [];
let rawTimesheetData = [];
let timesheetHeadings = [];
let timesheetTotals = [];
let isCalculated = false;

// Initialize the review page

console.log("Review page DOM loaded");
console.log("Window data:", {
    dateRange: window.dateRange,
    locationName: window.locationName,
    shiftSchedule: window.shiftSchedule?.length,
    staticJwt: window.staticJwt ? "Present" : "Missing",
});

window.addEventListener("load", function () {
    initializeReview();
    setupEventListeners();
    calculateReview().then(() => {
        /* do something after calculation */
    });
});

function initializeReview() {
    console.log("Initializing review...");

    // Get data from window variables set by blade template
    const dateRange = window.dateRange || "";
    const locationName = window.locationName || "";
    const shiftSchedule = window.shiftSchedule || [];

    console.log("Data from window:", {
        dateRange,
        locationName,
        shiftScheduleLength: shiftSchedule.length,
    });

    // Display summary
    displaySummary(dateRange, locationName, shiftSchedule);

    // Load rates data
    loadRatesData();

    // Store shift schedule for calculations
    reviewData = shiftSchedule;
    console.log("Review data stored:", reviewData.length, "shifts");
}

function setupEventListeners() {
    // Calculate button
    // document
    //     .getElementById("calculateBtn")
    //     .addEventListener("click", calculateReview);

    // Export button
    document
        .getElementById("exportBtn")
        .addEventListener("click", exportReview);
    console.log("Export button initialized");

    // Column visibility multi-select dropdown
    const columnSelector = document.getElementById("columnSelector");
    columnSelector.addEventListener("change", function () {
        updateColumnVisibility();
    });
}

function displaySummary(dateRange, locationName, shiftSchedule) {
    console.log("Displaying summary:", {
        dateRange,
        locationName,
        shiftScheduleLength: shiftSchedule.length,
    });

    // Update summary information
    document.getElementById("summaryDateRange").textContent =
        dateRange || "Not specified";
    document.getElementById("summaryTotalShifts").textContent =
        shiftSchedule.length || 0;
    document.getElementById("summaryLocations").textContent =
        locationName || "Not specified";

    // Get unique shift types
    console.log("Calculating unique shift types...", shiftSchedule);
    const uniqueShiftTypes = [
        ...new Set(shiftSchedule.map((shift) => shift.shiftType)),
    ];
    console.log("Unique shift types found:", window.reviewData);
    const shiftTypeMap = {};
    if (window.reviewData && Array.isArray(window.reviewData.shift_types)) {
        console.log("Mapping shift types from reviewData...");
        // Create a map of shift type IDs to names
        window.reviewData.shift_types.forEach((st) => {
            shiftTypeMap[st.id] = st.name;
        });
    }
    // Build badge HTML for each shift type name

    const shiftTypeBadges = uniqueShiftTypes
        .map((id) => {
            const name = shiftTypeMap[id] || id;
            return `<span class="inline-block bg-blue-100 text-blue-800 text-xs font-semibold mr-2 mb-1 px-2.5 py-0.5 rounded">${name}</span>`;
        })
        .join("");

    document.getElementById("summaryShiftTypes").innerHTML =
        shiftTypeBadges || '<span class="text-gray-500">None</span>';
}

async function loadRatesData() {
    try {
        showLoading(true);

        // Use apiService to get rates data
        const data = await apiService.getReview();
        console.log("Rates API response:", data);

        ratesData = data.rates || [];
        console.log("Rates data loaded:", ratesData.length, "rates");

        // Display rates in table
        displayRatesTable(ratesData);

        showLoading(false);
    } catch (error) {
        console.error("Error loading rates:", error);
        showToast("Failed to load rates data", "error");
        showLoading(false);
    }
}

function displayRatesTable(rates) {
    const tbody = document.getElementById("ratesTableBody");
    tbody.innerHTML = "";

    if (!rates || rates.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="3" class="border border-gray-300 px-4 py-2 text-center">No rates data available</td></tr>';
        return;
    }

    rates.forEach((rate) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="border border-gray-300 px-4 py-2">${
                rate.day_type_name || "-"
            }</td>
            <td class="border border-gray-300 px-4 py-2">${
                rate.shift_type_name || "-"
            }</td>
            <td class="border border-gray-300 px-4 py-2">${formatCurrency(
                rate.rate
            )}</td>
        `;
        tbody.appendChild(row);
    });
}

async function calculateReview() {
    console.log("Calculate button clicked");

    if (!reviewData || reviewData.length === 0) {
        console.log("No review data available");
        showToast("No shift data available for calculation", "warning");
        return;
    }

    console.log("Review data for calculation:", reviewData);

    try {
        showLoading(true);

        // Prepare data for calculation - transform the data structure to match backend expectations
        const transformedShifts = reviewData.map((shift) => ({
            date: shift.day,
            from: shift.from,
            to: shift.to,
            shift_type_id: parseInt(shift.shiftType),
            employees: parseInt(shift.employees),
        }));

        const calculationData = {
            shifts: transformedShifts,
            location_id: window.reviewData?.location?.id || null,
            date_range: window.dateRange,
        };

        console.log("Sending calculation data:", calculationData);

        // Use apiService to call calculate API
        const response = await apiService.calculateReview(calculationData);
        const data = response.data;
        console.log("Calculate API response data:", data);

        // Check if we have timesheet_data
        if (data.success && data.timesheet_data) {
            // Store raw data and headings/totals globally
            rawTimesheetData = data.timesheet_data;
            timesheetHeadings = data.timesheet_headings || [];
            timesheetTotals = data.totals || [];

            // Transform the timesheet_data array into objects for easier display
            const headings = data.timesheet_headings || [];
            calculatedData = data.timesheet_data.map((row) => {
                const obj = {};
                const numberAfterComma = 2;
                headings.forEach((heading, index) => {
                    switch (heading) {
                        case "Week Starting":
                            obj.week_starting = row[index];
                            break;
                        case "Shift Type":
                            obj.shift_type = row[index];
                            break;
                        case "Location":
                            obj.location = row[index];
                            break;
                        case "Start Date":
                            obj.start_date = row[index];
                            break;
                        case "Scheduled Start":
                            obj.scheduled_start = row[index];
                            break;
                        case "Scheduled Finish":
                            obj.scheduled_finish = row[index];
                            break;
                        case "Scheduled Hours":
                            obj.scheduled_hours = round(
                                row[index],
                                numberAfterComma
                            );
                            break;
                        case "Employee Number":
                            obj.employee_number = row[index];
                            break;
                        case "Day (06–18)":
                            obj.day_rate = round(row[index], numberAfterComma);
                            break;
                        case "Night (18–06)":
                            obj.night_rate = round(
                                row[index],
                                numberAfterComma
                            );
                            break;
                        case "Saturday":
                            obj.saturday = round(row[index], numberAfterComma);
                            break;
                        case "Sunday":
                            obj.sunday = round(row[index], numberAfterComma);
                            break;
                        case "Public Holiday":
                            obj.public_holiday = round(
                                row[index],
                                numberAfterComma
                            );
                            break;
                        case "Client Day Rate":
                            obj.client_day_rate = round(
                                row[index],
                                numberAfterComma
                            );
                            break;
                        case "Client Night Rate":
                            obj.client_night_rate = round(
                                row[index],
                                numberAfterComma
                            );
                            break;
                        case "Client Sat Rate":
                            obj.client_sat_rate = round(
                                row[index],
                                numberAfterComma
                            );
                            break;
                        case "Client Sun Rate":
                            obj.client_sun_rate = round(
                                row[index],
                                numberAfterComma
                            );
                            break;
                        case "Client PH Rate":
                            obj.client_ph_rate = round(
                                row[index],
                                numberAfterComma
                            );
                            break;
                        case "Client Billable":
                            obj.client_billable = round(
                                row[index],
                                numberAfterComma
                            );
                            break;
                        default:
                            // Handle other columns
                            const key = heading
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, "_");
                            obj[key] = row[index];
                    }
                });
                return obj;
            });
        } else {
            calculatedData = data.data || [];
        }

        console.log("Processed calculated data:", calculatedData);

        // Display calculated data in preview table
        // displayPreviewTable(calculatedData);
        // const { sortedData, weekGroups } = groupTimesheetByWeek(rawTimesheetData, timesheetHeadings);
        // Group and sort the calculated data by week and day before displaying
        const { sortedData, weekGroups } = groupTimesheetByWeek(
            rawTimesheetData,
            timesheetHeadings
        );

        // If your display function expects objects, map sortedData to objects using headings:
        const sortedObjects = sortedData.map((row) => {
            const roundedRow = roundTimesheetRow(row, timesheetHeadings, 2);
            const obj = {};
            timesheetHeadings.forEach((heading, idx) => {
                obj[heading.toLowerCase().replace(/[^a-z0-9]/g, "_")] =
                    roundedRow[idx];
            });
            return obj;
        });

        displayPreviewTableT(sortedObjects);

        // Update totals - use totals from API if available
        if (data.totals) {
            updateTotalsFromAPI(data.totals);
        } else {
            updateTotals(calculatedData);
        }

        isCalculated = true;
        showToast("Calculation completed successfully", "success");
        showLoading(false);
    } catch (error) {
        console.error("Error calculating review:", error);
        showToast(
            "Failed to calculate timesheet data: " + error.message,
            "error"
        );
        showLoading(false);
    }
}

// function displayPreviewTable(data) {
//     const tbody = document.getElementById("previewTableBody");
//     tbody.innerHTML = "";

//     if (!data || data.length === 0) {
//         tbody.innerHTML =
//             '<tr><td colspan="19" class="border border-gray-300 px-2 py-1 text-center">No calculated data available</td></tr>';
//         return;
//     }

//     data.forEach((row) => {
//         const tr = document.createElement("tr");
//         tr.innerHTML = `
//             <td class="border border-gray-300 px-2 py-1 col-week-starting">${formatDate(
//                 row.week_starting
//             )}</td>
//             <td class="border border-gray-300 px-2 py-1 col-shift-type">${
//                 row.shift_type || "-"
//             }</td>
//             <td class="border border-gray-300 px-2 py-1 col-location">${
//                 row.location || "-"
//             }</td>
//             <td class="border border-gray-300 px-2 py-1 col-start-date">${formatDate(
//                 row.start_date
//             )}</td>
//             <td class="border border-gray-300 px-2 py-1 col-scheduled-start">${formatTime(
//                 row.scheduled_start
//             )}</td>
//             <td class="border border-gray-300 px-2 py-1 col-scheduled-finish">${formatTime(
//                 row.scheduled_finish
//             )}</td>
//             <td class="border border-gray-300 px-2 py-1 col-scheduled-hours">${formatHours(
//                 row.scheduled_hours
//             )}</td>
//             <td class="border border-gray-300 px-2 py-1 col-employee-number">${
//                 row.employee_number || "-"
//             }</td>
//             <td class="border border-gray-300 px-2 py-1 col-day-rate">${formatHours(
//                 row.day_rate
//             )}</td>
//             <td class="border border-gray-300 px-2 py-1 col-night-rate">${formatHours(
//                 row.night_rate
//             )}</td>
//             <td class="border border-gray-300 px-2 py-1 col-saturday">${formatHours(
//                 row.saturday
//             )}</td>
//             <td class="border border-gray-300 px-2 py-1 col-sunday">${formatHours(
//                 row.sunday
//             )}</td>
//             <td class="border border-gray-300 px-2 py-1 col-public-holiday">${formatHours(
//                 row.public_holiday
//             )}</td>
//             <td class="border border-gray-300 px-2 py-1 col-client-day-rate">${formatCurrency(
//                 row.client_day_rate
//             )}</td>
//             <td class="border border-gray-300 px-2 py-1 col-client-night-rate">${formatCurrency(
//                 row.client_night_rate
//             )}</td>
//             <td class="border border-gray-300 px-2 py-1 col-client-sat-rate">${formatCurrency(
//                 row.client_sat_rate
//             )}</td>
//             <td class="border border-gray-300 px-2 py-1 col-client-sun-rate">${formatCurrency(
//                 row.client_sun_rate
//             )}</td>
//             <td class="border border-gray-300 px-2 py-1 col-client-ph-rate">${formatCurrency(
//                 row.client_ph_rate
//             )}</td>
//             <td class="border border-gray-300 px-2 py-1 col-client-billable">${formatCurrency(
//                 row.client_billable
//             )}</td>
//         `;
//         tbody.appendChild(tr);
//     });
// }

function updateTotalsFromAPI(totals) {
    console.log("Updating totals from API:", totals);

    document.getElementById("totalHours").textContent = formatHours(
        totals.scheduled_hours || 0
    );
    document.getElementById("totalCost").textContent = formatCurrency(
        totals.billable || 0
    );
    document.getElementById("totalDayHours").textContent = formatHours(
        totals.day || 0
    );
    document.getElementById("totalNightHours").textContent = formatHours(
        totals.night || 0
    );
    document.getElementById("totalSatHours").textContent = formatHours(
        totals.saturday || 0
    );
    document.getElementById("totalSunHours").textContent = formatHours(
        totals.sunday || 0
    );
    document.getElementById("totalPHHours").textContent = formatHours(
        totals.public_holiday || 0
    );
}

function updateTotals(data) {
    if (!data || data.length === 0) {
        document.getElementById("totalHours").textContent = "0";
        document.getElementById("totalCost").textContent = formatCurrency(0);
        document.getElementById("totalDayHours").textContent = "0";
        document.getElementById("totalNightHours").textContent = "0";
        return;
    }

    let totalHours = 0;
    let totalCost = 0;
    let totalDayHours = 0;
    let totalNightHours = 0;

    data.forEach((row) => {
        totalHours += parseFloat(row.scheduled_hours || 0);
        totalCost += parseFloat(row.client_billable || 0);

        // Calculate day/night hours based on actual hours worked, not rates
        totalDayHours += parseFloat(row.day_rate || 0);
        totalNightHours += parseFloat(row.night_rate || 0);
    });

    document.getElementById("totalHours").textContent = formatHours(totalHours);
    document.getElementById("totalCost").textContent =
        formatCurrency(totalCost);
    document.getElementById("totalDayHours").textContent =
        formatHours(totalDayHours);
    document.getElementById("totalNightHours").textContent =
        formatHours(totalNightHours);
}

/**
 * Groups and sorts timesheet data by week and day.
 * @param {Array} data - The raw timesheet data (array of arrays).
 * @param {Array} headings - The headings for the data.
 * @returns {Object} { sortedData, weekGroups }
 */
function groupTimesheetByWeek(data, headings) {
    const weekStartingIdx = headings.indexOf("Week Starting");
    const dayIdx = headings.indexOf("Start Date");

    // Sort data by week starting, then by day
    const sortedData = [...data].sort((a, b) => {
        if (a[weekStartingIdx] < b[weekStartingIdx]) return -1;
        if (a[weekStartingIdx] > b[weekStartingIdx]) return 1;
        if (a[dayIdx] < b[dayIdx]) return -1;
        if (a[dayIdx] > b[dayIdx]) return 1;
        return 0;
    });

    // Build group info: for each unique week, store start/end row indices
    const weekGroups = [];
    let currentWeek = null;
    let startIdx = 0;
    for (let i = 0; i < sortedData.length; i++) {
        const week = sortedData[i][weekStartingIdx];
        if (week !== currentWeek) {
            if (currentWeek !== null) {
                weekGroups.push({
                    week: currentWeek,
                    start: startIdx,
                    end: i - 1,
                });
            }
            currentWeek = week;
            startIdx = i;
        }
    }
    // Push the last group
    if (currentWeek !== null && sortedData.length > 0) {
        weekGroups.push({
            week: currentWeek,
            start: startIdx,
            end: sortedData.length - 1,
        });
    }

    return { sortedData, weekGroups };
}

function updateColumnVisibility() {
    const columnSelector = document.getElementById("columnSelector");
    const selectedValues = Array.from(columnSelector.selectedOptions).map(
        (option) => option.value
    );

    // Define core columns that should always be visible (required)
    const coreColumns = ["week-starting", "shift-type", "location"];

    // Define all possible columns
    const allColumns = [
        "week-starting",
        "shift-type",
        "location",
        "start-date",
        "scheduled-start",
        "scheduled-finish",
        "scheduled-hours",
        "employee-number",
        "day-rate",
        "night-rate",
        "saturday",
        "sunday",
        "public-holiday",
        "client-day-rate",
        "client-night-rate",
        "client-sat-rate",
        "client-sun-rate",
        "client-ph-rate",
        "client-billable",
    ];

    // Show/hide columns based on selection
    allColumns.forEach((columnClass) => {
        const columns = document.querySelectorAll(`.col-${columnClass}`);
        columns.forEach((col) => {
            // Always show core columns, or show if selected
            if (
                coreColumns.includes(columnClass) ||
                selectedValues.includes(columnClass)
            ) {
                col.style.display = "";
            } else {
                col.style.display = "none";
            }
        });
    });
    displayPreviewTableT(calculatedData);
}

function displayPreviewTableT(data) {
    // Destroy DataTable before clearing table
    if ($.fn.DataTable.isDataTable("#previewTable")) {
        $("#previewTable").DataTable().destroy();
    }

    const thead = document.getElementById("previewTableHead1");
    const tbody = document.getElementById("previewTableBody1");
    tbody.innerHTML = "";
    thead.innerHTML = "";

    // Get the visible columns (headings)
    const visibleColumns = getVisibleColumns();

    // Build table header
    const trHead = document.createElement("tr");
    visibleColumns.forEach((heading) => {
        const th = document.createElement("th");
        th.textContent = heading;
        th.className = "border border-gray-300 px-2 py-1";
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    // Build table body
    if (!data || data.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = visibleColumns.length;
        td.className = "border border-gray-300 px-2 py-1 text-center";
        td.textContent = "No calculated data available";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    data.forEach((row) => {
        console.log("public_holiday value:", row.public_holiday);
        const tr = document.createElement("tr");

        // Highlight row if public_holiday is set and not empty/zero/"-"
        const isPublicHoliday = Number(row.public_holiday) > 0;

        visibleColumns.forEach((heading) => {
            const key = heading.toLowerCase().replace(/[^a-z0-9]/g, "_");
            let value = row[key] ?? "-";
            if (heading === "Start Date" && value && value !== "-") {
                const dateObj = new Date(value);
                const dayName = dateObj.toLocaleDateString("en-US", {
                    weekday: "long",
                });
                value = isPublicHoliday
                    ? `${value} (${dayName}) PH`
                    : `${value} (${dayName})`;
            }

            // Format hours columns
            const hourColumns = [
                "Scheduled Hours",
                "Day (06–18)",
                "Night (18–06)",
                "Saturday",
                "Sunday",
                "Public Holiday",
            ];
            // Format currency columns
            const currencyColumns = [
                "Client Day Rate",
                "Client Night Rate",
                "Client Sat Rate",
                "Client Sun Rate",
                "Client PH Rate",
                "Client Billable",
            ];

            if (hourColumns.includes(heading) && value !== "-") {
                value = formatHours(value);
            } else if (currencyColumns.includes(heading) && value !== "-") {
                value = formatCurrency(value);
            }

            const td = document.createElement("td");
            td.className = "border border-gray-300 px-2 py-1";
            td.textContent = value;
            tr.appendChild(td);
        });
        if (isPublicHoliday) {
            console.log("Highlighting row for public holiday:", row);
            tr.style.backgroundColor = "#fffbe6"; // Tailwind yellow, or use your own class
            // Or: tr.style.backgroundColor = "#fffbe6";
        }
        tbody.appendChild(tr);
    });

    // (Re)initialize DataTable
    if ($.fn.DataTable.isDataTable("#previewTable")) {
        $("#previewTable").DataTable().destroy();
    }
    $("#previewTable").DataTable({
        paging: true,
        searching: true,
        ordering: true,
        responsive: true,
        columnDefs: [
            { targets: "_all", width: "120px", className: "dt-nowrap" },
        ],
    });
}
async function exportReview() {
    if (!isCalculated) {
        showToast("Please calculate the timesheet first", "warning");
        return;
    }

    try {
        showLoading(true);

        // Get visible columns
        const visibleColumns = getVisibleColumns();
        console.log("Visible columns:", visibleColumns);
        console.log("Timesheet headings:", timesheetHeadings);

        const { sortedData, weekGroups } = groupTimesheetByWeek(
            rawTimesheetData,
            timesheetHeadings
        );
        const roundedSortedData = sortedData.map((row) =>
            roundTimesheetRow(row, timesheetHeadings, 2)
        );

        // Convert visible column names to hidden column indices
        const hiddenColumns = [];
        timesheetHeadings.forEach((heading, index) => {
            if (!visibleColumns.includes(heading)) {
                hiddenColumns.push(index);
            }
        });
        console.log("Hidden column indices:", hiddenColumns);

        // Prepare export data - use the sorted data and include group info
        const exportData = {
            data: roundedSortedData,
            headings: timesheetHeadings,
            hiddenColumns: hiddenColumns,
            totals: timesheetTotals,
            date_range: window.dateRange,
            weekGroups: weekGroups, // <-- send group info for backend coloring
        };

        console.log("Export data:", exportData);

        // Use apiService to call export API
        const response = await apiService.exportReview(exportData);
        const data = response.data;
        console.log("Export response:", data);

        // Handle file download
        if (data.success && data.download_url) {
            // Create a temporary link to download the file
            const link = document.createElement("a");
            link.href = data.download_url;
            link.download = data.file_name || "timesheet.xlsx";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast("Export completed successfully", "success");
        } else {
            console.error("Export failed:", data);
            showToast(data.error || "Export failed", "error");
        }

        showLoading(false);
    } catch (error) {
        console.error("Error exporting review:", error);
        showToast("Failed to export timesheet", "error");
        showLoading(false);
    }
}

function getVisibleColumns() {
    const columns = [];
    const columnSelector = document.getElementById("columnSelector");

    // Map column IDs to actual heading names
    const columnMap = {
        "week-starting": "Week Starting",
        "shift-type": "Shift Type",
        location: "Location",
        "start-date": "Start Date",
        "scheduled-start": "Scheduled Start",
        "scheduled-finish": "Scheduled Finish",
        "scheduled-hours": "Scheduled Hours",
        "employee-number": "Employee Number",
        "day-rate": "Day (06–18)",
        "night-rate": "Night (18–06)",
        saturday: "Saturday",
        sunday: "Sunday",
        "public-holiday": "Public Holiday",
        "client-day-rate": "Client Day Rate",
        "client-night-rate": "Client Night Rate",
        "client-sat-rate": "Client Sat Rate",
        "client-sun-rate": "Client Sun Rate",
        "client-ph-rate": "Client PH Rate",
        "client-billable": "Client Billable",
    };

    // Always include core columns
    const coreColumns = ["week-starting", "shift-type", "location"];
    coreColumns.forEach((columnId) => {
        const columnName = columnMap[columnId];
        if (columnName) {
            columns.push(columnName);
        }
    });

    // Get selected options from multi-select (excluding core columns to avoid duplicates)
    Array.from(columnSelector.selectedOptions).forEach((option) => {
        const columnId = option.value;
        if (!coreColumns.includes(columnId)) {
            const columnName = columnMap[columnId] || columnId;
            columns.push(columnName);
        }
    });

    return columns;
}

function showLoading(show) {
    const overlay = document.getElementById("loadingOverlay");
    if (show) {
        overlay.classList.remove("hidden");
    } else {
        overlay.classList.add("hidden");
    }
}
