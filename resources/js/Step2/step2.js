import { apiService } from "../apiService";
import {
    showToast,
    validateRequired,
    extractAxiosErrorMsg,
    showModal,
} from "../helpers";
import { SelectionManager } from "./SelectionManager";

const records = {}; // Keyed by location ID
let previousFormData = {}; // Store previous form data for each location
let shiftTypes = []; // Initialize shiftTypes as an empty array
async function loadShiftTypes() {
    try {
        shiftTypes = await apiService.getShiftTypes(); // Fetch shift types from the API
        console.log("Shift types loaded:", shiftTypes);
    } catch (error) {
        console.error("Failed to load shift types:", error);
    }
}

locations.forEach((location) => {
    records[location.id] = []; // Initialize an empty array for each location
});
// Filtering state
let filterDayValue = "";
let filterShiftTypeValue = "";

// const selectionManager = new SelectionManager();

function renderColumnDropdown(
    headings,
    selectedColumnIds,
    coreColumns,
    previewData
) {
    const menu = document.getElementById("columnDropdownMenu");
    menu.innerHTML = "";
    headings.forEach((heading, idx) => {
        const colId = heading.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const isCore = coreColumns.includes(colId);
        const label = document.createElement("label");
        label.className =
            "flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = colId;
        checkbox.checked = selectedColumnIds.has(colId);
        checkbox.disabled = isCore;
        checkbox.className = "mr-2";
        checkbox.addEventListener("change", () => {
            if (isCore) return;
            if (checkbox.checked) {
                selectedColumnIds.add(colId);
            } else {
                selectedColumnIds.delete(colId);
            }
            updateColumnDropdownText(headings, selectedColumnIds);
            populatePreviewTable(headings, previewData, selectedColumnIds);
        });
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(heading));
        menu.appendChild(label);
    });
    updateColumnDropdownText(headings, selectedColumnIds);
}

function updateColumnDropdownText(headings, selectedColumnIds) {
    const dropdownText = document.getElementById("columnDropdownText");
    const selectedHeadings = headings.filter((h) =>
        selectedColumnIds.has(h.toLowerCase().replace(/[^a-z0-9]/g, "_"))
    );

    if (selectedHeadings.length === 0) {
        dropdownText.innerHTML = `<span class="text-gray-400 italic">Select Columns</span>`;
    } else {
        dropdownText.innerHTML = selectedHeadings
            .map(
                (h) =>
                    `<span class="inline-block bg-blue-100 text-blue-700 font-semibold rounded-md px-3 py-1 mr-1 mb-1 text-xs shadow">${h}</span>`
            )
            .join("");
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

function initializeSaveButtons() {
    // Add event listeners to all Save buttons
    locations.forEach((location) => {
        const saveButton = document.getElementById(`saveBtn_${location.id}`);
        if (saveButton) {
            saveButton.addEventListener("click", function () {
                renderTable(location.id);
                handleSaveButtonClick(location.id);
            });
        }
    });
}

function handleSaveButtonClick(locationId, silent = false) {
    return new Promise((resolve) => {
        console.log(`Save button clicked for location: ${locationId}`);

        const saveBtn = document.getElementById(`saveBtn_${locationId}`);
        const btnText = saveBtn.querySelector(".save-btn-text");
        const btnSpinner = saveBtn.querySelector(".save-btn-spinner");
        const btnCheck = saveBtn.querySelector(".save-btn-check");

        // Show spinner, hide text and check
        btnText.classList.add("hidden");
        btnSpinner.classList.remove("hidden");
        btnCheck.classList.add("hidden");
        if (records[locationId].length === 0) {
            showToast("No records to save.", "error");
            btnSpinner.classList.add("hidden");
            btnText.classList.remove("hidden");
            resolve(false);
            return;
        }

        // Validate records for the location
        const { duplicates, defaultShiftTypeRecords } =
            validateRecords(locationId);
        if (duplicates.length > 0) {
            highlightDuplicateRows(locationId, duplicates);
            showToast(
                "Duplicate records found. Please resolve them before saving.",
                "error"
            );
            btnSpinner.classList.add("hidden");
            btnText.classList.remove("hidden");
            return;
            resolve(false);
        }

        if (defaultShiftTypeRecords.length > 0) {
            highlightDuplicateRows(locationId, defaultShiftTypeRecords);
            showToast(
                "Records with the default shift type are not allowed. Please update them.",
                "error"
            );
            btnSpinner.classList.add("hidden");
            btnText.classList.remove("hidden");
            resolve(false);
        }
        if (!silent)
            showToast("No duplicates found. Proceeding to save.", "success");

        const mappedShifts = records[locationId].map((rec) => {
            // Find the shift type object by name
            const shiftTypeObj = shiftTypes.find(
                (st) => st.name === rec.shiftType || st.id === rec.shiftType
            );
            return {
                shift_type_id: shiftTypeObj ? shiftTypeObj.id : rec.shiftType, // fallback if already id
                day: rec.day,
                from: rec.from,
                to: rec.to,
                employees: parseInt(rec.employees, 10), // ensure it's a number
                date_range: rec.dateRange || rec.date_range,
            };
        });

        console.log(
            "data sent to calculate function",
            mappedShifts,
            " locationId",
            locationId
        );

        // // Send API request to calculate totals
        apiService
            .calculateReview({
                shifts: mappedShifts,
                location_id: locationId,
            })
            .then((response) => {
                console.log("API response from calculateReview:", response);

                if (response.data.success) {
                    // ...update UI...
                    if (!silent)
                        showToast("Totals calculated successfully!", "success");
                    console.log("Totals calculated successfully:", response);
                    const totals = response.data.totals;
                    const totalsDisplay = document.getElementById(
                        `totalsDisplay_${locationId}`
                    );
                    if (totalsDisplay) {
                        totalsDisplay.innerHTML = `
        <strong>Total Scheduled Hours:</strong>
        : ${Number(totals.scheduled_hours).toFixed(2)} 
       <strong> Total Billable:</strong> $${Number(totals.billable).toFixed(2)}
    `;
                    }
                    btnSpinner.classList.add("hidden");
                    btnCheck.classList.remove("hidden");
                    setTimeout(() => {
                        btnCheck.classList.add("hidden");
                        btnText.classList.remove("hidden");
                    }, 1500); // Show check for 1.5 seconds
                    if (!silent)
                        showToast("Totals calculated successfully!", "success");
                    // Show the preview modal
                    document
                        .getElementById("previewModal")
                        .classList.remove("hidden");
                    console.log("Preview modal opened");

                    // Store data locally
                    const previewHeadings = response.data.timesheet_headings;
                    const previewData = response.data.timesheet_data;
                    const coreColumns = [
                        "week_starting",
                        "shift_type",
                        "location",
                    ]; // match backend keys

                    // By default, select all columns
                    const selectedColumnIds = new Set(
                        previewHeadings.map((h) =>
                            h.toLowerCase().replace(/[^a-z0-9]/g, "_")
                        )
                    );

                    // Render dropdown and table
                    renderColumnDropdown(
                        previewHeadings,
                        selectedColumnIds,
                        coreColumns,
                        previewData
                    );
                    populatePreviewTable(
                        previewHeadings,
                        previewData,
                        selectedColumnIds
                    );

                    // Dropdown toggle logic (unchanged)
                    document.getElementById("columnDropdownBtn").onclick =
                        function (e) {
                            e.stopPropagation();
                            document
                                .getElementById("columnDropdownMenu")
                                .classList.toggle("hidden");
                        };
                    document.addEventListener("click", function (e) {
                        const menu =
                            document.getElementById("columnDropdownMenu");
                        const btn =
                            document.getElementById("columnDropdownBtn");
                        if (
                            !menu.contains(e.target) &&
                            !btn.contains(e.target)
                        ) {
                            menu.classList.add("hidden");
                        }
                    });
                    resolve(true);
                } else {
                    if (!silent)
                        showToast("Failed to calculate totals.", "error");
                    resolve(false);
                }
            })
            .catch((error) => {
                console.error("Error calculating totals:", error);
                if (!silent)
                    showToast(
                        "An error occurred while calculating totals.",
                        "error"
                    );

                btnSpinner.classList.add("hidden");
                btnText.classList.remove("hidden");
                resolve(false);
            });
    });
}
function populatePreviewTable(headings, data, selectedColumnIds) {
    // Destroy DataTable before clearing table
    if ($.fn.DataTable.isDataTable("#previewTable")) {
        $("#previewTable").DataTable().destroy();
    }

    const thead = document.getElementById("previewTableHead1");
    const tbody = document.getElementById("previewTableBody1");
    tbody.innerHTML = "";
    thead.innerHTML = "";

    // Only show columns that are selected
    const visibleColumns = headings.filter((h) =>
        selectedColumnIds.has(h.toLowerCase().replace(/[^a-z0-9]/g, "_"))
    );

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
        const tr = document.createElement("tr");

        // Highlight row if public_holiday is set and not empty/zero/"-"
        // Find the index of "Public Holiday" in visibleColumns and in headings
        const phIndex = headings.findIndex(
            (h) =>
                h.toLowerCase().replace(/[^a-z0-9]/g, "_") === "public_holiday"
        );
        const isPublicHoliday = phIndex !== -1 && Number(row[phIndex]) > 0;

        visibleColumns.forEach((heading) => {
            // Find the index of this heading in the headings array
            const idx = headings.indexOf(heading);
            let value = idx !== -1 ? row[idx] : "-";

            // Format Start Date with day name and PH
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
                value = Number(value).toFixed(2);
            } else if (currencyColumns.includes(heading) && value !== "-") {
                value = "$" + Number(value).toFixed(2);
            }

            const td = document.createElement("td");
            td.className = "border border-gray-300 px-2 py-1";
            td.textContent = value;
            tr.appendChild(td);
        });
        if (isPublicHoliday) {
            tr.style.backgroundColor = "#fffbe6";
        }
        tbody.appendChild(tr);
    });

    // (Re)initialize DataTable
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
function validateRecords(locationId) {
    const locationRecords = records[locationId];
    const duplicates = [];
    const defaultShiftTypeRecords = [];

    // Check for duplicates
    locationRecords.forEach((record, index) => {
        const isDuplicate = locationRecords.some((otherRecord, otherIndex) => {
            return (
                index !== otherIndex &&
                record.day === otherRecord.day &&
                record.shiftType === otherRecord.shiftType &&
                record.from === otherRecord.from &&
                record.to === otherRecord.to &&
                record.employees === otherRecord.employees &&
                record.dateRange === otherRecord.dateRange
            );
        });

        if (isDuplicate) {
            duplicates.push(record);
        }
        // Check for default shift type
        if (record.shiftType === "Default") {
            defaultShiftTypeRecords.push(record);
        }
    });

    return { duplicates, defaultShiftTypeRecords };
}
function highlightDuplicateRows(locationId, recordsToHighlight) {
    const tableBody = document.querySelector(`#shiftTable_${locationId} tbody`);
    tableBody.querySelectorAll("tr").forEach((row) => {
        const rowId = row.getAttribute("data-id");
        const isDuplicate = recordsToHighlight.some(
            (record) => record.groupedId === rowId
        );

        if (isDuplicate) {
            row.classList.add("bg-red-100", "border-red-500");
        } else {
            row.classList.remove("bg-red-100", "border-red-500");
        }
    });
}

// Show the Batch Form Modal
function showBatchFormModal(locationId) {
    const modal = document.getElementById(`batchFormModal_${locationId}`);
    modal.classList.remove("hidden");
}

// Hide the Batch Form Modal
function hideBatchFormModal(locationId) {
    console.log(`Hiding modal for location ${locationId}`);
    const modal = document.getElementById(`batchFormModal_${locationId}`);
    modal.classList.add("hidden");
}

// Populate filter dropdowns
function populateFilters() {
    const daySel = document.getElementById("filterDay");
    const shiftSel = document.getElementById("filterShiftType");

    // Populate day filter
    daySel.innerHTML =
        `<option value="">All</option>` +
        uniqueDayNames
            .map((dayName) => `<option value="${dayName}">${dayName}</option>`)
            .join("");

    // Populate shift type filter
    shiftSel.innerHTML =
        `<option value="">All</option>` +
        shiftTypes
            .map((st) => `<option value="${st.id}">${st.name}</option>`)
            .join("");
}
function getFilteredRecords(locationId) {
    return records[locationId].filter(
        (rec) =>
            (!filterDayValue || rec.day === filterDayValue) &&
            (!filterShiftTypeValue || rec.shiftType == filterShiftTypeValue)
    );
}

// Filter records based on selected day and shift type
function getGroupedRecords() {
    return records.filter(
        (rec) =>
            (!filterDayValue || rec.day === filterDayValue) &&
            (!filterShiftTypeValue || rec.shiftType == filterShiftTypeValue)
    );
}

function initializeTimePickers(locationId) {
    const fromInput = document.getElementById(`batchFrom_${locationId}`);
    const toInput = document.getElementById(`batchTo_${locationId}`);

    if (fromInput) {
        flatpickr(fromInput, {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
        });
    }

    if (toInput) {
        flatpickr(toInput, {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
        });
    }
}
function renderRow(rec, locationId) {
    console.log("Rendering row for record:", records[locationId]);
    const tr = document.createElement("tr");
    tr.setAttribute("data-id", rec.groupedId); // Add the unique ID as a data attribute
    console.log("The ID in data-id attribute is", tr.dataset.id);

    // Render all days, highlighting selected days in blue and others in gray
    const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayCellContent = allDays
        .map((day) =>
            rec.days.includes(day)
                ? `<span class="inline-block bg-[#337ab7] text-white flex-1 day-label text-center px-2 py-1 rounded text-s">${day}</span>`
                : `<span class="inline-block bg-gray-300 opacity-50 flex-1 day-label text-center px-2 py-1 rounded text-s">${day}</span>`
        )
        .join("");

    tr.innerHTML = `
        <td class="border px-2 py-1 align-top w-[28%]">
            <div class="w-full flex flex-wrap justify-around items-end gap-2">
                ${dayCellContent}
            </div>
        </td>
        <td class="border text-center leading-[180%] w-[15%] px-2 py-1 align-top">${rec.shiftType}</td>
        <td class="border text-center leading-[180%] w-[15%] px-2 py-1 align-top">${rec.dateRange}</td>
        <td class="border text-center leading-[180%] w-[10%] px-2 py-1 align-top">${rec.from}</td>
        <td class="border text-center leading-[180%] w-[10%] px-2 py-1 align-top">${rec.to}</td>
        <td class="border text-center leading-[180%] w-[10%] px-2 py-1 align-top">${rec.employees}</td>
        <td class="border w-[7%] px-2 py-1">
            <div class="text-center flex justify-center items-start gap-3 align-top">
                <!-- Add Button -->
                <button type="button" class="text-green-600 add-row-btn" title="Add Row">
                    <i class="fa-solid fa-clone"></i>
                </button>

                <!-- Update Button -->
                <button type="button" class="text-blue-600 update-row-btn" title="Update Row">
                    <i class="fas fa-edit text-yellow-600"></i>
                </button>
                <button type="button" class="text-red-600 remove-record-btn" data-key="${rec.shiftType}-${rec.from}-${rec.to}">
                    <i class="fa-solid fa-trash-can text-[#cf4c3f]"></i>
                </button>
            </div>
        </td>
    `;

    // Attach event listeners to the buttons
    const addRowBtn = tr.querySelector(".add-row-btn");
    const updateRowBtn = tr.querySelector(".update-row-btn");
    const removeRecordBtn = tr.querySelector(".remove-record-btn");

    addRowBtn.addEventListener("click", () => {
        addRow(locationId, tr);
    });

    updateRowBtn.addEventListener("click", () => {
        NewUpdateRow(locationId, tr);
    });

    removeRecordBtn.addEventListener("click", () => {
        const recordId = tr.getAttribute("data-id");
        records[locationId] = records[locationId].filter(
            (rec) => rec.groupedId !== recordId
        );
        tr.remove();
        localStorage.setItem(
            `records_${locationId}`,
            JSON.stringify(records[locationId])
        );
        renderTable(locationId); // Optionally re-render the table
    });

    return tr;
}

function renderTable(locationId) {
    console.log(
        `Rendering table for location ${locationId} with records:`,
        records[locationId]
    );

    // Remove duplicates from the records array
    const uniqueRecords = [];
    const seen = new Set();

    // records[locationId].forEach((rec) => {
    //     const recordKey = `${rec.day}-${rec.shiftType}-${rec.from}-${rec.to}`;
    //     if (!seen.has(recordKey)) {
    //         seen.add(recordKey);
    //         uniqueRecords.push(rec);
    //     }
    // });

    // // Update the records array with unique records
    // records[locationId] = uniqueRecords;
    // Sort the records by `shiftType`
    records[locationId].sort((a, b) => {
        if (a.shiftType < b.shiftType) return -1;
        if (a.shiftType > b.shiftType) return 1;
        return 0;
    });

    console.log(
        `Sorted records for location ${locationId}:`,
        records[locationId]
    );
    const tbody = document.querySelector(`#shiftTable_${locationId} tbody`);
    tbody.innerHTML = "";

    const filteredRecords = getFilteredRecords(locationId);
    console.log(
        `Filtered records for location ${locationId}:`,
        filteredRecords
    );
    // Group records by shift type
    const groupedRecords = filteredRecords.reduce((acc, rec) => {
        const key = `${rec.shiftType}-${rec.from}-${rec.to}-${rec.employees}-${rec.groupedId}`;
        if (!acc[key]) {
            acc[key] = { ...rec, days: [rec.day] }; // Initialize with the first day
        } else {
            acc[key].days.push(rec.day); // Add the day to the existing group
        }
        return acc;
    }, {});

    Object.values(groupedRecords).forEach((rec, idx) => {
        const tr = document.createElement("tr");
        tr.setAttribute("data-id", rec.groupedId); // Add the unique ID as a data attribute
        console.log("the id in data-id attribute is", tr.dataset.id);
        // Render all days, highlighting selected days in blue and others in gray
        const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const dayCellContent = allDays
            .map((day) =>
                rec.days.includes(day)
                    ? `<span class="inline-block bg-[#337ab7] text-white flex-1 day-label text-center px-2 py-1 rounded text-s  ">${day}</span>`
                    : `<span class="inline-block bg-gray-300 opacity-50 flex-1 day-label text-center px-2 py-1 rounded text-s ">${day}</span>`
            )
            .join("");
        tr.innerHTML = `
            <td class="border px-2 py-1 align-top w-[28%]">
            <div class=" w-full flex flex-wrap justify-around items-end gap-2">
            ${dayCellContent}</div>
                   
                </td>
            <td class="border text-center leading-[180%] w-[15%] px-2 py-1 align-top">${rec.shiftType}</td>
            <td class="border text-center leading-[180%] w-[15%] px-2 py-1 align-top">${rec.dateRange}</td>

            <td class="border text-center leading-[180%] w-[10%] px-2 py-1 align-top">${rec.from}</td>
            <td class="border text-center leading-[180%] w-[10%] px-2 py-1 align-top">${rec.to}</td>
            <td class="border text-center leading-[180%] w-[10%] px-2 py-1 align-top">${rec.employees}</td>
            <td class="border w-[7%] px-2 py-1 ">
            <div class="text-center flex justify-center items-start gap-3 align-top">
                <!-- Add Button -->
                <button type="button" class="text-green-600 add-row-btn" title="Add Row">
                    <i class="fa-solid fa-clone"></i>
                </button>

                <!-- Update Button -->
                <button type="button" class="text-blue-600 update-row-btn" title="Update Row">
                    <i class="fas fa-edit text-yellow-600 "></i>
                </button>
                <button type="button" class="text-red-600 remove-record-btn" data-key="${rec.shiftType}-${rec.from}-${rec.to}">
                    <i class="fa-solid fa-trash-can text-[#cf4c3f]"></i>
                </button></div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Add event listeners for Add, Update, and Delete buttons
    tbody.querySelectorAll(".add-row-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const clickedRow = this.closest("tr");
            addRow(locationId, clickedRow);
        });
    });

    tbody.querySelectorAll(".update-row-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const clickedRow = this.closest("tr");
            NewUpdateRow(locationId, clickedRow);
        });
    });

    // Add event listeners for delete buttons
    tbody.querySelectorAll(".remove-record-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const clickedRow = this.closest("tr");
            const recordId = clickedRow.getAttribute("data-id"); // Get the unique ID from the row

            // Remove the record from the `records` array
            records[locationId] = records[locationId].filter(
                (rec) => rec.groupedId !== recordId
            );

            console.log(`Record with ID ${recordId} removed.`);
            console.log("Updated records:", records[locationId]);

            // Remove the row from the table
            clickedRow.remove();

            // Update localStorage after removing the record
            localStorage.setItem(
                `records_${locationId}`,
                JSON.stringify(records[locationId])
            );

            // Optionally re-render the table to reflect changes
            renderTable(locationId);
        });
    });
}
function addRow(locationId, clickedRow) {
    // Get the `groupedId` of the clicked row to find its position in the `records` array
    const groupedId = clickedRow.dataset.id;

    // Find the index of the record in the `records` array
    const recordIndex = records[locationId].findIndex(
        (rec) => rec.groupedId === groupedId
    );

    if (recordIndex === -1) {
        console.error(`Record with groupedId ${groupedId} not found.`);
        return;
    }

    // Get the values from the clicked row
    const days = clickedRow.querySelector("td:nth-child(1)").textContent.trim();
    const shiftType = clickedRow
        .querySelector("td:nth-child(2)")
        .textContent.trim();
    const dateRange = clickedRow
        .querySelector("td:nth-child(3)")
        .textContent.trim();
    const from = clickedRow.querySelector("td:nth-child(4)").textContent.trim();
    const to = clickedRow.querySelector("td:nth-child(5)").textContent.trim();
    const employees = clickedRow
        .querySelector("td:nth-child(6)")
        .textContent.trim();
    const selectedDays = Array.from(
        clickedRow.querySelectorAll("td:nth-child(1) .day-label")
    )
        .filter((dayLabel) => dayLabel.classList.contains("bg-[#337ab7]"))
        .map((dayLabel) => dayLabel.textContent.trim());

    if (selectedDays.length === 0) {
        console.warn(
            "No selected days found. Check the row structure or class name."
        );
        console.log("Clicked Row:", clickedRow);
        console.log(
            "Day Labels:",
            clickedRow.querySelectorAll("td:nth-child(1) .day-label")
        );
        return;
    }

    // Generate a unique ID for the grouped records
    const recordId = generateRecordId();

    // Create the new record object
    const newRecords = selectedDays.map((day) => ({
        id: generateRecordId(), // Add the unique ID
        groupedId: recordId, // Use the same ID for grouping
        day,
        shiftType,
        from,
        to,
        employees,
        dateRange,
    }));

    // Insert the new records directly after the clicked record in the `records` array
    records[locationId].splice(recordIndex + 1, 0, ...newRecords);

    console.log("Records after adding duplicate:", records[locationId]);

    // Re-render the table to reflect the new record
    renderTable(locationId);

    showToast("Row duplicated successfully!", "success");
}
function NewUpdateRow(locationId, clickedRow) {
    const rowId = clickedRow.dataset.id; // Get the unique ID of the row

    clickedRow.classList.add("shadow-lg", "bg-gray-100");
    clickedRow.style.boxShadow =
        "0px 4px 6px rgba(0, 0, 0, 0.1), 0px -4px 6px rgba(0, 0, 0, 0.1), 4px 0px 6px rgba(0, 0, 0, 0.1), -4px 0px 6px rgba(0, 0, 0, 0.1)";
    console.log("id of the clicked row is", clickedRow.dataset.id);
    // Default values
    const defaultShiftType = "Default";
    const defaultDateRange = "25-1-1 to 25-1-30";
    const defaultFrom = "00:00";
    const defaultTo = "23:59";
    const defaultEmployees = 1;

    // Unlock the row for editing
    const dayCell = clickedRow.querySelector("td:nth-child(1)");
    const shiftTypeCell = clickedRow.querySelector("td:nth-child(2)");
    const dateRangeCell = clickedRow.querySelector("td:nth-child(3)");

    const fromCell = clickedRow.querySelector("td:nth-child(4)");
    const toCell = clickedRow.querySelector("td:nth-child(5)");
    const employeesCell = clickedRow.querySelector("td:nth-child(6)");
    const actionsCell = clickedRow.querySelector("td:nth-child(7)");

    // Extract previous values from the clicked row
    const previousDays = Array.from(dayCell.querySelectorAll(".day-label"))
        .filter((span) => span.classList.contains("bg-[#337ab7]")) // Check for selected styling
        .map((span) => span.textContent.trim()); // Extract the text content of selected days
    const previousShiftType = shiftTypeCell.textContent.trim();
    const previousDateRange = dateRangeCell.textContent.trim();
    const previousFrom = fromCell.textContent.trim();
    const previousTo = toCell.textContent.trim();
    const previousEmployees = employeesCell.textContent.trim();

    const previousFormData = {
        id: clickedRow.dataset.id, // Use the unique ID from the row
        dayArray: previousDays,
        shiftType: previousShiftType,
        dateRange: previousDateRange,
        fromTime: previousFrom,
        toTime: previousTo,
        employees: previousEmployees,
    };
    console.log("Previous Form Data:", previousFormData);

    // Check if the row is still in its default state
    const isDefaultRow =
        previousShiftType === defaultShiftType &&
        previousDateRange === defaultDateRange &&
        previousFrom === defaultFrom &&
        previousTo === defaultTo &&
        parseInt(previousEmployees, 10) === defaultEmployees;

    // Apply default values if the row is still default
    const shiftType = isDefaultRow ? defaultShiftType : previousShiftType;
    const dateRange = isDefaultRow ? defaultDateRange : previousDateRange;
    const from = isDefaultRow ? defaultFrom : previousFrom;
    const to = isDefaultRow ? defaultTo : previousTo;
    const employees = isDefaultRow ? defaultEmployees : previousEmployees;

    // Days Cell: Render checkboxes for days
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    dayCell.innerHTML = ` <div class="flex flex-col gap-1 mt-2 items-start">    
     <div class=" flex justify-center gap-2">
        <button type="button" class="btn-weekdays bg-blue-400 hover:bg-blue-500 text-white font-medium px-2 py-1 rounded shadow-md transition duration-300">Weekdays</button>
        <button type="button" class="btn-weekends bg-blue-400 hover:bg-blue-500 text-white font-medium px-2 py-1 rounded shadow-md transition duration-300">Weekends</button>
        <button type="button" class="btn-all-days bg-blue-400 hover:bg-blue-500 text-white font-medium px-2 py-1 rounded shadow-md transition duration-300">All Days</button>
    </div>                
    <div class=" w-full mb-3 flex flex-wrap gap-2 justify-between items-end">
            ${days
                .map(
                    (day) =>
                        `<span class="day-label ${
                            previousDays.includes(day)
                                ? "bg-[#337ab7] text-white"
                                : "bg-gray-300 opacity-50 hover:shadow-md hover:text-blue-500"
                        } inline-block flex-1 text-center px-2 py-1 rounded text-s  cursor-pointer border hover:border-blue-500 hover:shadow-md hover:shadow-blue-500 hover:bg-blue-400 hover:text-white  box-border transition duration-300">${day}</span>`
                )
                .join("")}</div>
              
    
    </div>`;

    // Add event listeners to day boxes to toggle styles
    const dayBoxes = dayCell.querySelectorAll(".day-label");
    dayBoxes.forEach((dayBox) => {
        dayBox.addEventListener("click", () => {
            if (dayBox.classList.contains("bg-[#337ab7]")) {
                // Deselect the day (change to gray with low opacity)
                dayBox.className =
                    "day-label inline-block flex-1 bg-gray-300 opacity-50 text-center px-2 py-1 rounded cursor-pointer border hover:border-blue-500 hover:shadow-md hover:shadow-blue-500 hover:bg-blue-400 hover:text-white  box-border transition duration-300";
            } else {
                // Select the day (change to blue)
                dayBox.className =
                    "day-label inline-block flex-1 bg-[#337ab7] text-white text-center px-2 py-1 rounded cursor-pointer border hover:border-blue-500 hover:shadow-md hover:shadow-blue-500 hover:bg-blue-400 hover:text-white  box-border transition duration-300";
            }
        });
    });

    // Shift Type Cell: Render dropdown
    shiftTypeCell.innerHTML = `
       <select class="shift-type-dropdown w-full border rounded px-2 py-1">
           ${shiftTypes
               .map(
                   (type) =>
                       `<option value="${type.id}" ${
                           type.name === shiftType ? "selected" : ""
                       }>${type.name}</option>`
               )
               .join("")}
        </select>
    `;

    // Date Range Cell: Render Flatpickr input
    dateRangeCell.innerHTML = `<div class="flex justify-center w-full h-[100%] items-center gap-2">
    <input type="text" class="flatpickr-date-range w-full text-center  border rounded px-2 py-1" value="${dateRange}"  />
    </div   >`;
    flatpickr(dateRangeCell.querySelector(".flatpickr-date-range"), {
        mode: "range",
        dateFormat: "y-m-d",
        allowInput: true,
        onClose: function (selectedDates, dateStr, instance) {
            // Ensure at least two dates are selected
            if (selectedDates.length === 2) {
                const startDate = selectedDates[0];
                const endDate = selectedDates[1];

                // Calculate the difference in days
                const diffInDays = Math.ceil(
                    (endDate - startDate) / (1000 * 60 * 60 * 24)
                );

                // Check if the range is less than 7 days
                if (diffInDays < 7) {
                    showToast(
                        "The selected date range must be at least 7 days.",
                        "error"
                    );

                    // Clear the input field or reset the selection
                    instance.clear();
                }
            }
        },
    });

    let activeInput = null; // Track the currently active input field
    console.log("Previous From:", previousFrom);

    // From and To Cells: Render Flatpickr inputs
    fromCell.innerHTML = `<div class="flex w-full mx-auto justify-center items-center gap-2">
    <input type="number" class="flatpickr-from w-full  border text-center rounded px-2 py-1"  value="${from}" />

    </div>`;
    toCell.innerHTML = `<div class="flex justify-center w-full items-center gap-2">
    <input type="text" class="flatpickr-to w-full text-center border rounded px-2 py-1" value="${to}" />

    </div>`;

    const fromFlatpickr = flatpickr(fromCell.querySelector(".flatpickr-from"), {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 15,
        scrollInput: true,
        onOpen: function (selectedDates, dateStr, instance) {
            // Add instruction below the Flatpickr popup
            const instruction = document.createElement("div");
            instruction.className =
                "flatpickr-instruction text-xs text-gray-500 mt-2";
            instruction.textContent = "Click on hours or minutes and scroll";
            instance.calendarContainer.appendChild(instruction);
            // Prevent background scrolling when Flatpickr is open
            document.body.style.overflow = "hidden";
        },
        onClose: function (selectedDates, dateStr, instance) {
            // Remove the instruction when the popup closes
            const instruction = instance.calendarContainer.querySelector(
                ".flatpickr-instruction"
            );
            if (instruction) {
                instruction.remove();
            }
            // Restore background scrolling when Flatpickr is closed
            document.body.style.overflow = "";
        },
        defaultDate: previousFrom,
    });

    const toFlatpickr = flatpickr(toCell.querySelector(".flatpickr-to"), {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        minuteIncrement: 15,
        time_24hr: true,
        onOpen: function (selectedDates, dateStr, instance) {
            // Add instruction below the Flatpickr popup
            const instruction = document.createElement("div");
            instruction.className =
                "flatpickr-instruction text-xs text-gray-500 mt-2";
            instruction.textContent = "Click on hours or minutes and scroll .";
            instance.calendarContainer.appendChild(instruction);
            // Prevent background scrolling when Flatpickr is open
            document.body.style.overflow = "hidden";
        },
        onClose: function (selectedDates, dateStr, instance) {
            // Remove the instruction when the popup closes
            const instruction = instance.calendarContainer.querySelector(
                ".flatpickr-instruction"
            );
            if (instruction) {
                instruction.remove();
            }
            // Restore background scrolling when Flatpickr is closed
            document.body.style.overflow = "";
        },
        defaultDate: previousTo,
    });
    // Add focus event listeners to track the active input field
    fromCell.querySelector(".flatpickr-from").addEventListener("focus", (e) => {
        console.log("Focus on from input");
        activeInput = e.target; // Set the active input field
    });
    toCell.querySelector(".flatpickr-to").addEventListener("focus", (e) => {
        console.log("Focus on to input");
        activeInput = e.target; // Set the active input field
    });

    // Add blur event listeners to clear the active input field
    fromCell.querySelector(".flatpickr-from").addEventListener("blur", () => {
        console.log("Blur on from input");
        activeInput = null; // Clear the active input field
    });
    toCell.querySelector(".flatpickr-to").addEventListener("blur", () => {
        console.log("Blur on to input");
        activeInput = null; // Clear the active input field
    });

    // // Global wheel event listener to update the active input field
    document.addEventListener("wheel", (e) => {
        if (!activeInput) return; // If no active input, do nothing
        console.log("Active input:", activeInput);

        e.preventDefault(); // Prevent page scrolling
        console.log("Wheel event detected on active input");
        const currentValue = activeInput.value.split(":"); // Split the value into hours and minutes
        let hours = parseInt(currentValue[0] || "0", 10);
        let minutes = parseInt(currentValue[1] || "0", 10);
        console.log("Current hours:", hours, "Current minutes:", minutes);

        if (e.shiftKey) {
            // Scroll affects minutes when Shift key is pressed
            console.log("Shift key pressed, adjusting minutes");
            minutes += scrollDirection * 15;
            if (minutes >= 60) {
                minutes = 0;
                hours = hours + 1;
            } else if (minutes < 0) {
                minutes = 59;
                hours = hours - 1;
            }
        } else {
            // Scroll affects hours by default
            hours = e.deltaY < 0 ? hours + 1 : hours - 1;
        }

        // Ensure the value stays within the valid range
        if (hours >= 0 && hours <= 23) {
            activeInput.value = `${String(hours).padStart(2, "0")}:${String(
                minutes
            ).padStart(2, "0")}`;
            if (activeInput.classList.contains("flatpickr-from")) {
                fromFlatpickr.setDate(activeInput.value, true); // Update Flatpickr value
            } else if (activeInput.classList.contains("flatpickr-to")) {
                toFlatpickr.setDate(activeInput.value, true); // Update Flatpickr value
            }
        }
    });

    // Employees Cell: Render number input
    employeesCell.innerHTML = `<div class="flex w-full  justify-center items-center ">
    <input type="number" class="employees-input w-full border text-center rounded px-2 py-1" min="1" value="${
        employees || 1
    }" step="1"  />
    </div>`;
    // Add wheel event listener for scrolling functionality
    const employeesInput = employeesCell.querySelector(".employees-input");
    employeesInput.addEventListener("wheel", (e) => {
        e.preventDefault(); // Prevent page scrolling
        const currentValue = parseInt(employeesInput.value || "1", 10);
        const newValue = e.deltaY < 0 ? currentValue + 1 : currentValue - 1;

        // Ensure the value stays within the valid range (minimum 1)
        if (newValue >= 1) {
            employeesInput.value = newValue;
        }
    });

    // Actions Cell: Add Confirm button
    actionsCell.innerHTML = `
      <div class="flex justify-center items-center gap-2">
        <button type="button" id="confirmBtn_${rowId}" class="btn-confirm bg-[#87b87f] hover:bg-lime-700 text-white font-medium px-2 py-1 rounded shadow-md transition duration-300"><i class="fas fa-check"></i></button>
        <button type="button" id="cancelBtn_${rowId}" class="btn-cancel bg-red-500 hover:bg-red-600 text-white font-medium px-2 py-1 rounded shadow-md transition duration-300"><i class="fas fa-times"></i></button>
    </div>
`;

    // Add event listeners for buttons
    const weekdaysBtn = dayCell.querySelector(".btn-weekdays");
    const weekendsBtn = dayCell.querySelector(".btn-weekends");
    const allDaysBtn = dayCell.querySelector(".btn-all-days");
    const confirmBtn = document.getElementById(`confirmBtn_${rowId}`);
    const cancelBtn = document.getElementById(`cancelBtn_${rowId}`);

    weekdaysBtn.addEventListener("click", () => {
        NewselectDays(dayCell, ["Mon", "Tue", "Wed", "Thu", "Fri"]);
    });

    weekendsBtn.addEventListener("click", () => {
        NewselectDays(dayCell, ["Sat", "Sun"]);
    });

    allDaysBtn.addEventListener("click", () => {
        NewselectDays(dayCell, days);
    });

    confirmBtn.addEventListener("click", () => {
        saveRowEdits(locationId, previousFormData, clickedRow);
    });
    cancelBtn.addEventListener("click", () => {
        // // Restore the row to its original state
        // dayCell.innerHTML = previousDays
        //     .map(
        //         (day) =>
        //             `<span class="inline-block bg-[#337ab7] text-white text-center px-2 py-1 rounded border hover:border-blue-500 hover:shadow-md hover:shadow-blue-500 hover:bg-blue-400 hover:text-white  box-border transition duration-300">${day}</span>`
        //     )
        //     .join("");

        // shiftTypeCell.textContent = previousShiftType;
        // dateRangeCell.textContent = previousDateRange;
        // fromCell.textContent = previousFrom;
        // toCell.textContent = previousTo;
        // employeesCell.textContent = previousEmployees;
        // const recordToBeRendered = {
        //     groupedId: rowId,
        //     days: previousDays,
        //     shiftType: previousShiftType,
        //     dateRange: previousDateRange,
        //     from: previousFrom,
        //     to: previousTo,
        //     employees: previousEmployees,
        // };
        // clickedRow.classList.remove("shadow-lg", "bg-gray-100");

        // // Restore the row to its original state using renderRow
        // const restoredRow = renderRow(recordToBeRendered, locationId);

        // // Remove the shadow and background color added during editing

        // // renderTable(locationId); // Re-render the table to reflect changes

        // Construct the record object using previousFormData
        const recordToBeRendered = {
            groupedId: rowId, // Unique ID of the row
            days: previousFormData.dayArray, // Previous selected days
            shiftType: previousFormData.shiftType, // Previous shift type
            dateRange: previousFormData.dateRange, // Previous date range
            from: previousFormData.fromTime, // Previous start time
            to: previousFormData.toTime, // Previous end time
            employees: previousFormData.employees, // Previous number of employees
        };

        // Restore the row to its original state using renderRow
        const restoredRow = renderRow(recordToBeRendered, locationId);

        // Replace the current row with the restored row
        clickedRow.replaceWith(restoredRow);

        showToast("Row reverted successfully!", "info");
    });
}

function NewselectDays(dayCell, days) {
    const dayBoxes = dayCell.querySelectorAll(".day-label");
    dayBoxes.forEach((dayBox) => {
        if (days.includes(dayBox.textContent)) {
            // Select the day (change to blue)
            dayBox.className =
                "day-label inline-block flex-1 bg-[#337ab7] text-white text-center px-2 py-1 rounded cursor-pointer border hover:border-blue-500 hover:shadow-md hover:shadow-blue-500 hover:bg-blue-400 hover:text-white  box-border transition duration-300";
        } else {
            // Deselect the day (change to gray with low opacity)
            dayBox.className =
                "day-label inline-block flex-1 bg-gray-300 opacity-50 text-center px-2 py-1 rounded cursor-pointer border hover:border-blue-500 hover:shadow-md hover:shadow-blue-500 hover:bg-blue-400 hover:text-white  box-border transition duration-300";
        }
    });
}

function saveRowEdits(locationId, previousFormData, clickedRow) {
    const dayCell = clickedRow.querySelector("td:nth-child(1)");
    const shiftTypeCell = clickedRow.querySelector("td:nth-child(2)");
    const dateRangeCell = clickedRow.querySelector("td:nth-child(3)");

    const fromCell = clickedRow.querySelector("td:nth-child(4)");
    const toCell = clickedRow.querySelector("td:nth-child(5)");
    const employeesCell = clickedRow.querySelector("td:nth-child(6)");

    const selectedDays = Array.from(dayCell.querySelectorAll(".day-label"))
        .filter((dayLabel) => dayLabel.classList.contains("bg-[#337ab7]"))
        .map((dayLabel) => dayLabel.textContent.trim());

    const shiftTypeId = shiftTypeCell.querySelector(
        ".shift-type-dropdown"
    ).value;
    const shiftType = getShiftTypeTextById(locationId, shiftTypeId);

    const dateRange = dateRangeCell.querySelector(
        ".flatpickr-date-range"
    ).value;
    const from = fromCell.querySelector(".flatpickr-from").value;
    const to = toCell.querySelector(".flatpickr-to").value;
    const employees = employeesCell.querySelector(".employees-input").value;
    console.log(`Saving edits for location ${locationId}:`, {
        selectedDays,
        shiftType,
        from,
        to,
        employees,
        dateRange,
    });
    const rowId = clickedRow.dataset.id; // Get the unique ID from the row

    // Validate inputs
    if (
        !selectedDays.length ||
        !shiftType ||
        !from ||
        !to ||
        employees <= 0 ||
        !dateRange
    ) {
        showToast("Please fill in all required fields.", "error");
        return;
    }
    console.log("records before delete:", records[locationId]);

    // Delete records with the same previous data but different days
    records[locationId] = records[locationId].filter((rec) => {
        // Normalize values for comparison
        const normalizedDay = rec.day.trim();
        console.log("Normalized day:", normalizedDay);
        // const normalizedShiftType = rec.shiftType.trim();
        // const normalizedFrom = rec.from.trim();
        // const normalizedTo = rec.to.trim();
        // const normalizedEmployees = parseInt(rec.employees, 10);

        // const previousShiftType = previousFormData.shiftType.trim();
        // const previousFromTime = previousFormData.fromTime.trim();
        // const previousToTime = previousFormData.toTime.trim();
        // const previousEmployees = parseInt(previousFormData.employees, 10);

        // const isSameData =
        //     normalizedShiftType === previousShiftType &&
        //     normalizedFrom === previousFromTime &&
        //     normalizedTo === previousToTime &&
        //     normalizedEmployees === previousEmployees;

        // const isDifferentDay =
        //     !selectedDays.includes(normalizedDay) && rowId !== rec.groupedId;
        const toDelete =
            rec.groupedId === rowId && !selectedDays.includes(normalizedDay);

        // Keep the record if it doesn't match the previous data or has the same day
        return !toDelete;
    });
    console.log("records after delete:", records[locationId]);

    // Update the existing record in the `records` array

    console.log("Previous form data:", previousFormData);
    console.log("Selected days:", selectedDays);
    selectedDays.forEach((day) => {
        console.log(`Updating record for day: ${day}`);
        console.log("Records for location:", records[locationId]);

        const existingRecord = records[locationId].find((rec) => {
            // Normalize values for comparison
            const normalizedDay = rec.day.trim();
            const normalizedShiftType = rec.shiftType.trim();
            const normalizedFrom = rec.from.trim();
            const normalizedTo = rec.to.trim();
            const normalizedEmployees = parseInt(rec.employees, 10);

            const previousShiftType = previousFormData.shiftType.trim();
            const previousFromTime = previousFormData.fromTime.trim();
            const previousToTime = previousFormData.toTime.trim();
            const previousEmployees = parseInt(previousFormData.employees, 10);

            return (
                rec.groupedId === rowId && // Match the unique ID
                normalizedDay === day &&
                normalizedShiftType === previousShiftType &&
                normalizedFrom === previousFromTime &&
                normalizedTo === previousToTime &&
                normalizedEmployees === previousEmployees
            );
        });

        console.log("Existing record found:", existingRecord);

        if (existingRecord) {
            // Update the existing record with new values
            //update update the shift type
            existingRecord.shiftType = shiftType;
            existingRecord.dateRange = dateRange;
            existingRecord.from = from;
            existingRecord.to = to;
            existingRecord.employees = employees;
        } else {
            // Add a new record for the updated day
            records[locationId].push({
                id: generateRecordId(),
                groupedId: rowId, // Use the unique ID from the previous form data
                // Add the unique ID
                day,
                shiftType,
                from,
                to,
                employees,
                dateRange,
            });
            console.log("New record added:", {
                groupedId: rowId,
                id: generateRecordId(),
                day,
                shiftType,
                from,
                to,
                employees,
                dateRange,
            });
        }
    });
    // Construct the record object for rendering the updated row
    const recordToBeRendered = {
        groupedId: rowId,
        days: selectedDays,
        shiftType,
        dateRange,
        from,
        to,
        employees,
    };

    // Use renderRow to update the specific row
    const updatedRow = renderRow(recordToBeRendered, locationId);

    // Replace the current row with the updated row
    clickedRow.replaceWith(updatedRow);
    showToast("Row updated successfully!", "success");
}

function generateRecordId() {
    return `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function updateRow(locationId, clickedRow) {
    const modal = document.getElementById(`batchFormModal_${locationId}`);

    // Get values from the clicked row
    const day = clickedRow.querySelector("td:nth-child(1)").textContent.trim();
    const shiftType = clickedRow
        .querySelector("td:nth-child(2)")
        .textContent.trim();
    const fromTime = clickedRow
        .querySelector("td:nth-child(3)")
        .textContent.trim();
    const toTime = clickedRow
        .querySelector("td:nth-child(4)")
        .textContent.trim();
    const employees = clickedRow
        .querySelector("td:nth-child(5)")
        .textContent.trim();
    console.log(`Updating row for location ${locationId}:`, {
        day,
        shiftType,
        fromTime,
        toTime,
        employees,
    });

    // Pre-fill the modal fields
    const daysField = document.getElementById(`batchDays_${locationId}`);
    const shiftTypeField = document.getElementById(
        `batchShiftType_${locationId}`
    );
    const fromField = document.getElementById(`batchFrom_${locationId}`);
    const toField = document.getElementById(`batchTo_${locationId}`);
    const employeesField = document.getElementById(
        `batchEmployees_${locationId}`
    );
    console.log("Modal fields:", {
        daysField,
        shiftTypeField,
        fromField,
        toField,
        employeesField,
    });

    if (
        !daysField ||
        !shiftTypeField ||
        !fromField ||
        !toField ||
        !employeesField
    ) {
        console.error("One or more modal fields are missing.");
        return;
    }
    // Ensure the day string is properly formatted
    const formattedDay = day.replace(/([A-Za-z]{3})(?=[A-Za-z]{3})/g, "$1,");
    console.log("Formatted day string:", formattedDay);
    // Split the day string into an array of individual days
    const dayArray = formattedDay.split(",").map((d) => d.trim());
    console.log("Day array:", dayArray);

    // Update the custom dropdown for batch days
    const options = Array.from(daysField.options);
    options.forEach((option) => {
        option.selected = dayArray.includes(option.value);
    });

    // Update the custom dropdown checkboxes
    const dropdownWrapper = daysField.parentElement.querySelector(".relative");
    if (dropdownWrapper) {
        const checkboxes = dropdownWrapper.querySelectorAll(
            ".batch-day-checkbox"
        );
        checkboxes.forEach((checkbox) => {
            checkbox.checked = dayArray.includes(checkbox.value);
        });

        // Update the dropdown button text
        const selectedOptions = options
            .filter((opt) => opt.selected)
            .map((opt) => opt.textContent);
        const dropdownButton = dropdownWrapper.querySelector("button span");
        if (dropdownButton) {
            dropdownButton.textContent =
                selectedOptions.length > 0
                    ? selectedOptions.join(", ")
                    : "Select Days";
        }
    }
    // Set the shift type in the dropdown
    Array.from(shiftTypeField.options).forEach((option) => {
        if (option.textContent.trim() === shiftType) {
            option.selected = true;
        }
    });
    // make the select tag of shift tyoe disabled
    shiftTypeField.disabled = true;
    fromField.value = fromTime; // Set the from time value
    toField.value = toTime; // Set the to time value
    employeesField.value = employees; // Set the employees value

    // Show the modal
    modal.classList.remove("hidden");

    previousFormData = {
        dayArray,
        shiftType,
        fromTime,
        toTime,
        employees,
    };
}
function attachRowEventListeners(locationId) {
    const tableBody = document.querySelector(`#shiftTable_${locationId} tbody`);

    // Add Row Button
    tableBody.querySelectorAll(".add-row-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const clickedRow = this.closest("tr");
            addRow(locationId, clickedRow);
        });
    });

    // Update Row Button
    tableBody.querySelectorAll(".update-row-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const clickedRow = this.closest("tr");
            updateRow(locationId, clickedRow);
        });
    });

    // Delete Row Button
    tableBody.querySelectorAll(".remove-record-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const clickedRow = this.closest("tr");
            clickedRow.remove();
        });
    });
}

function initializeCustomDropdownForBatchDays(locationId, selectElement) {
    const options = Array.from(selectElement.options);

    // Create a custom dropdown
    const dropdownWrapper = document.createElement("div");
    dropdownWrapper.className = "relative";

    const dropdownButton = document.createElement("button");
    dropdownButton.type = "button";
    dropdownButton.className =
        "bg-gray-200 px-4 py-2 rounded w-full text-left flex justify-between items-center";
    dropdownButton.innerHTML = `<span>Select Days</span><i class="fas fa-chevron-down"></i>`;

    const dropdownMenu = document.createElement("div");
    dropdownMenu.className =
        "absolute bg-white border rounded shadow hidden w-full z-10 flex flex-wrap gap-4 p-2";

    // Populate the dropdown menu with checkboxes
    options.forEach((option) => {
        const label = document.createElement("label");
        label.className =
            "flex items-center gap-2 bg-gray-100 px-3 py-2 rounded hover:bg-gray-200 cursor-pointer shadow-sm";
        label.style.minWidth = "120px";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = option.value;
        checkbox.className = "mr-2 batch-day-checkbox";
        checkbox.checked = option.selected;

        checkbox.addEventListener("change", () => {
            option.selected = checkbox.checked;

            // Update the button text
            const selectedOptions = options
                .filter((opt) => opt.selected)
                .map((opt) => opt.textContent);
            dropdownButton.querySelector("span").textContent =
                selectedOptions.length > 0
                    ? selectedOptions.join(", ")
                    : "Select Days";

            // Trigger the change event on the select element
            const event = new Event("change");
            selectElement.dispatchEvent(event);
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(option.textContent));
        dropdownMenu.appendChild(label);
    });

    // Toggle dropdown visibility
    dropdownButton.addEventListener("click", () => {
        dropdownMenu.classList.toggle("hidden");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (
            !dropdownWrapper.contains(e.target) &&
            !dropdownMenu.classList.contains("hidden")
        ) {
            dropdownMenu.classList.add("hidden");
        }
    });

    // Replace the select element with the custom dropdown
    selectElement.style.display = "none";
    dropdownWrapper.appendChild(dropdownButton);
    dropdownWrapper.appendChild(dropdownMenu);
    selectElement.parentNode.insertBefore(
        dropdownWrapper,
        selectElement.nextSibling
    );
}

function populateBatchDays(locationId) {
    const daysSelect = document.getElementById(`batchDays_${locationId}`);
    const weekdaysBtn = document.getElementById(`weekdaysBtn_${locationId}`);
    const weekendsBtn = document.getElementById(`weekendsBtn_${locationId}`);
    const allDaysBtn = document.getElementById(`allDaysBtn_${locationId}`);

    if (daysSelect) {
        // Clear existing options
        daysSelect.innerHTML = "";

        // Add options for days
        const daysOptions = [
            { value: "Mon", label: "Monday" },
            { value: "Tue", label: "Tuesday" },
            { value: "Wed", label: "Wednesday" },
            { value: "Thu", label: "Thursday" },
            { value: "Fri", label: "Friday" },
            { value: "Sat", label: "Saturday" },
            { value: "Sun", label: "Sunday" },
        ];

        daysOptions.forEach((day) => {
            const opt = document.createElement("option");
            opt.value = day.value;
            opt.textContent = day.label;
            daysSelect.appendChild(opt);
        });

        // Initialize the custom dropdown for batch days
        initializeCustomDropdownForBatchDays(locationId, daysSelect);

        // Add event listeners for the buttons
        if (weekdaysBtn) {
            weekdaysBtn.addEventListener("click", () => {
                selectDays(daysSelect, ["Mon", "Tue", "Wed", "Thu", "Fri"]);
            });
        }

        if (weekendsBtn) {
            weekendsBtn.addEventListener("click", () => {
                selectDays(daysSelect, ["Sat", "Sun"]);
            });
        }

        if (allDaysBtn) {
            allDaysBtn.addEventListener("click", () => {
                selectDays(daysSelect, [
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                    "Sun",
                ]);
            });
        }
    }
}
function selectDays(selectElement, days) {
    const options = Array.from(selectElement.options);

    // Clear all selections
    options.forEach((option) => {
        option.selected = false;
    });

    // Select the specified days
    options.forEach((option) => {
        if (days.includes(option.value)) {
            option.selected = true;
        }
    });

    // Update the custom dropdown checkboxes
    const dropdownWrapper =
        selectElement.parentElement.querySelector(".relative");
    if (dropdownWrapper) {
        const checkboxes = dropdownWrapper.querySelectorAll(
            ".batch-day-checkbox"
        );
        checkboxes.forEach((checkbox) => {
            checkbox.checked = days.includes(checkbox.value);
        });

        // Update the dropdown button text
        const selectedOptions = options
            .filter((opt) => opt.selected)
            .map((opt) => opt.textContent);
        const dropdownButton = dropdownWrapper.querySelector("button span");
        if (dropdownButton) {
            dropdownButton.textContent =
                selectedOptions.length > 0
                    ? selectedOptions.join(", ")
                    : "Select Days";
        }
    }

    // Trigger the change event on the select element
    const event = new Event("change");
    selectElement.dispatchEvent(event);
}

locations.forEach((location) => {
    populateBatchDays(location.id);
});

function showBatchForm(locationId) {
    const batchForm = document.getElementById(`batchForm_${locationId}`);
    batchForm.classList.remove("hidden");
}

function populateBatchShiftTypes(locationId) {
    const shiftTypesSelect = document.getElementById(
        `shiftTypes_${locationId}`
    );
    const batchShiftTypeSelect = document.getElementById(
        `batchShiftType_${locationId}`
    );
    const filterShiftTypeSelect = document.getElementById(
        `filterShiftType_${locationId}`
    );

    // Debugging: Log the elements
    console.log("shiftTypesSelect:", shiftTypesSelect);
    console.log("batchShiftTypeSelect:", batchShiftTypeSelect);
    console.log("filterShiftTypeSelect:", filterShiftTypeSelect);
    batchShiftTypeSelect.innerHTML = ""; // Clear existing options
    filterShiftTypeSelect.innerHTML = `<option value="">All</option>`; // Clear and add "All" option

    console.log("Available shift types:", shiftTypes);

    Array.from(shiftTypes).forEach((option) => {
        const opt = document.createElement("option");
        opt.value = option.id;
        opt.textContent = option.name;
        batchShiftTypeSelect.appendChild(opt);

        // Add to filter dropdown
        const filterOpt = document.createElement("option");
        filterOpt.value = option.value;
        filterOpt.textContent = option.textContent;
        filterShiftTypeSelect.appendChild(filterOpt);
    });
}
function getShiftTypeTextById(locationId, shiftTypeId) {
    // const shiftTypesSelect = document.getElementById(
    //     `shiftTypes_${locationId}`
    // );
    // if (!shiftTypesSelect) {
    //     console.error(
    //         `Shift types select element not found for location: ${locationId}`
    //     );
    //     return null;
    // }
    console.log(
        `Getting shift type text for ID: ${shiftTypeId} at location: ${locationId} from these shift types:`,
        shiftTypes
    );

    // Find the option with the matching value (ID)
    const option = Array.from(shiftTypes).find(
        (shiftType) => String(shiftType.id) === String(shiftTypeId)
    );
    console.log("Found option:", option);

    // Return the text content if found, otherwise return null
    return option ? option.name : null;
}

function addShift(locationId) {
    const shiftTypeID = document.getElementById(
        `batchShiftType_${locationId}`
    ).value;
    const shiftType = getShiftTypeTextById(locationId, shiftTypeID);
    const from = document.getElementById(`batchFrom_${locationId}`).value;
    const to = document.getElementById(`batchTo_${locationId}`).value;
    const employees =
        parseInt(
            document.getElementById(`batchEmployees_${locationId}`).value,
            10
        ) || 1;
    const selectedDays = Array.from(
        document.getElementById(`batchDays_${locationId}`).selectedOptions
    ).map((opt) => opt.value);

    // Validation
    if (!shiftType || !from || !to || selectedDays.length === 0) {
        showToast(
            "Please select shift type, times, and at least one day.",
            "error"
        );
        return;
    }

    if (employees < 1) {
        showToast("Number of employees must be at least 1.", "error");
        return;
    }
    console.log("Adding shift:", {
        locationId,
        shiftType,
        from,
        to,
        employees,
        selectedDays,
    });

    let hasDuplicate = false;

    selectedDays.forEach((dayName) => {
        console.log(
            "Processing day:",
            dayName,
            "the records for location:",
            records[locationId]
        );
        console.log(
            "selected shift type:",
            shiftType,
            "from:",
            from,
            "to:",
            to
        );
        const existingRecords = records[locationId].filter(
            (rec) => rec.day === dayName && rec.shiftType === shiftType
        );
        console.log("Existing records for day:", dayName, existingRecords);

        // Check for duplicates
        const duplicate = existingRecords.find(
            (rec) => rec.from === from && rec.to === to
        );
        if (duplicate) {
            hasDuplicate = true;
            // Show error and skip adding this shift
            showToast("A shift with the same time already exists.", "error");
            return;
        }

        // Update empty record if exists
        const emptyRecord = existingRecords.find((rec) => !rec.from || !rec.to);
        console.log("Empty record found:", emptyRecord);
        if (emptyRecord) {
            console.log("Updating empty record:", emptyRecord);
            emptyRecord.from = from;
            emptyRecord.to = to;
            emptyRecord.employees = employees;
        } else {
            // Add new record
            records[locationId].push({
                day: dayName,
                shiftType,
                from,
                to,
                employees,
            });
        }
    });

    if (hasDuplicate) {
        showToast("A shift with the same time already exists.", "error");
        return;
    }

    showToast("Shift added successfully!", "success");
    renderTable(locationId);
}
function addDefaultShiftRow(locationId) {
    // Define default values
    const defaultDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const defaultShiftType = "Default";
    const defaultDateRange = "25-1-1 to 25-1-30";
    const defaultFrom = "00:00";
    const defaultTo = "23:59";
    const defaultEmployees = 1;
    const recordId = generateRecordId(); // Generate a unique ID

    // Collect new records in an array
    const newRecords = defaultDays.map((day) => ({
        groupedId: recordId,
        id: generateRecordId(),
        day,
        shiftType: defaultShiftType,
        from: defaultFrom,
        to: defaultTo,
        employees: defaultEmployees,
        dateRange: defaultDateRange,
    }));

    // Add to the in-memory records array
    records[locationId].push(...newRecords);
    console.log("records after adding default shift row:", records[locationId]);

    // Handle localStorage
    const storageKey = `records_${locationId}`;
    let storedRecords = [];
    const existing = localStorage.getItem(storageKey);
    if (existing) {
        try {
            storedRecords = JSON.parse(existing);
        } catch (e) {
            storedRecords = [];
        }
    }
    storedRecords.push(...newRecords);
    localStorage.setItem(storageKey, JSON.stringify(storedRecords));

    // Re-render the table to reflect the new record
    renderTable(locationId);

    showToast("Default shift row added successfully!", "success");
}

function openAddShiftTypeModal(locationId) {
    const modal = document.getElementById("addShiftTypeModal");
    modal.classList.remove("hidden");
    modal.dataset.locationId = locationId; // Store the location ID for later use

    // Dynamically populate day types in the modal
    const dayTypesContainer = document.getElementById("dayTypesContainer");
    dayTypesContainer.innerHTML = ""; // Clear previous content

    const dayTypes = ["day", "night", "saturday", "sunday", "public holiday"];
    dayTypes.forEach((dayType) => {
        const div = document.createElement("div");
        div.classList.add("mb-4");

        div.innerHTML = `
            <label for="${dayType}Rate" class="block text-sm font-medium mb-1">${
            dayType.charAt(0).toUpperCase() + dayType.slice(1)
        } Rate</label>
            <input type="number" id="${dayType}Rate" name="${dayType}_rate" class="form-input w-full border border-gray-300 rounded px-3 py-2">
        `;
        dayTypesContainer.appendChild(div);
    });
}

function closeAddShiftTypeModal() {
    const modal = document.getElementById("addShiftTypeModal");
    modal.classList.add("hidden");
}

// function addSelectionToOptions() {
//     const shiftTypes = shiftTypesChoices
//         .getValue(true)
//         .map((item) => item.label);
//     const locations = locationChoices.getValue(true).map((item) => item.label);
//     const dateRange = document.getElementById("dateRange").value;

//     try {
//         selectionManager.addSelection(shiftTypes, locations, dateRange);
//         showToast("Selection added successfully!", "success");
//         setSummary(); // Update the summary
//     } catch (error) {
//         showToast(error.message, "error");
//     }
// }

// function removeSelection(index) {
//     try {
//         selectionManager.removeSelection(index);
//         showToast("Selection removed successfully!", "success");
//         setSummary(); // Update the summary
//     } catch (error) {
//         showToast(error.message, "error");
//     }
// }

// function setSummary() {
//     const summary = document.getElementById("summarySection");

//     // Clear the summary content
//     summary.innerHTML = "";
//     // Get the selected options from the SelectionManager
//     const selectedOptions = selectionManager.getSelections();

//     // Iterate over selectedOptions and display each selection
//     selectedOptions.forEach((option, index) => {
//         summary.innerHTML += `
//             <div class="summary-content bg-gray-100 p-4 rounded-lg shadow-md mb-4">
//                 <p class="text-sm font-medium text-gray-700 mb-2">
//                     <strong>Selection ${index + 1}:</strong>
//                 </p>
//                 <p class="text-sm font-medium text-gray-700 mb-2">
//                     <strong>Shift Types:</strong> ${
//                         option.shiftTypes.join(", ") || "None selected"
//                     }
//                 </p>
//                 <p class="text-sm font-medium text-gray-700 mb-2">
//                     <strong>Location:</strong> ${
//                         option.locations.join(", ") || "Not selected"
//                     }
//                 </p>
//                 <p class="text-sm font-medium text-gray-700">
//                     <strong>Date Range:</strong> ${
//                         option.dateRange || "Not selected"
//                     }
//                 </p>
//                                 <button
//                     class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 focus:ring-2 focus:ring-red-400 mt-2"
//                     onclick="removeSelection(${index})">
//                     Remove
//                 </button>
//             </div>
//         `;
//     });
// }
function initializeCustomDropdown(locationId, selectElement) {
    const options = Array.from(selectElement.options);

    // Create a custom dropdown
    const dropdownWrapper = document.createElement("div");
    dropdownWrapper.className = "relative";

    const dropdownButton = document.createElement("button");
    dropdownButton.type = "button";
    dropdownButton.className =
        "bg-white text-gray-700 px-4 py-2 rounded w-full text-left flex justify-between items-center border border-gray-300 shadow-sm hover:bg-gray-100";
    dropdownButton.innerHTML = `<span>Select Shift Types</span><i class="fas fa-chevron-down"></i>`;

    const dropdownMenu = document.createElement("div");
    dropdownMenu.className =
        "absolute bg-white border rounded shadow-lg hidden w-full z-10 flex flex-wrap gap-4 p-2";

    // Populate the dropdown menu with checkboxes
    options.forEach((option) => {
        const label = document.createElement("label");
        label.className =
            "flex items-center gap-2 bg-gray-100 px-3 py-2 rounded hover:bg-gray-200 cursor-pointer shadow-sm";
        label.style.minWidth = "120px"; // Set a minimum width for each option

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = option.value;
        checkbox.className = "mr-2 shift-type-checkbox";
        checkbox.checked = option.selected;

        checkbox.addEventListener("change", () => {
            option.selected = checkbox.checked;

            // Update the button text
            const selectedOptions = options
                .filter((opt) => opt.selected)
                .map((opt) => opt.textContent);
            dropdownButton.querySelector("span").textContent =
                selectedOptions.length > 0
                    ? selectedOptions.join(", ")
                    : "Select Shift Types";
            // Trigger the change event on the select element
            const event = new Event("change");
            selectElement.dispatchEvent(event);
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(option.textContent));
        dropdownMenu.appendChild(label);
    });

    // Toggle dropdown visibility
    dropdownButton.addEventListener("click", () => {
        dropdownMenu.classList.toggle("hidden");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (
            !dropdownWrapper.contains(e.target) &&
            !dropdownMenu.classList.contains("hidden")
        ) {
            dropdownMenu.classList.add("hidden");
        }
    });

    // Replace the select element with the custom dropdown
    selectElement.style.display = "none";
    dropdownWrapper.appendChild(dropdownButton);
    dropdownWrapper.appendChild(dropdownMenu);
    selectElement.parentNode.insertBefore(
        dropdownWrapper,
        selectElement.nextSibling
    );
    // Add event listener to the select element to handle changes
    selectElement.addEventListener("change", () => {
        console.log(`Shift types updated for location ${locationId}`);
        initializeShiftTable(locationId); // Update the Shift Details section

        // Update the <p> tag beside the address
        const addressElement = document
            .querySelector(`#form_${locationId}`)
            .parentElement.querySelector("p");

        if (addressElement) {
            const selectedShiftTypes = Array.from(
                selectElement.selectedOptions
            ).map((option) => option.textContent);

            // Extract the existing date range from the <p> tag
            const currentText = addressElement.textContent;
            const dateRangeMatch = currentText.match(/Date Range: (.+)$/);
            const existingDateRange = dateRangeMatch
                ? dateRangeMatch[1]
                : "Not Set";

            // Update the <p> tag with the new shift types and preserve the date range
            addressElement.textContent = `${
                locations.find((loc) => loc.id === locationId).address
            } | Shift Types: ${selectedShiftTypes.join(
                ", "
            )} | Date Range: ${existingDateRange}`;
            // Update localStorage with the new shift types
            const savedData = localStorage.getItem(`location_${locationId}`);
            const locationData = savedData
                ? JSON.parse(savedData)
                : { shiftTypes: [], dateRange: existingDateRange };

            locationData.shiftTypes = selectedShiftTypes; // Update shift types
            localStorage.setItem(
                `location_${locationId}`,
                JSON.stringify(locationData)
            );
        }
    });
}

async function loadStep2Options() {
    try {
        // Fetch shift types and locations from the API
        const locations = await apiService.getLocations();
        console.log("Locations:", locations);
        console.log("shiftTyyuoes in loadStep2Options:", shiftTypes);

        // Iterate over each location to populate shift types
        locations.forEach((location) => {
            const shiftTypesSelect = document.getElementById(
                `shiftTypes_${location.id}`
            );
            const filterShiftTypeSelect = document.getElementById(
                `filterShiftType_${location.id}`
            );

            console.log("filterShiftTypeSelect:", filterShiftTypeSelect);

            filterShiftTypeSelect.innerHTML = `<option value="">All</option>`; // Clear and add "All" option

            console.log("Available shift types:", shiftTypes);

            Array.from(shiftTypes).forEach((option) => {
                // Add to filter dropdown
                const filterOpt = document.createElement("option");
                filterOpt.value = option.id;
                filterOpt.textContent = option.name;
                filterShiftTypeSelect.appendChild(filterOpt);
            });
            const dateRangeInput = document.getElementById(
                `dateRange_${location.id}`
            );
            console.log(dateRangeInput);
            // Add event listener for date range changes
            dateRangeInput.addEventListener("change", () => {
                console.log(`Date range updated for location ${location.id}`);

                // Update the <p> tag beside the address
                const addressElement = document
                    .querySelector(`#form_${location.id}`)
                    .parentElement.querySelector("p");

                if (addressElement) {
                    const selectedShiftTypes = Array.from(
                        shiftTypesSelect.selectedOptions
                    ).map((option) => option.textContent);

                    // Update the <p> tag with the new date range and preserve the shift types
                    addressElement.textContent = `${
                        locations.find((loc) => loc.id === location.id).address
                    } | Shift Types: ${selectedShiftTypes.join(
                        ", "
                    )} | Date Range: ${dateRangeInput.value}`;

                    // Update localStorage with the new date range
                    const savedData = localStorage.getItem(
                        `location_${location.id}`
                    );
                    const locationData = savedData
                        ? JSON.parse(savedData)
                        : { shiftTypes: selectedShiftTypes, dateRange: "" };

                    locationData.dateRange = dateRangeInput.value; // Update the date range
                    localStorage.setItem(
                        `location_${location.id}`,
                        JSON.stringify(locationData)
                    );
                }
            });

            // Clear existing options
            shiftTypesSelect.innerHTML = "";

            // Populate the select element with shift types
            shiftTypes.forEach((st) => {
                const opt = document.createElement("option");
                opt.value = st.id; // Use the shift type ID as the value
                opt.textContent = st.name; // Use the shift type name as the label
                shiftTypesSelect.appendChild(opt);
            });

            // Handle pre-selected options (if saved in localStorage)
            const savedData = localStorage.getItem(`location_${location.id}`);
            if (savedData) {
                const { shiftTypes: savedShiftTypes } = JSON.parse(savedData);

                // Pre-select saved shift types
                if (
                    Array.isArray(savedShiftTypes) &&
                    savedShiftTypes.length > 0
                ) {
                    Array.from(shiftTypesSelect.options).forEach((option) => {
                        if (savedShiftTypes.includes(option.textContent)) {
                            option.selected = true;
                        }
                    });
                }
            }

            // Initialize custom dropdown behavior (if needed)
            initializeCustomDropdown(location.id, shiftTypesSelect);
            // Initialize Flatpickr for the date range input
            flatpickr(dateRangeInput, {
                mode: "range",
                dateFormat: "y-m-d",
                allowInput: true,
                onClose: function (selectedDates, dateStr, instance) {
                    // Ensure at least two dates are selected
                    if (selectedDates.length === 2) {
                        const startDate = selectedDates[0];
                        const endDate = selectedDates[1];

                        // Calculate the difference in days
                        const diffInDays = Math.ceil(
                            (endDate - startDate) / (1000 * 60 * 60 * 24)
                        );

                        // Check if the range is less than 7 days
                        if (diffInDays < 7) {
                            showToast(
                                "The selected date range must be at least 7 days.",
                                "error"
                            );

                            // Clear the input field or reset the selection
                            instance.clear();
                        }
                    }
                },
                onChange: function (selectedDates, dateStr, instance) {
                    console.log("Selected Date Range:", dateStr);
                },
            });
        });
    } catch (error) {
        showToast(
            extractAxiosErrorMsg(error, "Failed to load options."),
            "error"
        );
    }
}

function getSelectedLocations() {
    const locationsArray = []; // Array to store location objects

    // Iterate over all locations
    locations.forEach((location) => {
        const shiftTypesSelect = document.getElementById(
            `shiftTypes_${location.id}`
        );
        const dateRangeInput = document.getElementById(
            `dateRange_${location.id}`
        );

        // Get selected shift types
        const selectedShiftTypes = Array.from(
            shiftTypesSelect.selectedOptions
        ).map((option) => option.textContent);

        // Get selected date range
        const selectedDateRange = dateRangeInput.value;

        // Add the location object to the array
        locationsArray.push({
            locationId: location.id,
            shiftTypes: selectedShiftTypes,
            dateRange: selectedDateRange,
        });
    });

    return locationsArray;
}

// Function to handle adding a shift type
async function addShiftType() {
    const modal = document.getElementById("addShiftTypeModal");
    const name = document.getElementById("shiftTypeName").value.trim();
    const description = document
        .getElementById("shiftTypeDescription")
        .value.trim();
    const dayRate = document.getElementById("dayRate").value.trim();
    const nightRate = document.getElementById("nightRate").value.trim();
    const saturdayRate = document.getElementById("saturdayRate").value.trim();
    const sundayRate = document.getElementById("sundayRate").value.trim();
    const publicHolidayRate = document
        .getElementById("publicHolidayRate")
        .value.trim();

    // Validate inputs
    if (
        !name ||
        !dayRate ||
        !nightRate ||
        !saturdayRate ||
        !sundayRate ||
        !publicHolidayRate
    ) {
        showToast("Please fill out all required fields.", "error");
        return;
    }

    try {
        // Step 1: Create the shift type
        const shiftTypeResponse = await apiService.createShiftType({
            name,
            description,
        });

        const shiftTypeId = shiftTypeResponse.data.id;

        // Step 2: Create rates for each day type
        const rates = [
            { day_type: "day", rate: dayRate },
            { day_type: "night", rate: nightRate },
            { day_type: "saturday", rate: saturdayRate },
            { day_type: "sunday", rate: sundayRate },
            { day_type: "public holiday", rate: publicHolidayRate },
        ];

        for (const rate of rates) {
            console.log(
                `Adding rate for ${rate.day_type}: ${rate.rate} ${rate}`
            );
            const dayTypeId = await getDayTypeId(rate.day_type); // Fetch day_type_id dynamically
            await apiService.createRate({
                shift_type_id: shiftTypeId,
                day_type_id: dayTypeId,
                rate: rate.rate,
            });
        }

        showToast("Shift Type and rates added successfully!", "success");
        closeAddShiftTypeModal();

        // Add the new shift type to all dropdowns dynamically
        Object.keys(window.choicesInstances).forEach((locationId) => {
            const shiftTypesSelect = document.getElementById(
                `shiftTypes_${locationId}`
            );
            const opt = document.createElement("option");
            opt.value = shiftTypeId;
            opt.textContent = name;
            shiftTypesSelect.appendChild(opt);

            // Update the Choices.js instance
            const choicesInstance = window.choicesInstances[locationId];
            if (choicesInstance) {
                choicesInstance.setChoices(
                    [
                        ...Array.from(shiftTypesSelect.options).map(
                            (option) => ({
                                value: option.value,
                                label: option.textContent,
                                selected: option.selected,
                                disabled: option.disabled,
                            })
                        ),
                    ],
                    "value",
                    "label",
                    false
                );
            }
        });
    } catch (error) {
        const errorMessage = extractAxiosErrorMsg(
            error,
            "Failed to add Shift Type and rates."
        );
        showToast(errorMessage, "error");
    }
}
// Helper function to fetch day_type_id dynamically
async function getDayTypeId(dayTypeName) {
    const dayTypes = await apiService.getDayTypes();
    const dayType = dayTypes.find(
        (dt) => dt.name.toLowerCase() === dayTypeName.toLowerCase()
    );
    return dayType ? dayType.id : null;
}

function validateStep2Form() {
    let isValid = true;

    // Iterate over all locations to validate their inputs
    locations.forEach((location) => {
        const shiftTypesSelect = document.getElementById(
            `shiftTypes_${location.id}`
        );
        const dateRangeInput = document.getElementById(
            `dateRange_${location.id}`
        );

        // Check if at least one shift type is selected
        if (!shiftTypesSelect.selectedOptions.length) {
            showToast(
                `Please select at least one shift type for location: ${location.name}`,
                "error"
            );
            isValid = false;
        }

        // Check if a valid date range is selected
        if (!dateRangeInput.value) {
            showToast(
                `Please select a valid date range for location: ${location.name}`,
                "error"
            );
            isValid = false;
        }
    });

    return isValid;
}

function initializeShiftTable(locationId) {
    const shiftTypesSelect = document.getElementById(
        `shiftTypes_${locationId}`
    );

    const selectedShiftTypes = Array.from(shiftTypesSelect.selectedOptions).map(
        (opt) => opt.textContent
    );
    console.log("Selected Shift Types:", selectedShiftTypes);

    const distinctDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    console.log("records before", records);

    // Get the existing records for the location
    const existingRecords = records[locationId] || [];

    // Filter out records for shift types that are no longer selected
    const updatedRecords = existingRecords.filter((rec) =>
        selectedShiftTypes.includes(rec.shiftType)
    );

    // Check which shift types already have at least one non-empty record
    const shiftTypesWithRecords = new Set();
    updatedRecords.forEach((rec) => {
        if (rec.from !== "" || rec.to !== "" || rec.employees !== 0) {
            shiftTypesWithRecords.add(rec.shiftType);
        }
    });

    console.log(
        "Shift types with existing records:",
        Array.from(shiftTypesWithRecords)
    );

    // Only add empty records for shift types that don't have any records yet
    distinctDays.forEach((day) => {
        selectedShiftTypes.forEach((shiftType) => {
            // Only add empty records if this shift type has no records at all
            const shiftTypeExists = updatedRecords.some(
                (rec) => rec.shiftType === shiftType
            );

            const exists = updatedRecords.some(
                (rec) => rec.day === day && rec.shiftType === shiftType
            );

            if (!exists && !shiftTypesWithRecords.has(shiftType)) {
                updatedRecords.push({
                    day,
                    shiftType,
                    from: "",
                    to: "",
                    employees: 0,
                });
            }
        });
    });

    // Update the records array for the location
    records[locationId] = updatedRecords;
    console.log("records after", records);

    renderTable(locationId);
}
function updateShift(locationId) {
    const shiftTypeID = document.getElementById(
        `batchShiftType_${locationId}`
    ).value;
    const shiftType = getShiftTypeTextById(locationId, shiftTypeID);
    const from = document.getElementById(`batchFrom_${locationId}`).value;
    const to = document.getElementById(`batchTo_${locationId}`).value;
    const employees =
        parseInt(
            document.getElementById(`batchEmployees_${locationId}`).value,
            10
        ) || 1;
    const selectedDays = Array.from(
        document.getElementById(`batchDays_${locationId}`).selectedOptions
    ).map((opt) => opt.value);

    // Validation
    if (!shiftType || !from || !to || selectedDays.length === 0) {
        showToast(
            "Please select shift type, times, and at least one day.",
            "error"
        );
        return;
    }

    if (employees < 1) {
        showToast("Number of employees must be at least 1.", "error");
        return;
    }

    let existingShifts = [];

    // Collect existing shifts for the selected days and shift type
    selectedDays.forEach((dayName) => {
        const matches = records[locationId].filter(
            (rec) => rec.day === dayName && rec.shiftType === shiftType
        );
        existingShifts = existingShifts.concat(matches);
    });

    if (existingShifts.length === 0) {
        // No existing shifts found, add new shifts
        selectedDays.forEach((dayName) => {
            records[locationId].push({
                day: dayName,
                shiftType,
                from,
                to,
                employees,
            });
        });
        showToast("New shifts added successfully!", "success");
        renderTable(locationId);
        return;
    }

    if (existingShifts.length === 1) {
        // Only one shift exists, update it directly
        existingShifts.forEach((rec) => {
            rec.from = from;
            rec.to = to;
            rec.employees = employees;
        });
        showToast("Shift updated successfully!", "success");
        renderTable(locationId);
        return;
    }

    // Multiple shifts exist, show modal for selection
    // Group shifts by `from` and `to` times
    const groupedShifts = existingShifts.reduce((acc, rec) => {
        const key = `${rec.from}-${rec.to}`;
        if (!acc[key]) {
            acc[key] = { ...rec, days: [rec.day] }; // Group by `from` and `to`
        } else {
            acc[key].days.push(rec.day); // Add the day to the existing group
        }
        return acc;
    }, {});

    let tableRows = Object.values(groupedShifts)
        .map(
            (rec, idx) => `
        <tr class="hover:bg-gray-100 ${
            idx % 2 === 0 ? "bg-white" : "bg-gray-50"
        }">
            <td class="px-2 py-1 border"><input type="checkbox" class="update-shift-checkbox" data-key="${
                rec.from
            }-${rec.to}" ></td>
            <td class="px-2 py-1 border">${rec.days.join(", ")}</td>
            <td class="px-2 py-1 border">${rec.shiftType}</td>
            <td class="px-2 py-1 border">${rec.from}</td>
            <td class="px-2 py-1 border">${rec.to}</td>
            <td class="px-2 py-1 border">${rec.employees}</td>
        </tr>
    `
        )
        .join("");

    let modalHtml = `
    <div class="mb-2 font-semibold">Select shifts to update:</div>
    <div style="max-height:260px;overflow:auto;">
    <table class="min-w-full border rounded shadow text-sm">
        <thead>
            <tr class="bg-gray-200 text-gray-700 font-bold">
                <th class="px-2 py-1 border"></th>
                <th class="px-2 py-1 border">Day</th>
                <th class="px-2 py-1 border">Shift Type</th>
                <th class="px-2 py-1 border">From</th>
                <th class="px-2 py-1 border">To</th>
                <th class="px-2 py-1 border"># Employees</th>
            </tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>
    </div>
`;

    showModal(
        modalHtml,
        function onConfirm(close, modalElement) {
            const checkboxes = modalElement.querySelectorAll(
                ".update-shift-checkbox"
            );
            checkboxes.forEach((cb) => {
                if (cb.checked) {
                    const key = cb.dataset.key;
                    console.log("Checkbox data-key:", cb.dataset.key);
                    const [fromTime, toTime] = key.split("-");
                    const group = groupedShifts[key];

                    // Update the `from` and `to` times for the selected days
                    group.days.forEach((day) => {
                        if (selectedDays.includes(day)) {
                            records[locationId].forEach((rec) => {
                                if (
                                    rec.day === day &&
                                    rec.shiftType === group.shiftType &&
                                    rec.from === fromTime &&
                                    rec.to === toTime
                                ) {
                                    rec.from = from;
                                    rec.to = to;
                                    rec.employees = employees;
                                }
                            });
                        }
                    });
                }
            });
            renderTable(locationId);
            showToast("Selected shifts updated!", "success");
            close();
        },
        true // Show confirm/cancel buttons
    );
}

function initializeSaveButtonds() {
    // Add event listeners to all Save buttons
    locations.forEach((location) => {
        const saveButton = document.getElementById(`saveBtn_${location.id}`);
        const shiftTypesSelect = document.getElementById(
            `shiftTypes_${location.id}`
        );
        const dateRangeInput = document.getElementById(
            `dateRange_${location.id}`
        );
        const addressElement = document
            .querySelector(`#form_${location.id}`)
            .parentElement.querySelector("p");
        console.log("Address Element:", addressElement);

        if (saveButton) {
            saveButton.addEventListener("click", function () {
                let isValid = true;

                // Validate shift types for the specific location
                if (!shiftTypesSelect.selectedOptions.length) {
                    showToast(
                        `Please select at least one shift type for location: ${location.name}`,
                        "error"
                    );
                    isValid = false;
                }

                // Validate date range for the specific location
                if (!dateRangeInput.value) {
                    showToast(
                        `Please select a valid date range for location: ${location.name}`,
                        "error"
                    );
                    isValid = false;
                }

                if (!isValid) {
                    return; // Stop execution if validation fails
                }
                // remove hidden class from the check icon
                const checkIcon = document.getElementById(
                    `checkIcon_${location.id}`
                );
                checkIcon.classList.remove("hidden");

                // Get selected shift types
                const selectedShiftTypes = Array.from(
                    shiftTypesSelect.selectedOptions
                ).map((option) => option.textContent);

                // Get selected date range
                const selectedDateRange = dateRangeInput.value;

                // Save to local storage
                const locationData = {
                    shiftTypes: selectedShiftTypes,
                    dateRange: selectedDateRange,
                };
                localStorage.setItem(
                    `location_${location.id}`,
                    JSON.stringify(locationData)
                );
                // Update the address line with selected shift types and date range
                addressElement.textContent = `${
                    location.address
                } | Shift Types: ${selectedShiftTypes.join(
                    ", "
                )} | Date Range: ${selectedDateRange}`;

                showToast(
                    `Saved information for location: ${location.name}`,
                    "success"
                );
                // Add logs between function calls to identify the error
                console.log("Calling showBatchForm...");
                showBatchForm(location.id);

                console.log("Calling populateBatchShiftTypes...");
                populateBatchShiftTypes(location.id);

                console.log("Calling initializeTimePickers...");
                initializeTimePickers(location.id);

                // console.log("Calling populateBatchDays...");
                // populateBatchDays(location.id);

                console.log("Calling initializeShiftTable...");
                initializeShiftTable(location.id);

                console.log("All functions executed successfully.");
            });
        }
    });
}

function saveBatchForm(locationId, previousFormData, clickedRow) {
    console.log("Saving batch form for location:", locationId);
    // Get modal field values
    const shiftTypeCell = clickedRow.querySelector("td:nth-child(2)");

    const dayCell = clickedRow.querySelector("td:nth-child(1)");

    const dateRangeCell = clickedRow.querySelector("td:nth-child(3)");

    const fromCell = clickedRow.querySelector("td:nth-child(4)");
    const toCell = clickedRow.querySelector("td:nth-child(5)");
    const employeesCell = clickedRow.querySelector("td:nth-child(6)");

    const selectedDays = Array.from(dayCell.querySelectorAll(".day-label"))
        .filter((dayLabel) => dayLabel.classList.contains("bg-[#337ab7]"))
        .map((dayLabel) => dayLabel.textContent.trim());

    const shiftTypeId = shiftTypeCell.querySelector(
        ".shift-type-dropdown"
    ).value;
    const shiftType = getShiftTypeTextById(locationId, shiftTypeId);
    const dateRange = dateRangeCell.querySelector(
        ".flatpickr-date-range"
    ).value;
    const from = fromCell.querySelector(".flatpickr-from").value;
    const to = toCell.querySelector(".flatpickr-to").value;
    const employees = employeesCell.querySelector(".employees-input").value;
    console.log(`Saving edits for location ${locationId}:`, {
        selectedDays,
        shiftType,
        from,
        to,
        employees,
    });

    // Validate inputs
    if (
        !selectedDays.length ||
        !shiftType ||
        !from ||
        !to ||
        employees <= 0 ||
        !dateRange
    ) {
        showToast("Please fill in all required fields.", "error");
        return;
    }
    // Check for duplicates before any operations
    const duplicateDays = [];
    selectedDays.forEach((day) => {
        const hasDuplicate = records[locationId].some(
            (rec) =>
                rec.day === day &&
                rec.from === from &&
                rec.to === to &&
                rec.shiftType === shiftType &&
                // Skip the record we're currently editing
                !(
                    previousFormData &&
                    previousFormData.dayArray.includes(day) &&
                    rec.shiftType === previousFormData.shiftType &&
                    rec.from === previousFormData.fromTime &&
                    rec.to === previousFormData.toTime
                )
        );

        if (hasDuplicate) {
            duplicateDays.push(day);
        }
    });

    if (duplicateDays.length > 0) {
        showToast(
            `Duplicate records found for days: ${duplicateDays.join(
                ", "
            )}. Cannot add records with the same day, from, and to times.`,
            "error"
        );
        return;
    }

    // STEP 1: Handle direct updates - if we're editing an existing record
    if (previousFormData && previousFormData.shiftType) {
        // Find the records matching the previous form data
        const recordsToUpdate = records[locationId].filter(
            (rec) =>
                rec.shiftType === previousFormData.shiftType &&
                rec.from === previousFormData.fromTime &&
                rec.to === previousFormData.toTime &&
                rec.employees === parseInt(previousFormData.employees, 10) &&
                previousFormData.dayArray.includes(rec.day)
        );

        // If we found records to update
        if (recordsToUpdate.length > 0) {
            console.log("Records to update:", recordsToUpdate);

            // Check for matching records BEFORE updating anything
            const matchingRecords = records[locationId].filter(
                (rec) =>
                    rec.shiftType === shiftType &&
                    rec.from === from &&
                    rec.to === to &&
                    rec.employees === employees &&
                    !selectedDays.includes(rec.day) &&
                    !recordsToUpdate.includes(rec)
            );

            if (matchingRecords.length > 0) {
                // Show modal asking if user wants to merge
                const daysText = matchingRecords.map((r) => r.day).join(", ");
                const modalHtml = `
                    <div>
                        <p>Found records with the same attributes but different days:</p>
                        <p><strong>Days:</strong> ${daysText}</p>
                        <p>Would you like to merge these records?</p>
                    </div>
                `;

                showModal(
                    modalHtml,
                    function onConfirm(close) {
                        // IF USER CONFIRMS, update and merge

                        // 1. Remove the records to update
                        records[locationId] = records[locationId].filter(
                            (rec) => !recordsToUpdate.includes(rec)
                        );

                        // 2. Remove matching records
                        records[locationId] = records[locationId].filter(
                            (rec) => !matchingRecords.includes(rec)
                        );

                        // 3. Add all merged days
                        const allDays = [
                            ...selectedDays,
                            ...matchingRecords.map((r) => r.day),
                        ];

                        allDays.forEach((day) => {
                            records[locationId].push({
                                day,
                                shiftType,
                                from,
                                to,
                                employees,
                            });
                        });

                        renderTable(locationId);
                        close();
                        showToast("Records merged successfully!", "success");
                        hideBatchFormModal(locationId);

                        localStorage.setItem(
                            `records_${locationId}`,
                            JSON.stringify(records[locationId])
                        );
                    },
                    function onCancel(close) {
                        // CANCEL SHOULD NOT MODIFY ANYTHING
                        if (typeof close === "function") {
                            close();
                        }
                        showToast("Operation cancelled", "info");
                        hideBatchFormModal(locationId);
                    }
                );
            } else {
                // No matching records, proceed with normal update
                records[locationId] = records[locationId].filter(
                    (rec) => !recordsToUpdate.includes(rec)
                );

                // Add new records with the updated values
                selectedDays.forEach((day) => {
                    records[locationId].push({
                        day,
                        shiftType,
                        from,
                        to,
                        employees,
                    });
                });

                showToast("Shift updated successfully!", "success");
                hideBatchFormModal(locationId);
                renderTable(locationId);
                localStorage.setItem(
                    `records_${locationId}`,
                    JSON.stringify(records[locationId])
                );
            }
            return; // Important: stop execution here
        }
    }

    // STEP 2: Handle adding new records (no previous data)

    // Check for matching records BEFORE adding anything
    const matchingRecords = records[locationId].filter(
        (rec) =>
            rec.shiftType === shiftType &&
            rec.from === from &&
            rec.to === to &&
            rec.employees === employees &&
            !selectedDays.includes(rec.day)
    );

    if (matchingRecords.length > 0) {
        // Show modal asking if user wants to merge
        const daysText = matchingRecords.map((r) => r.day).join(", ");
        const modalHtml = `
            <div>
                <p>Found records with the same attributes but different days:</p>
                <p><strong>Days:</strong> ${daysText}</p>
                <p>Would you like to merge these records?</p>
            </div>
        `;

        showModal(
            modalHtml,
            function onConfirm(close) {
                // IF USER CONFIRMS, add and merge

                // 1. Remove matching records
                records[locationId] = records[locationId].filter(
                    (rec) => !matchingRecords.includes(rec)
                );

                // 2. Add all merged days
                const allDays = [
                    ...selectedDays,
                    ...matchingRecords.map((r) => r.day),
                ];

                allDays.forEach((day) => {
                    records[locationId].push({
                        day,
                        shiftType,
                        from,
                        to,
                        employees,
                    });
                });

                renderTable(locationId);
                close();
                showToast("Records merged successfully!", "success");
                hideBatchFormModal(locationId);
                localStorage.setItem(
                    `records_${locationId}`,
                    JSON.stringify(records[locationId])
                );
            },
            function onCancel(close) {
                // CANCEL SHOULD NOT MODIFY ANYTHING
                if (typeof close === "function") {
                    close();
                }
                showToast("Operation cancelled", "info");
                hideBatchFormModal(locationId);
            }
        );
    } else {
        // No matching records, proceed with adding new records
        selectedDays.forEach((day) => {
            records[locationId].push({
                day,
                shiftType,
                from,
                to,
                employees,
            });
        });

        showToast("Shift added successfully!", "success");
        hideBatchFormModal(locationId);
        renderTable(locationId);
        localStorage.setItem(
            `records_${locationId}`,
            JSON.stringify(records[locationId])
        );
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    // Load step 2 options and then populate saved data
    await loadShiftTypes();
    loadStep2Options().then(() => {
        locations.forEach((location) => {
            const shiftTypesSelect = document.getElementById(
                `shiftTypes_${location.id}`
            );
            const dateRangeInput = document.getElementById(
                `dateRange_${location.id}`
            );
            const addressElement = document
                .querySelector(`#form_${location.id}`)
                .parentElement.querySelector("p");

            // Retrieve saved data for the location from local storage
            const savedData = localStorage.getItem(`location_${location.id}`);

            if (savedData) {
                const { shiftTypes, dateRange } = JSON.parse(savedData);
                console.log("Saved Data for Location:", {
                    shiftTypes,
                    dateRange,
                });

                // Populate shift types
                if (Array.isArray(shiftTypes) && shiftTypes.length > 0) {
                    // Iterate over the options in the select element
                    Array.from(shiftTypesSelect.options).forEach((option) => {
                        // Check if the option's text matches any of the saved shift types
                        if (shiftTypes.includes(option.textContent)) {
                            option.selected = true; // Mark the option as selected
                        }
                    });

                    // Update the dropdown button text to reflect the selected options
                    const selectedOptions = Array.from(
                        shiftTypesSelect.selectedOptions
                    ).map((option) => option.textContent);
                    const dropdownButton =
                        shiftTypesSelect.parentElement.querySelector(
                            "button span"
                        );
                    if (dropdownButton) {
                        dropdownButton.textContent =
                            selectedOptions.length > 0
                                ? selectedOptions.join(", ")
                                : "Select Shift Types";
                    }
                }
                console.log("Shift Types Select Element:", shiftTypesSelect);

                // Populate date range
                if (dateRange) {
                    dateRangeInput.value = dateRange;
                }

                // Update the address line with the saved data
                addressElement.textContent = `${
                    location.address
                } | Shift Types: ${shiftTypes.join(
                    ", "
                )} | Date Range: ${dateRange}`;

                // remove hidden class from the check icon
                const checkIcon = document.getElementById(
                    `checkIcon_${location.id}`
                );
                checkIcon.classList.remove("hidden");

                // Add logs between function calls to identify the error
                console.log("Calling showBatchForm...");
                showBatchForm(location.id);

                console.log("Calling populateBatchShiftTypes...");
                populateBatchShiftTypes(location.id);

                console.log("Calling initializeTimePickers...");
                initializeTimePickers(location.id);

                // console.log("Calling populateBatchDays...");
                // populateBatchDays(location.id);

                console.log("Calling initializeShiftTable...");
                initializeShiftTable(location.id);

                console.log("All functions executed successfully.");
                initializeSaveButtons();
            }
        });

        // Call the function to initialize Save buttons
        initializeSaveButtons();
    });

    // Other initialization logic (e.g., toggle form visibility)
    window.toggleForm = async function (locationId) {
        const form = document.getElementById(`form_${locationId}`);
        const arrow = document.getElementById(`arrow_${locationId}`);
        renderTable(locationId); // Ensure the table is rendered before toggling

        // Only try to collapse if currently open
        if (!form.classList.contains("max-h-0")) {
            // Try to save before collapsing
            let saveSucceeded = await handleSaveButtonClick(locationId, true); // pass a flag for silent mode
            if (!saveSucceeded) {
                // If save failed, do not collapse
                return;
            }
        }

        // Update the arrow icon
        if (form.classList.contains("max-h-0")) {
            form.classList.remove("max-h-0");
            // form.classList.add("mt-4");

            form.classList.add("max-h-[1000px]");

            arrow.innerHTML = '<i class="fas fa-chevron-up"></i>'; // Down arrow
            form.classList.add("p-2");
        } else {
            // form.classList.remove("mt-4");

            form.classList.add("max-h-0");
            form.classList.remove("max-h-[1000px]");

            arrow.innerHTML = '<i class="fas fa-chevron-down"></i>'; // Up arrow
            form.classList.remove("p-2");
        }
    };
    // Add to DOMContentLoaded event handler
    locations.forEach((location) => {
        // Load records from localStorage if available
        const savedRecords = localStorage.getItem(`records_${location.id}`);
        if (savedRecords) {
            records[location.id] = JSON.parse(savedRecords);
            renderTable(location.id);
        }
    });

    // window.openAddShiftTypeModal = function (locationId) {
    //     const modal = document.getElementById("addShiftTypeModal");
    //     modal.classList.remove("hidden");
    //     modal.dataset.locationId = locationId; // Store the location ID for later use
    // };

    // Load saved selections from localStorage
    const savedSelections = localStorage.getItem("selectedOptions");
    if (savedSelections) {
        selectedOptions = JSON.parse(savedSelections);
        setSummary(); // Update the summary with the loaded selections
    }

    // loadStep2Options().then(() => {
    //     // Pre-select values from session (window variables set in Blade)
    //     if (window.selectedShiftTypes && shiftTypesChoices) {
    //         shiftTypesChoices.setChoiceByValue(window.selectedShiftTypes);
    //     }
    //     if (window.selectedLocationId && locationChoices) {
    //         locationChoices.setChoiceByValue(window.selectedLocationId);
    //     }
    //     if (window.selectedDateRange) {
    //         document.getElementById("dateRange").value =
    //             window.selectedDateRange;
    //     }
    // });
    // flatpickr("#dateRange", {
    //     mode: "range",
    //     dateFormat: "Y-m-d",
    //     allowInput: true,
    // });

    // // Add event listener for the "Add" button
    // const addSelectionBtn = document.getElementById("addSelectionBtn");
    // if (addSelectionBtn) {
    //     addSelectionBtn.addEventListener("click", function () {
    //         addSelectionToOptions(); // Call the function to add the selection
    //         setSummary(); // Update the summary section
    //     });
    // }

    locations.forEach((location) => {
        const addShiftBtn = document.getElementById(
            `addShiftBtn_${location.id}`
        );
        if (addShiftBtn) {
            addShiftBtn.addEventListener("click", function () {
                addShift(location.id);
            });
        }

        const updateShiftBtn = document.getElementById(
            `updateShiftBtn_${location.id}`
        );
        if (updateShiftBtn) {
            updateShiftBtn.addEventListener("click", function () {
                updateShift(location.id);
            });
        }
    });

    // Add event listeners to all "Add Shift Type" buttons
    const addShiftTypeButtons = document.querySelectorAll(
        ".add-shift-type-btn"
    );
    addShiftTypeButtons.forEach((button) => {
        button.addEventListener("click", function () {
            const locationId = button.getAttribute("data-location-id");
            addDefaultShiftRow(locationId);
        });
    });

    // Attach event listener to the Cancel button
    const cancelButton = document.querySelector(
        "#addShiftTypeModal .bg-gray-500"
    );
    if (cancelButton) {
        cancelButton.addEventListener("click", function () {
            closeAddShiftTypeModal();
        });
    }

    locations.forEach((location) => {
        const filterDayDropdown = document.getElementById(
            `filterDay_${location.id}`
        );
        const filterShiftTypeDropdown = document.getElementById(
            `filterShiftType_${location.id}`
        );

        if (filterDayDropdown) {
            filterDayDropdown.addEventListener("change", function (e) {
                filterDayValue = e.target.value;
                console.log(
                    `Filter Day Value for Location ${location.id}:`,
                    filterDayValue
                );
                renderTable(location.id); // Pass the location ID to render the correct table
            });
        }

        if (filterShiftTypeDropdown) {
            filterShiftTypeDropdown.addEventListener("change", function (e) {
                console.log("Filter Shift Type Dropdown Changed", e.target);
                const shiftName = getShiftTypeTextById(
                    location.id,
                    e.target.value
                );
                console.log("Shift Name:", shiftName);
                filterShiftTypeValue = shiftName;
                console.log(
                    `Filter Shift Type Value for Location ${location.id}:`,
                    filterShiftTypeValue
                );
                renderTable(location.id); // Pass the location ID to render the correct table
            });
        }
    });
    const closeBtn = document.getElementById("closePreviewModal");
    if (closeBtn) {
        closeBtn.addEventListener("click", function () {
            document.getElementById("previewModal").classList.add("hidden");
        });
    }
    // Add Event Listeners for Modal Actions
    locations.forEach((location) => {
        const locationId = location.id;

        // Close Button
        const closeBtn = document.getElementById(
            `closeBatchFormModal_${locationId}`
        );
        if (closeBtn) {
            closeBtn.addEventListener("click", () =>
                hideBatchFormModal(locationId)
            );
        }

        // Cancel Button
        const cancelBtn = document.getElementById(
            `cancelBatchFormBtn_${locationId}`
        );
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () =>
                hideBatchFormModal(locationId)
            );
        }

        // Save Button (for now, just hide the modal)
        const saveBtn = document.getElementById(
            `saveBatchFormBtn_${locationId}`
        );
        if (saveBtn) {
            saveBtn.addEventListener("click", () => {
                // Pass the previous data to saveBatchForm
                console.log("Previous Form Data:", previousFormData);
                saveBatchForm(location.id, previousFormData);
            });
        }
    });

    // Attach event listener to the Add button
    const addButton = document.querySelector("#addShiftTypeModal .bg-blue-600");
    if (addButton) {
        addButton.addEventListener("click", function () {
            addShiftType();
        });
    }

    const step2Form = document.getElementById("step2Form");
    step2Form.addEventListener("submit", function (e) {
        if (!validateStep2Form()) {
            e.preventDefault();
            return;
        }

        // Get the array of location objects
        const selectedLocations = getSelectedLocations();

        // Update the hidden input field with the selectedLocations array as JSON
        const selectedLocationsInput = document.getElementById(
            "selectedLocationsInput"
        );
        selectedLocationsInput.value = JSON.stringify(selectedLocations);

        showToast("Step 2 validated! Proceeding to next step...", "success");
    });

    // Back button logic
    const backBtn = document.getElementById("backBtn");
    if (backBtn) {
        backBtn.addEventListener("click", function (e) {
            e.preventDefault();
            window.location.href = "/dataentry";
        });
    }
});
