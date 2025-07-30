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

locations.forEach((location) => {
    records[location.id] = []; // Initialize an empty array for each location
});
// Filtering state
let filterDayValue = "";
let filterShiftTypeValue = "";

// const selectionManager = new SelectionManager();

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

function renderTable(locationId) {
    // Remove duplicates from the records array
    const uniqueRecords = [];
    const seen = new Set();

    records[locationId].forEach((rec) => {
        const recordKey = `${rec.day}-${rec.shiftType}-${rec.from}-${rec.to}`;
        if (!seen.has(recordKey)) {
            seen.add(recordKey);
            uniqueRecords.push(rec);
        }
    });

    // Update the records array with unique records
    records[locationId] = uniqueRecords;
    const tbody = document.querySelector(`#shiftTable_${locationId} tbody`);
    tbody.innerHTML = "";

    const filteredRecords = getFilteredRecords(locationId);
    console.log(
        `Filtered records for location ${locationId}:`,
        filteredRecords
    );
    // Group records by shift type
    const groupedRecords = filteredRecords.reduce((acc, rec) => {
        const key = `${rec.shiftType}-${rec.from}-${rec.to}-${rec.employees}`;
        if (!acc[key]) {
            acc[key] = { ...rec, days: [rec.day] }; // Initialize with the first day
        } else {
            acc[key].days.push(rec.day); // Add the day to the existing group
        }
        return acc;
    }, {});

    Object.values(groupedRecords).forEach((rec, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="border px-2 py-1">${rec.days.join(", ")}</td>
            <td class="border px-2 py-1">${rec.shiftType}</td>
            <td class="border px-2 py-1">${rec.from}</td>
            <td class="border px-2 py-1">${rec.to}</td>
            <td class="border px-2 py-1">${rec.employees}</td>
            <td class="border px-2 py-1 text-center">
             <!-- Add Button -->
                <button type="button" class="text-green-600 add-row-btn" title="Add Row">
                    <i class="fas fa-plus"></i>
                </button>

                <!-- Update Button -->
                <button type="button" class="text-blue-600 update-row-btn" title="Update Row">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="text-red-600 remove-record-btn" data-key="${
                    rec.shiftType
                }-${rec.from}-${rec.to}">
                    <i class="fas fa-trash"></i>
                </button>
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
            updateRow(locationId, clickedRow);
        });
    });

    // Add event listeners for delete buttons
    tbody.querySelectorAll(".remove-record-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const key = btn.dataset.key;
            const [shiftType, from, to] = key.split("-");
            records[locationId] = records[locationId].filter(
                (rec) =>
                    !(
                        rec.shiftType === shiftType &&
                        rec.from === from &&
                        rec.to === to
                    )
            );
            renderTable(locationId); // Re-render the table
        });
    });
}
function addRow(locationId, clickedRow) {
    // Get the values from the clicked row
    const from = clickedRow.querySelector("td:nth-child(3)").textContent.trim();
    const to = clickedRow.querySelector("td:nth-child(4)").textContent.trim();
    const employees = clickedRow
        .querySelector("td:nth-child(5)")
        .textContent.trim();

    // Validate that the required fields are filled
    if (!from || !to || !employees || parseInt(employees, 10) <= 0) {
        showToast(
            "Please fill in the 'From', 'To', and '# Employees' fields by updating the row first.",
            "error"
        );
        return; // Stop execution if validation fails
    }

    const distinctDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Get the shift type from the clicked row
    const shiftType = clickedRow
        .querySelector("td:nth-child(2)")
        .textContent.trim();

    // Add a record for each day to the records array
    distinctDays.forEach((day) => {
        records[locationId].push({
            day: day, // Add each day as a separate record
            shiftType: shiftType, // Same shift type as the clicked row
            from: "", // Empty from time
            to: "", // Empty to time
            employees: 0, // Default employees to 0
        });
    });

    // Re-render the table to include the new row
    renderTable(locationId);
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
    // Split the day string into an array of individual days
    const dayArray = day.split(",").map((d) => d.trim());

    if (daysField.choicesInstance) {
        daysField.choicesInstance.removeActiveItems(); // Clear existing selections
        dayArray.forEach((d) => {
            daysField.choicesInstance.setChoiceByValue(d); // Set each day value
        });
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
function populateBatchDays(locationId) {
    const daysSelect = document.getElementById(`batchDays_${locationId}`);
    const weekdaysBtn = document.getElementById("weekdaysBtn");
    const weekendsBtn = document.getElementById("weekendsBtn");
    const allDaysBtn = document.getElementById("allDaysBtn");

    if (daysSelect) {
        // Check if Choices.js is already initialized on this element
        if (daysSelect.choicesInstance) {
            daysSelect.choicesInstance.destroy(); // Destroy the existing instance
            delete daysSelect.choicesInstance;
        }

        // Initialize Choices.js for the days field
        const choicesInstance = new Choices(daysSelect, {
            removeItemButton: true,
            placeholder: true,
            placeholderValue: "Select days",
            searchEnabled: false,
        });

        // Store the Choices.js instance on the element for future reference
        daysSelect.choicesInstance = choicesInstance;

        // Populate the days field with options
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
            choicesInstance.setChoices([
                {
                    value: day.value,
                    label: day.label,
                    selected: false,
                },
            ]);
        });

        // Add event listeners for the buttons
        weekdaysBtn.addEventListener("click", () => {
            selectDays(choicesInstance, ["Mon", "Tue", "Wed", "Thu", "Fri"]);
        });

        weekendsBtn.addEventListener("click", () => {
            selectDays(choicesInstance, ["Sat", "Sun"]);
        });

        allDaysBtn.addEventListener("click", () => {
            selectDays(choicesInstance, [
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
function selectDays(choicesInstance, days) {
    // Clear all previously selected options
    choicesInstance.removeActiveItems();

    // Programmatically select the corresponding days
    days.forEach((day) => {
        choicesInstance.setChoiceByValue(day);
    });

    // Trigger an update to reflect the changes in the UI
    choicesInstance._render();
}
function unselectAllChoices(choicesInstance) {
    // Unselect all pre-selected options in the Choices.js instance
    choicesInstance._currentState.items.forEach((item) => {
        if (item.selected) {
            item.selected = false; // Set the selected attribute to false
        }
    });

    // Trigger an update to reflect the changes in the UI
    choicesInstance._render();
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

    Array.from(shiftTypesSelect.selectedOptions).forEach((option) => {
        const opt = document.createElement("option");
        opt.value = option.value;
        opt.textContent = option.textContent;
        batchShiftTypeSelect.appendChild(opt);

        // Add to filter dropdown
        const filterOpt = document.createElement("option");
        filterOpt.value = option.value;
        filterOpt.textContent = option.textContent;
        filterShiftTypeSelect.appendChild(filterOpt);
    });
}
function getShiftTypeTextById(locationId, shiftTypeId) {
    const shiftTypesSelect = document.getElementById(
        `shiftTypes_${locationId}`
    );
    if (!shiftTypesSelect) {
        console.error(
            `Shift types select element not found for location: ${locationId}`
        );
        return null;
    }

    // Find the option with the matching value (ID)
    const option = Array.from(shiftTypesSelect.options).find(
        (opt) => opt.value === shiftTypeId
    );

    // Return the text content if found, otherwise return null
    return option ? option.textContent : null;
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

async function loadStep2Options() {
    try {
        const [shiftTypes, locations] = await Promise.all([
            apiService.getShiftTypes(),
            apiService.getLocations(),
        ]);
        // Populate shift types for each location
        locations.forEach((location) => {
            const shiftTypesSelect = document.getElementById(
                `shiftTypes_${location.id}`
            );
            shiftTypes.forEach((st) => {
                const opt = document.createElement("option");
                opt.value = st.id;
                opt.textContent = st.name;
                shiftTypesSelect.appendChild(opt);
            });

            // Store the Choices.js instance in a global object
            if (!window.choicesInstances) {
                window.choicesInstances = {};
            }
            console.log("the shiftypes select element", shiftTypesSelect);
            window.choicesInstances[location.id] = new Choices(
                shiftTypesSelect,
                {
                    removeItemButton: true,
                    placeholder: true,
                    placeholderValue: "Select shift types",
                    searchPlaceholderValue: "Type to search...",
                    noResultsText: "No shift types found",
                    noChoicesText: "No shift types available",
                    itemSelectText: "",
                    shouldSort: false,
                    addItems: true, // Allow adding items dynamically
                    duplicateItemsAllowed: false, // Prevent duplicate items
                }
            );

            // Initialize Flatpickr for the date range input
            const dateRangeInput = document.getElementById(
                `dateRange_${location.id}`
            );
            flatpickr(dateRangeInput, {
                mode: "range", // Enable date range selection
                dateFormat: "Y-m-d", // Include time in the format
            });
        });
        // // Populate locations
        // const locationSelect = document.getElementById("location");
        // locations.forEach((loc) => {
        //     const opt = document.createElement("option");
        //     opt.value = loc.id;
        //     opt.textContent = loc.name;
        //     locationSelect.appendChild(opt);
        // });
        // locationChoices = new Choices(locationSelect, {
        //     searchPlaceholderValue: "Type to search...",
        //     removeItemButton: true,
        //     searchEnabled: true,
        //     itemSelectText: "",
        //     shouldSort: false,
        //     placeholder: true,
        //     placeholderValue: "Select Location",
        //     noResultsText: "No locations found",
        //     noChoicesText: "No locations available",
        // });
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

    // Add new records for shift types that are newly selected
    distinctDays.forEach((day) => {
        selectedShiftTypes.forEach((shiftType) => {
            const exists = updatedRecords.some(
                (rec) => rec.day === day && rec.shiftType === shiftType
            );
            if (!exists) {
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

function initializeSaveButtons() {
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
function saveBatchForm(locationId, previousFormData) {
    // Get modal field values
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
        ) || 0;
    const selectedDays = Array.from(
        document.getElementById(`batchDays_${locationId}`).selectedOptions
    ).map((opt) => opt.value);
    console.log("Selected data:", {
        locationId,
        shiftType,
        from,
        to,
        employees,
        selectedDays,
    });

    // Validation
    if (!shiftType || !from || !to || selectedDays.length === 0) {
        showToast("Please fill in all required fields.", "error");
        return;
    }

    if (employees < 1) {
        showToast("Number of employees must be at least 1.", "error");
        return;
    }

    // console.log("Records before checking for duplicates:", records[locationId]);

    console.log("records before deleting", records[locationId]);

    records[locationId] = records[locationId].filter(
        (rec) =>
            // Keep records that do not match the selected shift type with empty fields

            !(
                (
                    rec.shiftType === shiftType &&
                    (rec.from === from || rec.from === "") &&
                    (rec.to === to || rec.to === "") &&
                    (rec.employees === employees || rec.employees === 0)
                )
                // (rec.employees === employees || rec.employees === 0)
                // (rec.employees === employees || rec.employees === 0) &&

                // !selectedDays.includes(rec.day)
            ) // Keep records with non-empty fields
    );
    console.log("Filtered records for location:", records[locationId]);
    const duplicateIndex = records[locationId].findIndex(
        (rec) =>
            selectedDays.includes(rec.day) &&
            rec.shiftType === shiftType &&
            rec.from === from &&
            rec.to === to &&
            rec.employees === employees
    );

    if (duplicateIndex !== -1) {
        const duplicate = records[locationId][duplicateIndex];
        console.error(
            "Duplicate record found at index:",
            duplicateIndex,
            duplicate
        );
        showToast(
            `A record with the same day, shift type, and time already exists.`,
            "error"
        );
        return; // Stop execution if a duplicate is found
    }

    // Add records for new days in selectedDays that are not in previousFormData.dayArray
    selectedDays.forEach((day) => {
        if (!previousFormData.dayArray.includes(day)) {
            records[locationId].push({
                day,
                shiftType,
                from,
                to,
                employees,
            });
            console.log(`Added new record for day ${day}:`, {
                day,
                shiftType,
                from,
                to,
                employees,
            });
        }
    });

    let recordFound = false;

    previousFormData.dayArray.forEach((day) => {
        const record = records[locationId].find(
            (rec) =>
                rec.day === day &&
                rec.shiftType === previousFormData.shiftType &&
                rec.from === previousFormData.fromTime &&
                rec.to === previousFormData.toTime &&
                rec.employees === parseInt(previousFormData.employees, 10)
        );

        if (record) {
            if (
                record.shiftType === shiftType &&
                record.day === day &&
                record.from === from &&
                record.to === to &&
                record.employees === employees
            ) {
                console.log(`Skipping record for day ${day}:`, record);
                return; // Skip updating this record
            }
            // Update the record's attributes
            record.from = from;
            record.to = to;
            record.employees = employees;
            console.log(`Updated record for day ${day}:`, record);
            recordFound = true;
        }
    });

    if (!recordFound) {
        // Add new records if no matching record exists
        selectedDays.forEach((day) => {
            records[locationId].push({
                day,
                shiftType,
                from,
                to,
                employees,
            });
            console.log(`Added new record for day ${day}:`, {
                day,
                shiftType,
                from,
                to,
                employees,
            });
        });
    }

    showToast("Shift saved successfully!", "success");

    // Close the modal
    hideBatchFormModal(locationId);

    // Re-render the table
    renderTable(locationId);
}

document.addEventListener("DOMContentLoaded", function () {
    // Load step 2 options and then populate saved data
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
                    // Set the `selected` attribute for matching options
                    Array.from(shiftTypesSelect.options).forEach((option) => {
                        if (shiftTypes.includes(option.textContent)) {
                            console.log(
                                "Selecting option:",
                                option.textContent
                            );

                            option.selected = true;
                        }
                    });
                    // mape the shiftTypes to their values and not their text content using the opton in the select element

                    const shiftTypesValues = Array.from(
                        shiftTypesSelect.selectedOptions
                    ).map((option) => option.value);

                    // Use setChoiceByValue to select the saved shift types
                    const choicesInstance =
                        window.choicesInstances[location.id];
                    if (choicesInstance) {
                        choicesInstance.setChoiceByValue(shiftTypesValues);
                    }
                }

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
            }
        });

        // Call the function to initialize Save buttons
        initializeSaveButtons();
    });

    // Other initialization logic (e.g., toggle form visibility)
    window.toggleForm = function (locationId) {
        const form = document.getElementById(`form_${locationId}`);
        const arrow = document.getElementById(`arrow_${locationId}`);

        // Toggle the hidden class
        form.classList.toggle("hidden");

        // Update the arrow icon
        if (form.classList.contains("hidden")) {
            arrow.innerHTML = '<i class="fas fa-chevron-down"></i>'; // Down arrow
        } else {
            arrow.innerHTML = '<i class="fas fa-chevron-up"></i>'; // Up arrow
        }
    };

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
            openAddShiftTypeModal(locationId);
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
