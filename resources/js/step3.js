import {
    showToast,
    showModal,
    getDaysInRange,
    getUniqueDayNamesInRange,
    populateBatchDaysSelect,
    timesOverlap,
    getSelectedDays,
    getDatesForDays,
    isInvalidTimeRange,
    hasTimeConflict,
    validateShiftSchedule,
    groupShiftRows,
    buildGroupedShiftTable,
} from "./helpers";

// Parse PHP variables passed from backend (these must be set in the Blade view)
const shiftTypes = window.shiftTypes || [];
const dateRange = window.dateRange || "";
console.log("Shift Types:", shiftTypes);
console.log("Date Range:", dateRange);

// Parse date range (format: "YYYY-MM-DD to YYYY-MM-DD")
let [startDate, endDate] = (dateRange || "").split(" to ");
const days = getDaysInRange(startDate, endDate);
console.log("Days in range:", days);

let selectedRowKeys = [];

// Get unique day names for UI display
const uniqueDayNames = getUniqueDayNamesInRange(days);
console.log("Unique day names:", uniqueDayNames);

// Map for shiftType id to name
const shiftTypeMap = {};
shiftTypes.forEach((st) => {
    shiftTypeMap[st.id] = st.name;
});
console.log("Shift Type Map:", shiftTypeMap);

// Build default records - keep full date records for backend
let records = [];
// UI display records - grouped by day name
let displayRecords = [];
console.log("Initial records:", window.shiftSchedule);
console.log("Default records created:", records);

if (
    window.shiftSchedule &&
    Array.isArray(window.shiftSchedule) &&
    window.shiftSchedule.length > 0
) {
    // Pre-populate from session data
    records = window.shiftSchedule.map((rec) => {
        const date = rec.day; // use rec.date from backend
        const day = rec.date; // use rec.day from backend
        return {
            date,
            day,
            shiftType: rec.shiftType,
            from: rec.from || "",
            to: rec.to || "",
            employees: rec.employees || 1,
            isNew: rec.isNew === 1 || rec.isNew === "1" ? true : false, // <-- Add this lin
        };
    });
    console.log("Records loaded from session:", records);

    console.log("Display records built from session data:", displayRecords);
} else {
    // Create records for all dates
    days.forEach((date) => {
        const day = new Date(date).toLocaleDateString("en-US", {
            weekday: "long",
        });
        shiftTypes.forEach((st) => {
            records.push({
                date,
                day,
                shiftType: st.id,
                from: "",
                to: "",
                employees: 1,
            });
        });
    });
    console.log("Records created for all dates:", records);
    // Remove displayRecords logic here
}

// Filtering state
let filterDayValue = "";
let filterShiftTypeValue = "";

// Remove buildDisplayRecords and all displayRecords logic

// Helper function to get dates for a specific day name
function getDatesForDayName(dayName) {
    return days.filter((dateStr) => {
        const date = new Date(dateStr);
        const dateDayName = date.toLocaleDateString("en-US", {
            weekday: "long",
        });

        return dateDayName === dayName;
    });
}

// Group and filter records for table display
function getGroupedRecords() {
    // Group by day, shiftType, from, to
    const grouped = {};
    records.forEach((rec) => {
        const key = `${rec.day}|${rec.shiftType}|${rec.from}|${rec.to}`;
        if (!grouped[key]) {
            grouped[key] = {
                dayName: rec.day,
                shiftType: rec.shiftType,
                from: rec.from,
                to: rec.to,
                employees: rec.employees,
                count: 1,
            };
        } else {
            grouped[key].count += 1;
        }
    });

    // uniqueDayNames.forEach((dayName) => {
    //     shiftTypes.forEach((st) => {
    //         const hasEmpty = records.some(
    //             (r) =>
    //                 r.day === dayName &&
    //                 r.shiftType == st.id &&
    //                 (!r.from || !r.to)
    //         );
    //         if (!hasEmpty) {
    //             const key = `${dayName}|${st.id}| | `;
    //             if (!grouped[key]) {
    //                 grouped[key] = {
    //                     dayName,
    //                     shiftType: st.id,
    //                     from: "",
    //                     to: "",
    //                     employees: 1,
    //                     count: 0,
    //                 };
    //             }
    //         }
    //     });
    // });

    // Filter by UI filters
    return Object.values(grouped).filter(
        (rec) =>
            (!filterDayValue || rec.dayName === filterDayValue) &&
            (!filterShiftTypeValue || rec.shiftType == filterShiftTypeValue)
    );
}

// // Helper function to sync changes to records
// function syncRecordChange(dayName, shiftType, from, to, employees) {
//     const targetDates = getDatesForDayName(dayName);
//     targetDates.forEach((date) => {
//         // Find or create records for this date and shift type
//         const existingRecords = records.filter(
//             (r) => r.date === date && r.shiftType == shiftType
//         );
//         if (from && to) {
//             const existingShift = existingRecords.find(
//                 (r) => r.from === from && r.to === to
//             );
//             if (!existingShift) {
//                 const emptyRecord = existingRecords.find(
//                     (r) => !r.from || !r.to
//                 );
//                 if (emptyRecord) {
//                     emptyRecord.from = from;
//                     emptyRecord.to = to;
//                     emptyRecord.employees = employees;
//                 } else {
//                     records.push({
//                         date,
//                         day: dayName,
//                         shiftType,
//                         from,
//                         to,
//                         employees,
//                     });
//                 }
//             }
//         }
//     });
// }

function populateFilters() {
    const daySel = document.getElementById("filterDay");
    const shiftSel = document.getElementById("filterShiftType");

    // Define the desired order
    const dayOrder = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];

    // Sort uniqueDayNames according to dayOrder
    const sortedDayNames = [...uniqueDayNames].sort(
        (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
    );

    daySel.innerHTML =
        `<option value="">All</option>` +
        sortedDayNames
            .map((dayName) => `<option value="${dayName}">${dayName}</option>`)
            .join("");

    shiftSel.innerHTML =
        `<option value="">All</option>` +
        shiftTypes
            .map((st) => `<option value="${st.id}">${st.name}</option>`)
            .join("");
}

// function getFilteredRecords() {
//     return displayRecords.filter(
//         (rec) =>
//             (!filterDayValue || rec.dayName === filterDayValue) &&
//             (!filterShiftTypeValue || rec.shiftType == filterShiftTypeValue)
//     );
// }

document.getElementById("addShiftBtn").addEventListener("click", function () {
    const shiftType = document.getElementById("batchShiftType").value;
    const from = document.getElementById("batchFrom").value;
    const to = document.getElementById("batchTo").value;
    const employees =
        parseInt(document.getElementById("batchEmployees").value, 10) || 1;
    const selectedDays = Array.from(
        document.getElementById("batchDays").selectedOptions
    ).map((opt) => opt.value);

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

    let hasDuplicate = false;
    let updatedEmpty = false;

    selectedDays.forEach((dayName) => {
        const targetDates = getDatesForDayName(dayName);
        targetDates.forEach((date) => {
            // Check for duplicate (same date, shiftType, from, to)
            const duplicate = records.find(
                (r) =>
                    r.date === date &&
                    r.shiftType == shiftType &&
                    r.from === from &&
                    r.to === to
            );
            if (duplicate) {
                hasDuplicate = true;
                return;
            }

            // Update empty record if exists
            const emptyRecord = records.find(
                (r) =>
                    r.date === date &&
                    r.shiftType == shiftType &&
                    (!r.from || !r.to)
            );
            if (emptyRecord) {
                emptyRecord.from = from;
                emptyRecord.to = to;
                emptyRecord.employees = employees;
                updatedEmpty = true;
                return;
            }

            // Add new record
            records.push({
                date,
                day: dayName,
                shiftType,
                from,
                to,
                employees,
                isNew: true,
            });
        });
    });

    if (hasDuplicate) {
        showToast(
            "A shift with the same time already exists for one of the selected days and shift type. Please choose a different time.",
            "error"
        );
        return;
    }
    if (updatedEmpty) {
        showToast("Empty shifts updated successfully!", "success");
    } else {
        showToast("Shifts added successfully!", "success");
    }
    renderTable();
});

document
    .getElementById("updateShiftBtn")
    .addEventListener("click", function () {
        const shiftType = document.getElementById("batchShiftType").value;
        const from = document.getElementById("batchFrom").value;
        const to = document.getElementById("batchTo").value;
        const employees =
            parseInt(document.getElementById("batchEmployees").value, 10) || 1;
        const selectedDays = Array.from(
            document.getElementById("batchDays").selectedOptions
        ).map((opt) => opt.value);

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

        let updatedEmpty = false;
        let existingShifts = [];

        selectedDays.forEach((dayName) => {
            // Update empty records if exist
            const emptyRecords = records.filter(
                (r) =>
                    r.day === dayName &&
                    r.shiftType == shiftType &&
                    (!r.from || !r.to)
            );
            if (emptyRecords.length > 0) {
                emptyRecords.forEach((r) => {
                    r.from = from;
                    r.to = to;
                    r.employees = employees;
                });
                updatedEmpty = true;
            }

            // Collect existing (non-empty) shifts for modal
            const existing = records.filter(
                (r) =>
                    r.day === dayName &&
                    r.shiftType == shiftType &&
                    r.from &&
                    r.to
            );
            existingShifts = existingShifts.concat(existing);
        });

        if (updatedEmpty) {
            showToast("Empty shifts updated successfully!", "success");
            renderTable();
        }

        // --- Handle no existing shifts case ---
        if (existingShifts.length === 0 && !updatedEmpty) {
            showToast(
                "No existing shifts found for the selected day(s) and shift type.",
                "info"
            );
            return;
        }
        // --- End handle ---

        if (existingShifts.length > 0) {
            // Group by day, shiftType, from, to
            const grouped = {};
            existingShifts.forEach((r) => {
                const key = `${r.day}|${r.shiftType}|${r.from}|${r.to}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        day: r.day,
                        shiftType: r.shiftType,
                        from: r.from,
                        to: r.to,
                        employees: r.employees,
                    };
                }
            });
            const groupedShifts = Object.values(grouped);
            // Show modal with table of existing shifts for selection
            let tableRows = groupedShifts
                .map(
                    (r, idx) => `
        <tr class="hover:bg-gray-100 ${
            idx % 2 === 0 ? "bg-white" : "bg-gray-50"
        }">
            <td class="px-2 py-1 border"><input type="checkbox" class="update-shift-checkbox" data-idx="${idx}" checked></td>
            <td class="px-2 py-1 border">${r.day}</td>
            <td class="px-2 py-1 border">${
                shiftTypeMap[r.shiftType] || r.shiftType
            }</td>
            <td class="px-2 py-1 border">${r.from}</td>
            <td class="px-2 py-1 border">${r.to}</td>
            <td class="px-2 py-1 border">${r.employees}</td>
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
                    console.log("Updating selected shifts...");
                    const checkboxes = modalElement.querySelectorAll(
                        ".update-shift-checkbox"
                    );
                    console.log("Checkboxes:", checkboxes);
                    checkboxes.forEach((cb, i) => {
                        if (cb.checked) {
                            const group = groupedShifts[i];
                            // Save original values to match
                            const origFrom = group.from;
                            const origTo = group.to;
                            const origEmployees = group.employees;
                            records.forEach((r) => {
                                if (
                                    r.day === group.day &&
                                    r.shiftType == group.shiftType &&
                                    r.from === origFrom &&
                                    r.to === origTo
                                ) {
                                    console.log("Updating record:", r);
                                    r.from = from;
                                    r.to = to;
                                    r.employees = employees;
                                }
                            });
                        }
                    });
                    console.log("Records after update:", records);
                    renderTable();
                    showToast("Selected shifts updated!", "success");
                    close();
                },
                true // show confirm/cancel
            );
        }
    });

// Helper functions for finding duplicates, empties, and showing modal
// ...implement as needed...

function renderTable() {
    const tbody = document.querySelector("#shiftTable tbody");
    tbody.innerHTML = "";

    const grouped = getGroupedRecords();

    grouped.forEach((rec, idx) => {
        // Check for conflicts and invalid times

        const isNew = records.some(
            (r) =>
                r.day === rec.dayName &&
                r.shiftType == rec.shiftType &&
                r.from === rec.from &&
                r.to === rec.to &&
                r.isNew === true
        );

        const tr = document.createElement("tr");
        tr.dataset.idx = idx;
        if (isNew) {
            tr.classList.add("bg-green-100"); // Light green
        }

        tr.innerHTML = `
            <td class="border px-2 py-1 w-29">${rec.dayName}</td>
            <td class="border px-2 py-1">${
                shiftTypeMap[rec.shiftType] || rec.shiftType
            }</td>
            <td class="border px-2 py-1 w-10">
                <input type="time" value="${rec.from}" 
                       class="border rounded px-1 w-full text-center " 
                       step="60" data-idx="${idx}" data-field="from" />
            </td>
            <td class="border px-2 py-1 w-10">
                <input type="time" value="${rec.to}" 
                       class="border rounded px-1 w-full text-center " 
                       data-idx="${idx}" data-field="to" />
            </td>
            <td class="border px-2 py-1 w-10">
                <input type="number" value="${rec.employees}" min="1" 
                       class="border rounded px-1 w-full text-center" 
                       data-idx="${idx}" data-field="employees" />
            </td>
            <td class="border px-2 py-1 text-center w-8">
                <div class="flex justify-center gap-2">
                   
                    <button type="button" class="text-red-600 remove-record-btn" 
                            data-idx="${idx}"><i data-idx="${idx}" class="fas fa-trash remove-record-btn"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    // console.log("Grouped records rendered:", grouped);
    //  <button type="button" class="text-blue-600 add-record-btn"
    //                             data-dayname="${rec.dayName}" data-shifttype="${
    //             rec.shiftType
    //         }"
    //                             data-idx="${idx}">Add</button>
    // console.log("Table rendered with records:", records);
    // Add event listeners for input changes
    tbody
        .querySelectorAll('input[type="time"], input[type="number"]')
        .forEach(function (input) {
            if (input.type === "time") {
                flatpickr(input, {
                    enableTime: true,
                    noCalendar: true,
                    dateFormat: "H:i",
                    time_24hr: true,
                    allowInput: true,
                });
            }

            input.addEventListener("input", function (e) {
                // Get the index and field from data attributes
                const idx = Number(e.target.dataset.idx);
                const field = e.target.dataset.field;
                const grouped = getGroupedRecords();
                const rec = grouped[idx];

                // Prepare new values
                let newFrom = field === "from" ? e.target.value : rec.from;
                let newTo = field === "to" ? e.target.value : rec.to;
                let newEmployees =
                    field === "employees"
                        ? Number(e.target.value)
                        : rec.employees;

                // If both from and to are filled, check for duplicate
                if (newFrom && newTo) {
                    const duplicate = records.find(
                        (r) =>
                            r.day === rec.dayName &&
                            r.shiftType == rec.shiftType &&
                            r.from === newFrom &&
                            r.to === newTo
                    );
                    // If a duplicate exists (not the current editing row), prevent
                    if (
                        duplicate &&
                        !(rec.from === newFrom && rec.to === newTo)
                    ) {
                        showToast(
                            "A shift with the same 'From' and 'To' time already exists for this day and shift type.",
                            "error"
                        );
                        renderTable();
                        return;
                    }
                }

                // Try to find the actual record in records that matches this grouped row
                let updated = false;
                records.forEach((r) => {
                    if (
                        r.day === rec.dayName &&
                        r.shiftType == rec.shiftType &&
                        r.from === rec.from &&
                        r.to === rec.to &&
                        r.employees === rec.employees
                    ) {
                        // Update the actual record
                        if (field === "employees") {
                            r.employees = Number(e.target.value);
                        } else if (field === "from") {
                            r.from = e.target.value;
                        } else if (field === "to") {
                            r.to = e.target.value;
                        }
                        updated = true;
                    }
                });

                // If not found (editing an empty row), add a new record
                if (
                    !updated &&
                    (field === "from" ||
                        field === "to" ||
                        field === "employees")
                ) {
                    records.push({
                        date: days.find((d) => {
                            const dayName = new Date(d).toLocaleDateString(
                                "en-US",
                                { weekday: "long" }
                            );
                            return dayName === rec.dayName;
                        }),
                        day: rec.dayName,
                        shiftType: rec.shiftType,
                        from: field === "from" ? e.target.value : "",
                        to: field === "to" ? e.target.value : "",
                        employees:
                            field === "employees" ? Number(e.target.value) : 1,
                    });
                }

                renderTable();
            });
        });
    console.log("Table rendered with grouped records:", grouped);
    console.log("Records after rendering:", records);
}

// Remove the last matching record from records
function removeRecord(idx) {
    const grouped = getGroupedRecords();
    const rec = grouped[idx];
    console.log("Removing record:", rec);
    // Remove all records in records array that match this group's info
    for (let i = records.length - 1; i >= 0; i--) {
        if (
            records[i].day === rec.dayName &&
            records[i].shiftType == rec.shiftType &&
            records[i].from === rec.from &&
            records[i].to === rec.to
        ) {
            records.splice(i, 1);
        }
    }
    renderTable();
}

document.addEventListener("DOMContentLoaded", function () {
    // Expose shiftTypes and dateRange from backend
    window.shiftTypes = shiftTypes;
    window.dateRange = dateRange;

    populateFilters();
    renderTable();

    const batchDaysSelect = document.getElementById("batchDays");
    const dayOrder = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];
    const sortedDays = [...days].sort((a, b) => {
        const dayA = new Date(a).toLocaleDateString("en-US", {
            weekday: "long",
        });
        const dayB = new Date(b).toLocaleDateString("en-US", {
            weekday: "long",
        });
        return dayOrder.indexOf(dayA) - dayOrder.indexOf(dayB);
    });
    populateBatchDaysSelect(sortedDays);
    const choicesDays = new Choices(batchDaysSelect, {
        removeItemButton: true,
        shouldSort: false,
        placeholder: true,
        placeholderValue: "Select days",
    });

    // Initialize batch time inputs
    document.querySelectorAll('input[type="time"]').forEach(function (input) {
        flatpickr(input, {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
        });
    });
    flatpickr("#batchFrom", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
    });
    flatpickr("#batchTo", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
    });

    document
        .getElementById("filterDay")
        .addEventListener("change", function (e) {
            filterDayValue = e.target.value;
            renderTable();
        });
    document
        .getElementById("filterShiftType")
        .addEventListener("change", function (e) {
            filterShiftTypeValue = e.target.value;
            renderTable();
        });
    document
        .getElementById("shiftTable")
        .addEventListener("click", function (e) {
            if (e.target.classList.contains("remove-record-btn")) {
                removeRecord(Number(e.target.dataset.idx));
            }
        });
    //     document
    //         .getElementById("batchDoneBtn")
    //         .addEventListener("click", function () {
    //             const shiftType = document.getElementById("batchShiftType").value;
    //             const from = document.getElementById("batchFrom").value;
    //             const to = document.getElementById("batchTo").value;
    //             const employees =
    //                 parseInt(document.getElementById("batchEmployees").value, 10) ||
    //                 1;
    //             const selectedDays = getSelectedDays();
    //             if (!shiftType || !from || !to || selectedDays.length === 0) {
    //                 showToast(
    //                     "Please select shift type, times, and at least one day.",
    //                     "error"
    //                 );
    //                 return;
    //             }
    //             // if (from >= to) {
    //             //     showToast('"From" time must be before "To" time.', "error");
    //             //     return;
    //             // }
    //             if (employees < 1) {
    //                 showToast("Number of employees must be at least 1.", "error");
    //                 return;
    //             }
    //             const targetDates = getDatesForDays(selectedDays, days);
    //             let conflicts = [];
    //             let duplicates = [];
    //             let toAdd = [];
    //             let updatedEmpty = [];
    //             targetDates.forEach((date) => {
    //                 const recsForDay = records.filter((r) => r.date === date);
    //                 const sameShifts = recsForDay.filter(
    //                     (r) => r.shiftType == shiftType
    //                 );
    //                 const emptyShifts = sameShifts.filter((r) => !r.from || !r.to);
    //                 if (emptyShifts.length > 0) {
    //                     emptyShifts.forEach((emptyShift) => {
    //                         emptyShift.from = from;
    //                         emptyShift.to = to;
    //                         emptyShift.employees = employees;
    //                         updatedEmpty.push(date);
    //                     });
    //                     return;
    //                 }
    //                 // Check for exact duplicate (same from, to, shiftType, and day)
    //                 const exactDuplicate = recsForDay.find(
    //                     (r) =>
    //                         r.shiftType == shiftType &&
    //                         r.from === from &&
    //                         r.to === to
    //                 );
    //                 if (exactDuplicate) {
    //                     conflicts.push({ date, rec: exactDuplicate });
    //                 } else if (sameShifts.length > 0) {
    //                     duplicates.push({ date, rec: sameShifts[0] });
    //                 } else {
    //                     toAdd.push(date);
    //                 }
    //             });
    //             // Show modal for exact duplicates only
    //             if (conflicts.length > 0) {
    //                 const groupedConflicts = groupShiftRows(
    //                     conflicts,
    //                     shiftTypeMap
    //                 );

    //                 let conflictTable = `
    //     <div class="mb-2">A shift with the exact same time already exists on these days:</div>
    //     <div style="max-height:220px;overflow:auto;">
    //         ${buildGroupedShiftTable(groupedConflicts, shiftTypeMap)}
    //     </div>
    // `;
    //                 showModal(
    //                     conflictTable +
    //                         `A shift with the same already exists. Please choose a different time.`,
    //                     () => {},
    //                     true // Only close modal, do not add
    //                 );
    //                 return;
    //             }

    //             // Show modal for duplicates (same shiftType on same day, but different time)
    //             if (duplicates.length > 0) {
    //                 const groupedDuplicates = groupShiftRows(
    //                     duplicates,
    //                     shiftTypeMap
    //                 );

    //                 let duplicateTable = `
    //     <div class="mb-2">A shift with the same type already exists on these days (but with different times):</div>
    //     <div style="max-height:220px;overflow:auto;">
    //         ${buildGroupedShiftTable(groupedDuplicates, shiftTypeMap)}
    //     </div>
    // `;
    //                 showModal(
    //                     duplicateTable +
    //                         `A shift with the same type already exists on these days. What do you want to do?`,
    //                     function onAddNew() {
    //                         // Add new shifts for these days
    //                         duplicates.forEach((c) => {
    //                             const day = new Date(c.date).toLocaleDateString(
    //                                 "en-US",
    //                                 {
    //                                     weekday: "long",
    //                                 }
    //                             );
    //                             records.push({
    //                                 date: c.date,
    //                                 day,
    //                                 shiftType,
    //                                 from,
    //                                 to,
    //                                 employees,
    //                                 isNew: true,
    //                             });
    //                         });
    //                         toAdd.forEach((date) => {
    //                             const day = new Date(date).toLocaleDateString(
    //                                 "en-US",
    //                                 {
    //                                     weekday: "long",
    //                                 }
    //                             );
    //                             records.push({
    //                                 date,
    //                                 day,
    //                                 shiftType,
    //                                 from,
    //                                 to,
    //                                 employees,
    //                                 isNew: true,
    //                             });
    //                         });
    //                         renderTable();
    //                         showToast("Shifts added successfully!", "success");
    //                     },
    //                     true, // Show confirm/cancel
    //                     [
    //                         {
    //                             text: "Add New",
    //                             class: "bg-blue-600 text-white px-2 py-1 rounded mr-2",
    //                             onClick: function (close) {
    //                                 // Same as onAddNew above
    //                                 duplicates.forEach((c) => {
    //                                     const day = new Date(
    //                                         c.date
    //                                     ).toLocaleDateString("en-US", {
    //                                         weekday: "long",
    //                                     });
    //                                     records.push({
    //                                         date: c.date,
    //                                         day,
    //                                         shiftType,
    //                                         from,
    //                                         to,
    //                                         employees,
    //                                         isNew: true,
    //                                     });
    //                                 });
    //                                 toAdd.forEach((date) => {
    //                                     const day = new Date(
    //                                         date
    //                                     ).toLocaleDateString("en-US", {
    //                                         weekday: "long",
    //                                     });
    //                                     records.push({
    //                                         date,
    //                                         day,
    //                                         shiftType,
    //                                         from,
    //                                         to,
    //                                         employees,
    //                                         isNew: true,
    //                                     });
    //                                 });
    //                                 renderTable();
    //                                 showToast(
    //                                     "Shifts added successfully!",
    //                                     "success"
    //                                 );
    //                                 close();
    //                             },
    //                         },
    //                         {
    //                             text: "Update Existing",
    //                             class: "bg-green-600 text-white px-2 py-1 rounded",
    //                             onClick: function (close) {
    //                                 // Update existing shifts for these days
    //                                 duplicates.forEach((c) => {
    //                                     records.forEach((r) => {
    //                                         if (
    //                                             r.date === c.date &&
    //                                             r.shiftType == shiftType
    //                                         ) {
    //                                             r.from = from;
    //                                             r.to = to;
    //                                             r.employees = employees;
    //                                         }
    //                                     });
    //                                 });
    //                                 renderTable();
    //                                 showToast(
    //                                     "Shifts updated successfully!",
    //                                     "success"
    //                                 );
    //                                 close();
    //                             },
    //                         },
    //                         ,
    //                         {
    //                             text: "Cancel",
    //                             class: "bg-gray-400 text-white px-2 py-1 rounded",
    //                             onClick: function (close) {
    //                                 // Just close the modal, do nothing else
    //                                 close();
    //                             },
    //                         },
    //                     ]
    //                 );
    //                 return;
    //             }

    //             toAdd.forEach((date) => {
    //                 const day = new Date(date).toLocaleDateString("en-US", {
    //                     weekday: "long",
    //                 });
    //                 records.push({ date, day, shiftType, from, to, employees });
    //             });
    //             renderTable();
    //             showToast("Shifts added successfully!", "success");
    //         });
    document
        .getElementById("step3Form")
        .addEventListener("submit", function (e) {
            e.preventDefault(); // Prevent default submission initially

            // Check for any record missing from, to, or employees
            const incompleteRecord = records.find(
                (record) =>
                    !record.from ||
                    !record.to ||
                    record.from === "" ||
                    record.to === "" ||
                    !record.employees ||
                    record.employees === "" ||
                    isNaN(record.employees) ||
                    Number(record.employees) < 1
            );
            if (incompleteRecord) {
                showToast(
                    "All shifts must have 'From', 'To', and number of employees specified (at least 1).",
                    "error"
                );
                renderTable();
                window.scrollTo({ top: 0, behavior: "smooth" });
                return false;
            }

            // If validation passes, add shift schedule data to form
            const form = this;

            // Filter records to only include those with actual shift data (non-empty from/to times)
            const validRecords = records.filter(
                (record) =>
                    record.from &&
                    record.to &&
                    record.from !== "" &&
                    record.to !== ""
            );

            // Debug: Log the records array
            console.log("All records:", records);
            console.log("Valid records to submit:", validRecords);

            if (validRecords.length === 0) {
                showToast(
                    "No shifts with times specified. Please add shift times.",
                    "error"
                );
                return false;
            }

            // Remove any existing shift schedule inputs
            const existingInputs = form.querySelectorAll(
                'input[name^="shift_schedule"]'
            );
            existingInputs.forEach((input) => input.remove());
            console.log("Existing inputs removed:", validRecords);

            // Add shift schedule data as hidden inputs
            validRecords.forEach((record, index) => {
                const dayInput = document.createElement("input");
                dayInput.type = "hidden";
                dayInput.name = `shift_schedule[${index}][day]`;
                dayInput.value = record.date;
                form.appendChild(dayInput);

                const dateInput = document.createElement("input");
                dateInput.type = "hidden";
                dateInput.name = `shift_schedule[${index}][date]`;
                dateInput.value = record.day;
                form.appendChild(dateInput);

                const shiftTypeInput = document.createElement("input");
                shiftTypeInput.type = "hidden";
                shiftTypeInput.name = `shift_schedule[${index}][shiftType]`;
                shiftTypeInput.value = record.shiftType;
                form.appendChild(shiftTypeInput);

                const fromInput = document.createElement("input");
                fromInput.type = "hidden";
                fromInput.name = `shift_schedule[${index}][from]`;
                fromInput.value = record.from;
                form.appendChild(fromInput);

                const toInput = document.createElement("input");
                toInput.type = "hidden";
                toInput.name = `shift_schedule[${index}][to]`;
                toInput.value = record.to;
                form.appendChild(toInput);

                const employeesInput = document.createElement("input");
                employeesInput.type = "hidden";
                employeesInput.name = `shift_schedule[${index}][employees]`;
                employeesInput.value = record.employees;
                form.appendChild(employeesInput);

                const isNewInput = document.createElement("input");
                isNewInput.type = "hidden";
                isNewInput.name = `shift_schedule[${index}][isNew]`;
                isNewInput.value = record.isNew ? 1 : 0;
                form.appendChild(isNewInput);
            });

            // Show success message and submit the form
            showToast("Schedule validation successful!", "success");

            // Continue with form submission
            setTimeout(() => {
                form.submit();
            }, 1000);
        });
});
