// Common validation and error helpers
import { apiService } from "./apiService";
import axios from "axios";

function showToast(message, type = "success") {
    const toastContainer = document.getElementById("toastContainer");
    const colors = {
        success: "bg-green-600",
        error: "bg-red-600",
        warning: "bg-yellow-500",
        info: "bg-blue-600",
    };
    const toast = document.createElement("div");
    toast.className = `text-white px-4 py-2 rounded shadow ${
        colors[type] || colors.info
    } animate-fade-in`;
    toast.innerHTML = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("opacity-0");
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
// Toast-style confirm modal
function showConfirm(message, onOk, onCancel) {
    // Remove existing modal if any
    let modal = document.getElementById("confirmModal");
    if (modal) modal.remove();

    modal = document.createElement("div");
    modal.id = "confirmModal";
    modal.className =
        "fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50";
    modal.innerHTML = `
        <div class="bg-white rounded shadow-lg p-6 max-w-sm w-full">
            <div class="mb-4">${message}</div>
            <div class="flex justify-end gap-2">
                <button id="confirmOk" class="bg-blue-600 text-white px-4 py-1 rounded">Yes</button>
                <button id="confirmCancel" class="bg-gray-400 text-white px-4 py-1 rounded">No</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("confirmOk").onclick = () => {
        modal.remove();
        onOk && onOk();
    };
    document.getElementById("confirmCancel").onclick = () => {
        modal.remove();
        onCancel && onCancel();
    };
}

function groupShiftRows(rows, shiftTypeMap) {
    const grouped = {};
    rows.forEach((c) => {
        const dayName = new Date(c.date).toLocaleDateString("en-US", {
            weekday: "long",
        });
        const key = `${dayName}|${c.rec.shiftType}|${c.rec.from}|${c.rec.to}`;
        if (!grouped[key]) {
            grouped[key] = {
                dayName,
                shiftType: c.rec.shiftType,
                from: c.rec.from,
                to: c.rec.to,
            };
        }
    });
    return Object.values(grouped);
}

function buildGroupedShiftTable(groupedRows, shiftTypeMap) {
    return `
        <table class="min-w-full border mb-4 text-sm">
            <thead>
                <tr>
                    <th class="border px-2 py-1">Day</th>
                    <th class="border px-2 py-1">Shift Type</th>
                    <th class="border px-2 py-1">From</th>
                    <th class="border px-2 py-1">To</th>
                </tr>
            </thead>
            <tbody>
                ${groupedRows
                    .map(
                        (rec) => `<tr>
                            <td class="border px-2 py-1">${rec.dayName}</td>
                            <td class="border px-2 py-1">${
                                shiftTypeMap[rec.shiftType] || rec.shiftType
                            }</td>
                            <td class="border px-2 py-1">${rec.from}</td>
                            <td class="border px-2 py-1">${rec.to}</td>
                        </tr>`
                    )
                    .join("")}
            </tbody>
        </table>
    `;
}

// Simple modal helper for confirmations and info
function showModal(message, onOk, onCancel, buttons = null) {
    let modal = document.getElementById("customModal");
    if (modal) modal.remove();
    modal = document.createElement("div");
    modal.id = "customModal";
    modal.className =
        "fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50";
    modal.innerHTML = `
        <div class="bg-white rounded shadow-lg p-6 max-w-sm w-full">
            <div class="mb-4">${message}</div>
            <div class="flex justify-end gap-2" id="modalButtons"></div>
        </div>
    `;
    document.body.appendChild(modal);

    const close = () => modal.remove();

    const btnContainer = document.getElementById("modalButtons");
    btnContainer.innerHTML = "";

    if (Array.isArray(buttons) && buttons.length > 0) {
        buttons.forEach((btn) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className =
                btn.class || "bg-blue-600 text-white px-4 py-1 rounded";
            button.textContent = btn.text;
            button.onclick = () => {
                close();
                if (btn.onClick) btn.onClick(close);
            };
            btnContainer.appendChild(button);
        });
    } else {
        // Default OK/Cancel
        const okBtn = document.createElement("button");
        okBtn.type = "button";
        okBtn.className = "bg-blue-600 text-white px-4 py-1 rounded";
        okBtn.textContent = "OK";
        okBtn.onclick = () => {
           onOk && onOk(close, modal); 
            close();
            
        };
        btnContainer.appendChild(okBtn);

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "bg-gray-400 text-white px-4 py-1 rounded";
        cancelBtn.textContent = "Cancel";
        cancelBtn.onclick = () => {
            close();
            onCancel && onCancel();
        };
        btnContainer.appendChild(cancelBtn);
    }
}

// Generic required field validator for text/select inputs
function validateRequired(input, errorMsg) {
    if (!input || !input.value || !input.value.trim()) {
        if (input) input.classList.add("border-red-500");
        showToast(errorMsg, "error");
        return false;
    } else {
        if (input) input.classList.remove("border-red-500");
        return true;
    }
}

function extractAxiosErrorMsg(error, fallbackMsg = "An error occurred.") {
    if (error.response && error.response.data && error.response.data.errors) {
        return Object.values(error.response.data.errors).flat().join(", ");
    }
    return fallbackMsg;
}

// Helper for removing rows with confirmation and API deletion
async function handleRemoveRow({
    row,
    id,
    apiPath,
    successMsg,
    errorMsg,
    confirmMsg,
    onAfterRemove,
    axiosConfig,
}) {
    if (id) {
        showConfirm(confirmMsg, async () => {
            try {
                if (apiPath === "/api/shift-types") {
                    await apiService.deleteShiftType(id);
                } else if (apiPath === "/api/locations") {
                    await apiService.deleteLocation(id);
                } else if (axiosConfig) {
                    await axios.delete(`${apiPath}/${id}`, axiosConfig());
                } else {
                    await axios.delete(`${apiPath}/${id}`);
                }
                showToast(successMsg, "success");
                row.remove();
                if (onAfterRemove) onAfterRemove();
            } catch (error) {
                showToast(errorMsg, "error");
            }
        });
    } else {
        row.remove();
        if (onAfterRemove) onAfterRemove();
    }
}

function validateRateInput(input) {
    const value = input.value;
    if (!value || isNaN(value) || Number(value) <= 0) {
        input.classList.add("border-red-500");
        input.title = "Rate is required and must be greater than 0.";
        showToast("Rate is required and must be greater than 0.", "error");
        return false;
    } else {
        input.classList.remove("border-red-500");
        input.title = "";
        return true;
    }
}

// Utility: Get days in range (inclusive)
function getDaysInRange(start, end) {
    const days = [];
    let current = new Date(start);
    end = new Date(end);
    while (current <= end) {
        days.push(current.toISOString().slice(0, 10));
        current.setDate(current.getDate() + 1);
    }
    return days;
}

// Utility: Get unique day names from an array of date strings
function getUniqueDayNamesInRange(days) {
    const unique = new Set();
    days.forEach((dateStr) => {
        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        unique.add(dayName);
    });
    return Array.from(unique);
}

// Utility: Populate a select element with day names
function populateBatchDaysSelect(days) {
    const select = document.getElementById("batchDays");
    select.innerHTML = "";
    getUniqueDayNamesInRange(days).forEach((dayName) => {
        const option = document.createElement("option");
        option.value = dayName;
        option.textContent = dayName;
        select.appendChild(option);
    });
}

// Utility: Check for time overlap
function timesOverlap(from1, to1, from2, to2) {
    return from1 < to2 && from2 < to1;
}

// Check if two time ranges overlap (already exported)
// function timesOverlap(from1, to1, from2, to2) { ... }

// Check if a record's from/to is invalid
function isInvalidTimeRange(from, to) {
    return !!from && !!to && from >= to;
}

// Check if a record conflicts with others in the records array
function hasTimeConflict(currentIdx, rec, records) {
    if (!rec.from || !rec.to) return false;
    return records.some(
        (other, idx) =>
            idx !== currentIdx &&
            other.day === rec.day &&
            other.shiftType == rec.shiftType &&
            other.from &&
            other.to
        // timesOverlap(rec.from, rec.to, other.from, other.to)
    );
}

// Utility: Get selected values from a multi-select
function getSelectedDays(selectId = "batchDays") {
    const select = document.getElementById(selectId);
    return Array.from(select.selectedOptions).map((opt) => opt.value);
}

// Utility: Map day-of-week (e.g. "Monday") to all matching dates in the range
function getDatesForDays(selectedDays, days) {
    return days.filter((dateStr) => {
        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        return selectedDays.includes(dayName);
    });
}

/**
 * Validates that each selected shift type has at least one complete record
 * @param {Array} records - All shift records
 * @param {Array} shiftTypes - Selected shift types
 * @returns {Object} - Validation result with status and message
 */
function validateShiftTypesCoverage(records, shiftTypes) {
    const shiftTypesWithCompleteRecords = new Set();

    records.forEach((rec) => {
        // Only count records that have both from and to times set
        if (rec.from && rec.to) {
            shiftTypesWithCompleteRecords.add(rec.shiftType.toString());
        }
    });

    const missingShiftTypes = shiftTypes.filter(
        (st) => !shiftTypesWithCompleteRecords.has(st.id.toString())
    );

    if (missingShiftTypes.length > 0) {
        const missingNames = missingShiftTypes.map((st) => st.name).join(", ");
        return {
            valid: false,
            message: `Missing shift data: At least one shift with times is required for ${missingNames}`,
        };
    }

    return { valid: true };
}

/**
 * Validates that all required fields are filled for all records
 * @param {Array} records - All shift records
 * @returns {Object} - Validation result with status and message
 */
function validateAllRequiredFields(records) {
    const emptyTimeRecords = records.filter(
        (rec) => rec.from === "" || rec.to === ""
    );

    if (emptyTimeRecords.length > 0) {
        return {
            valid: false,
            message: `${emptyTimeRecords.length} shift(s) are missing time values`,
        };
    }

    const invalidEmployeeRecords = records.filter(
        (rec) => rec.employees < 1 || !rec.employees
    );

    if (invalidEmployeeRecords.length > 0) {
        return {
            valid: false,
            message: `${invalidEmployeeRecords.length} shift(s) have invalid employee counts (must be at least 1)`,
        };
    }

    return { valid: true };
}
function round(value, decimals = 2) {
    if (isNaN(value) || value === null || value === undefined) return 0;
    return Number(parseFloat(value).toFixed(decimals));
}

/**
 * Master validation function for the shift schedule
 * @param {Array} records - All shift records
 * @param {Array} shiftTypes - Selected shift types
 * @returns {Object} - Validation result with valid status and array of error messages
 */
function validateShiftSchedule(records, shiftTypes) {
    const errors = [];

    // 1. Ensure each shift type has at least one record with times
    const coverageCheck = validateShiftTypesCoverage(records, shiftTypes);
    if (!coverageCheck.valid) errors.push(coverageCheck.message);

    // 2. Check for time conflicts and invalid time ranges
    const conflictRecords = records.filter((rec, idx) =>
        isInvalidTimeRange(rec.from, rec.to)
    );

    if (conflictRecords.length > 0) {
        errors.push(
            `${conflictRecords.length} shift(s) have time invalid time ranges`
        );
    }

    return {
        valid: errors.length === 0,
        errors: errors,
    };
}

// Helper function to format currency
function formatCurrency(amount) {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
}

// Helper function to format hours
function formatHours(hours) {
    return parseFloat(hours || 0).toFixed(2);
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return "-";
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch (e) {
        return dateString;
    }
}

// Helper function to format time
function formatTime(timeString) {
    if (!timeString) return "-";
    try {
        // Handle both HH:MM and HH:MM:SS formats
        const timeParts = timeString.split(":");
        if (timeParts.length >= 2) {
            return `${timeParts[0]}:${timeParts[1]}`;
        }
        return timeString;
    } catch (e) {
        return timeString;
    }
}

// Helper function to calculate hours between two times
function calculateHours(startTime, endTime) {
    if (!startTime || !endTime) return 0;

    try {
        const start = new Date(`1970-01-01T${startTime}:00`);
        const end = new Date(`1970-01-01T${endTime}:00`);
        const diffMs = end - start;
        const diffHours = diffMs / (1000 * 60 * 60);

        return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
    } catch (e) {
        return 0;
    }
}

function roundTimesheetRow(row, headings, decimals = 2) {
    const roundHeadings = [
        "Scheduled Hours",
        "Day (06–18)",
        "Night (18–06)",
        "Saturday",
        "Sunday",
        "Public Holiday",
        "Client Day Rate",
        "Client Night Rate",
        "Client Sat Rate",
        "Client Sun Rate",
        "Client PH Rate",
        "Client Billable",
    ];
    return row.map((value, idx) => {
        if (roundHeadings.includes(headings[idx]) && !isNaN(value)) {
            return round(value, decimals);
        }
        return value;
    });
}

export {
    validateRequired,
    extractAxiosErrorMsg,
    handleRemoveRow,
    showConfirm,
    showToast,
    validateRateInput,
    showModal,
    getDaysInRange,
    getUniqueDayNamesInRange,
    populateBatchDaysSelect,
    timesOverlap,
    getSelectedDays,
    getDatesForDays,
    isInvalidTimeRange,
    hasTimeConflict,
    validateShiftTypesCoverage,
    validateAllRequiredFields,
    validateShiftSchedule,
    formatCurrency,
    formatHours,
    formatDate,
    formatTime,
    calculateHours,
    groupShiftRows,
    buildGroupedShiftTable,
    round,
    roundTimesheetRow,
};
