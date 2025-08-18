console.log("HELOOOOOOOOOOOOOOOOOOOO");

import { apiService } from "../apiService";
import {
    showToast,
    validateRequired,
    extractAxiosErrorMsg,
    showModal,
} from "../helpers";
import { SelectionManager } from "./SelectionManager";

window.apiService = apiService;
window.showToast = showToast;

const records = {}; // Keyed by location ID
let previousFormData = {}; // Store previous form data for each location
const locations = await apiService.getLocations();
let shiftTypes = []; // Initialize shiftTypes as an empty array
// Store the latest calculate response for each location
let dayTypes = [];

async function loadDayTypes() {
    try {
        dayTypes = await apiService.getDayTypes();
    } catch (error) {
        showToast("Failed to load day types.", "error");
    }
}

window.showPreviewTableModal = function showPreviewTableModal({
    headings,
    data,
    selectedColumnIds,
    totals,
    exportId,
    allSelectedLocationIds,
    selectedLocationIds,
    allLocationData,
}) {
    console.log(exportId);
    // 1. Show the modal
    document.getElementById("previewModal").classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
    const coreColumns = ["location"]; // match backend keys

    // You need to keep track of selectedLocationIds and allLocationData globally or pass them in
    renderLocationDropdown(
        locations.filter((loc) =>
            allSelectedLocationIds.includes(String(loc.id))
        ),
        selectedLocationIds,
        allLocationData,
        selectedColumnIds
    );
    // 2. Render the column dropdown and preview table
    renderColumnDropdown(headings, selectedColumnIds, coreColumns, data);
    populatePreviewTable(headings, data, selectedColumnIds);
    console.log(latestCalculateResponses[exportId]);

    // 3. (Optional) Render export button, radio options, etc.

    renderExportButton(exportId);

    // // Dropdown toggle logic (unchanged)
    // document.getElementById("columnDropdownBtn").onclick = function (e) {
    //     e.stopPropagation();
    //     document
    //         .getElementById("columnDropdownMenu")
    //         .classList.toggle("hidden");
    // };
    // document.addEventListener("click", function (e) {
    //     const menu = document.getElementById("columnDropdownMenu");
    //     const btn = document.getElementById("columnDropdownBtn");
    //     if (!menu.contains(e.target) && !btn.contains(e.target)) {
    //         menu.classList.add("hidden");
    //     }
    // });
    setTimeout(() => {
        if ($.fn.DataTable.isDataTable("#previewTable")) {
            adjustTableScrollY();
            $("#previewTable").DataTable().columns.adjust();
        }
    }, 100);
};

function reattachShiftTypeCrudTableEvents() {
    const shiftTypeTbody = document.querySelector("#shiftTypeCrudTable tbody");
    shiftTypeTbody.removeEventListener("click", handleShiftTypeCrudTableClick); // Remove old
    shiftTypeTbody.addEventListener("click", handleShiftTypeCrudTableClick); // Add new
}
function reattachLocationCrudTableEvents() {
    const locationTbody = document.querySelector("#locationCrudTable tbody");
    if (!locationTbody) return;
    locationTbody.removeEventListener("click", handleLocationCrudTableClick); // Remove old
    locationTbody.addEventListener("click", handleLocationCrudTableClick); // Add new
}

function showButtonSpinner(btn) {
    btn.querySelector("i.fa-spinner").classList.remove("hidden");
    btn.querySelector("i:not(.fa-spinner)").classList.add("hidden");
    btn.disabled = true;
}
function hideButtonSpinner(btn) {
    btn.querySelector("i.fa-spinner").classList.add("hidden");
    btn.querySelector("i:not(.fa-spinner)").classList.remove("hidden");
    btn.disabled = false;
}

function createShiftTypeRow(shiftType = {}, isEdit = false) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-id", shiftType.id || "");
    tr.className = "bg-white hover:bg-gray-50 border";
    if (isEdit) {
        tr.classList.add("editing-row", "shadow-lg", "rounded");
        tr.classList.replace("bg-white", "bg-blue-50");
        tr.innerHTML = `
            <td class='px-2 py-1 border-b border'><input type="text" class="form-input w-full" value="${
                shiftType.name || ""
            }" required></td>
         <td class="px-2 py-1 border-b border description-cell group relative w-[180px] max-w-[180px]">
        <textarea class="form-textarea w-full resize-y transition-all duration-200 ease-in-out
            max-w-[180px] max-h-[1.5em] overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer
            focus:whitespace-normal focus:max-h-[300px] focus:bg-gray-50 focus:shadow-lg focus:z-10 focus:p-1 focus:overflow-auto"
            rows="1"
            style="min-height:1.5em;"
        >${shiftType.description || ""}</textarea>
    </td>
            ${dayTypes
                .map((dt) => {
                    const rateObj = (shiftType.rates || []).find(
                        (r) => r.day_type_id === dt.id
                    );
                    return `<td class='px-2 py-1 border-b border'>
                    <input type="number" step="0.01" class="form-input w-full"
                        data-day-type-id="${dt.id}"
                        data-rate-id="${rateObj ? rateObj.id : ""}"
                        value="${rateObj ? rateObj.rate : ""}">
                </td>`;
                })
                .join("")}
                 <td class="px-2 py-1 border-b border align-middle h-full">
    <div class="flex  justify-center items-center h-full min-h-[40px] gap-2">
       <button type="button" class="saveShiftTypeBtn text-green-600 bg-green-100 hover:bg-green-200 rounded shadow px-2 py-1" title="Save">
    <i class="fas fa-check"></i>
    <i class="fas fa-spinner fa-spin hidden ml-1"></i>
</button>
<button type="button" class="cancelShiftTypeBtn text-gray-600 bg-gray-100 hover:bg-gray-200 rounded shadow px-2 py-1" title="Cancel">
    <i class="fas fa-times"></i>
    <i class="fas fa-spinner fa-spin hidden ml-1"></i>
</button>
    </div>
</td>
           
        `;
    } else {
        tr.innerHTML = `
            <td class='px-2 py-1 border-b border'>${shiftType.name || ""}</td>
              <td class="px-2 py-1 border-b border description-cell group relative w-[180px] max-w-[180px]">
    <div class="transition-all duration-200 ease-in-out
        w-full max-w-[180px] max-h-[1.5em] overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer
        group-hover:whitespace-normal group-hover:max-h-[300px] group-hover:bg-gray-50 group-hover:shadow-lg group-hover:z-10 group-hover:p-1">
        ${shiftType.description || ""}
    </div>
</td>
            ${dayTypes
                .map((dt) => {
                    const rateObj = (shiftType.rates || []).find(
                        (r) => r.day_type_id === dt.id
                    );
                    return `<td class='px-2 py-1 border-b border'>${
                        rateObj ? rateObj.rate : ""
                    }</td>`;
                })
                .join("")}
                <td class="px-2 py-1 border-b border align-middle h-full">
    <div class="flex  justify-center items-center h-full min-h-[40px] gap-2">
        <button type="button" class="editShiftTypeBtn text-blue-600" title="Edit">
    <i class="fas fa-edit"></i>
    <i class="fas fa-spinner fa-spin hidden ml-1"></i>
</button>
<button type="button" class="deleteShiftTypeBtn text-red-600" title="Delete">
    <i class="fas fa-trash"></i>
    <i class="fas fa-spinner fa-spin hidden ml-1"></i>
</button>
    </div>
</td>
           
        `;
    }
    return tr;
}
// async function handleSaveShiftType(tr) {
//     showLoading();
//     const id = tr.getAttribute("data-id");
//     const name = tr.querySelector("input[type='text']").value.trim();
//     const description = tr.querySelectorAll("input[type='text']")[1].value.trim();
//     let shiftTypeRes;
//     if (id) {
//         shiftTypeRes = await apiService.updateShiftType(id, { name, description });
//     } else {
//         shiftTypeRes = await apiService.createShiftType({ name, description });
//     }
//     const shiftTypeId = id || shiftTypeRes.data.id;

//     // Save rates
//     const rateInputs = Array.from(tr.querySelectorAll("input[type='number'][data-day-type-id]"));
//     for (const input of rateInputs) {
//         const rateId = input.getAttribute("data-rate-id");
//         const dayTypeId = input.getAttribute("data-day-type-id");
//         const rateValue = input.value;
//         if (rateId) {
//             await apiService.updateRate(rateId, {
//                 shift_type_id: shiftTypeId,
//                 day_type_id: dayTypeId,
//                 rate: rateValue
//             });
//         } else {
//             await apiService.createRate({
//                 shift_type_id: shiftTypeId,
//                 day_type_id: dayTypeId,
//                 rate: rateValue
//             });
//         }
//     }
//     await loadShiftTypesTable();
//     hideLoading();
// }
async function handleDeleteShiftType(tr) {
    const id = tr.getAttribute("data-id");
    if (!id) {
        tr.remove();
        return;
    }
    showLoading();
    await apiService.deleteShiftType(id);
    await loadShiftTypesTable();
    hideLoading();
}

// Open modal
function openShiftTypeCrudModal() {
    document.getElementById("shiftTypeCrudModal").classList.remove("hidden");
    loadShiftTypesTable();
}

// Close modal
function closeShiftTypeCrudModal() {
    document.getElementById("shiftTypeCrudModal").classList.add("hidden");
}

// Add new row (inline editing)
function addShiftTypeRow() {
    const tbody = document.querySelector("#shiftTypeCrudTable tbody");
    if (tbody.querySelector(".editing-row")) return;
    const tr = createShiftTypeRow({}, true); // Empty object for new row
    // tr.classList.add("editing-row", "shadow-lg", "bg-blue-50", "rounded");
    tbody.prepend(tr);
}

// Handle table actions (edit, save, cancel, delete)
async function handleShiftTypeCrudTableClick(e) {
    const tr = e.target.closest("tr");
    if (!tr) return;

    // Save new or edited shift type
    if (e.target.closest(".saveShiftTypeBtn")) {
        const btn = e.target.closest(".saveShiftTypeBtn");
        showButtonSpinner(btn);
        try {
            const id = tr.getAttribute("data-id");
            const inputs = tr.querySelectorAll("input[type='text']");
            const name = inputs[0].value.trim();
            const description = tr.querySelector("textarea").value.trim();
            const rateInputs = Array.from(
                tr.querySelectorAll("input[type='number'][data-day-type-id]")
            );
            const rates = rateInputs.map((input) => ({
                id: input.getAttribute("data-rate-id") || null,
                day_type_id: parseInt(input.getAttribute("data-day-type-id")),
                rate: parseFloat(input.value) || 0,
            }));

            // --- VALIDATION START ---
            if (!name) {
                showToast("Shift type name is required.", "error");
                return;
            }
            const nameExists = shiftTypes.some(
                (st) =>
                    st.name.trim().toLowerCase() === name.toLowerCase() &&
                    String(st.id) !== String(id)
            );
            if (nameExists) {
                showToast("Shift type name must be unique.", "error");
                return;
            }
            const emptyRate = rates.some(
                (r) => r.rate === "" || isNaN(Number(r.rate)) || r.rate === 0
            );
            if (emptyRate) {
                showToast(
                    "All rate fields are required and must be numbers.",
                    "error"
                );
                return;
            }
            // --- VALIDATION END ---
            showShiftTypeTableLoading();

            let shiftTypeRes;
            if (id) {
                shiftTypeRes = await apiService.updateShiftType(id, {
                    name,
                    description,
                });
            } else {
                shiftTypeRes = await apiService.createShiftType({
                    name,
                    description,
                });
            }
            const shiftTypeId = id || shiftTypeRes.data.id;

            // Save rates (create or update)
            for (const rate of rates) {
                if (rate.id) {
                    await apiService.updateRate(rate.id, {
                        shift_type_id: shiftTypeId,
                        day_type_id: rate.day_type_id,
                        rate: rate.rate,
                    });
                } else {
                    await apiService.createRate({
                        shift_type_id: shiftTypeId,
                        day_type_id: rate.day_type_id,
                        rate: rate.rate,
                    });
                }
            }
            await loadShiftTypesTable();
            hideShiftTypeTableLoading();
        } finally {
            hideButtonSpinner(btn);
        }
    }

    // Cancel add/edit
    if (e.target.closest(".cancelShiftTypeBtn")) {
        const btn = e.target.closest(".cancelShiftTypeBtn");
        showButtonSpinner(btn);
        try {
            await loadShiftTypesTable();
        } finally {
            hideButtonSpinner(btn);
        }
    }

    // Edit existing shift type
    if (e.target.closest(".editShiftTypeBtn")) {
        const btn = e.target.closest(".editShiftTypeBtn");
        showButtonSpinner(btn);
        try {
            if (document.querySelector(".editing-row")) return;
            const shiftTypeId = tr.getAttribute("data-id");
            const shiftType = shiftTypes.find(
                (st) => String(st.id) === String(shiftTypeId)
            );
            const editTr = createShiftTypeRow(shiftType, true);
            tr.replaceWith(editTr);
        } finally {
            hideButtonSpinner(btn);
        }
    }

    // Delete shift type
    if (e.target.closest(".deleteShiftTypeBtn")) {
        const btn = e.target.closest(".deleteShiftTypeBtn");
        showButtonSpinner(btn);
        try {
            const id = tr.getAttribute("data-id");
            const shiftTypeToDelete = shiftTypes.find(
                (st) => String(st.id) === String(id)
            );

            if (confirm("Are you sure you want to delete this shift type?")) {
                showShiftTypeTableLoading();
                await apiService.deleteShiftType(id);
                // Remove all shifts in records that belong to this shift type
                Object.keys(records).forEach(async (locationId) => {
                    const hasShiftType = records[locationId].some(
                        (rec) =>
                            rec.shiftType === (shiftTypeToDelete?.name || "")
                    );
                    if (hasShiftType) {
                        records[locationId] = records[locationId].filter(
                            (rec) =>
                                rec.shiftType !==
                                (shiftTypeToDelete?.name || "")
                        );
                        saveRecordsToStorage(locationId);
                        await handleSaveButtonClick(locationId, true, true);
                        renderTable(locationId);
                    }
                });
                await loadShiftTypesTable();
                hideShiftTypeTableLoading();
            }
        } finally {
            hideButtonSpinner(btn);
        }
    }
}

window.loadShiftTypesTable = async function loadShiftTypesTable() {
    showShiftTypeTableLoading();
    // Fetch day types and shift types (with rates)
    const [dayTypesRes, shiftTypesRes] = await Promise.all([
        apiService.getDayTypes(),
        apiService.getShiftTypes(),
    ]);
    dayTypes = dayTypesRes; // global
    shiftTypes = shiftTypesRes;

    const tbody = document.querySelector("#shiftTypeCrudTable tbody");
    tbody.innerHTML = "";
    shiftTypes.forEach((st) => {
        tbody.appendChild(createShiftTypeRow(st));
    });
    hideShiftTypeTableLoading();
    reattachShiftTypeCrudTableEvents(); // <--- Add this line
};

// // Load all shift types from API
// function loadShiftTypesTable() {
//     showLoading();
//     axios
//         .get("/api/shift-types")
//         .then((res) => {
//             const tbody = document.querySelector("#shiftTypeCrudTable tbody");
//             tbody.innerHTML = "";
//             res.data.forEach((st) => {
//                 const tr = document.createElement("tr");
//                 tr.dataset.id = st.id;
//                 tr.innerHTML = `
//                 <td class="border px-2 py-1">${st.name}</td>
//                 <td class="border px-2 py-1">${st.description || ""}</td>
//                 <td class="border px-2 py-1">${st.day_rate || ""}</td>
//                 <td class="border px-2 py-1">${st.night_rate || ""}</td>
//                 <td class="border px-2 py-1">${st.saturday_rate || ""}</td>
//                 <td class="border px-2 py-1">${st.sunday_rate || ""}</td>
//                 <td class="border px-2 py-1">${
//                     st.public_holiday_rate || ""
//                 }</td>
//                 <td class="border px-2 py-1 flex gap-2">
//                     <button class="editShiftTypeBtn text-blue-600" title="Edit"><i class="fas fa-edit"></i></button>
//                     <button class="deleteShiftTypeBtn text-red-600" title="Delete"><i class="fas fa-trash"></i></button>
//                 </td>
//             `;
//                 tbody.appendChild(tr);
//             });
//         })
//         .finally(hideLoading);
// }

window.showLoading = function showLoading() {
    document.getElementById("globalLoadingOverlay").classList.remove("hidden");
};
window.hideLoading = function hideLoading() {
    document.getElementById("globalLoadingOverlay").classList.add("hidden");
};

function openLocationCrudModal() {
    document.getElementById("locationCrudModal").classList.remove("hidden");
    loadLocationsTable();
}

function closeLocationCrudModal() {
    document.getElementById("locationCrudModal").classList.add("hidden");
}

const AU_STATES = [
    "New South Wales",
    "Victoria",
    "Queensland",
    "Western Australia",
    "South Australia",
    "Tasmania",
    "Australian Capital Territory",
    "Northern Territory",
];

function addLocationRow() {
    const tbody = document.querySelector("#locationCrudTable tbody");
    // Prevent multiple empty rows
    if (tbody.querySelector(".editing-row")) return;
    const tr = document.createElement("tr");
    tr.classList.add("editing-row");
    tr.innerHTML = `
        <td class="border px-2 py-1"><input type="text" class="form-input w-full" placeholder="Name"></td>
        <td class="border px-2 py-1"><input type="text" class="form-input w-full" placeholder="Address"></td>
        <td class="border px-2 py-1"><input type="text" class="form-input w-full" placeholder="City"></td>
        <td class="border px-2 py-1">
            <select class="form-select w-full">
                <option value="">Select State</option>
                ${AU_STATES.map(
                    (state) => `<option value="${state}">${state}</option>`
                ).join("")}
            </select>
        </td>
          <td class="border px-2 py-1 flex gap-2">
        <button class="saveLocationBtn text-green-600 bg-green-100 hover:bg-green-200 rounded shadow px-2 py-1" title="Save">
            <i class="fas fa-check"></i>
            <i class="fas fa-spinner fa-spin hidden ml-1"></i>
        </button>
        <button class="cancelLocationBtn text-gray-600 bg-gray-100 hover:bg-gray-200 rounded shadow px-2 py-1" title="Cancel">
            <i class="fas fa-times"></i>
            <i class="fas fa-spinner fa-spin hidden ml-1"></i>
        </button>
    </td>
    `;
    tr.classList.add("editing-row", "shadow-lg", "bg-blue-50", "rounded");
    tbody.prepend(tr);
}

async function handleLocationCrudTableClick(e) {
    const tr = e.target.closest("tr");
    if (!tr) return;

    // Save new or edited location
    if (e.target.closest(".saveLocationBtn")) {
        const btn = e.target.closest(".saveLocationBtn");
        showButtonSpinner(btn);
        try {
            const inputs = tr.querySelectorAll("input");
            const stateSelect = tr.querySelector("select");

            const data = {
                name: inputs[0].value.trim(),
                address: inputs[1].value.trim(),
                city: inputs[2].value.trim(),
                state: stateSelect.value.trim(),
            };
            const id = tr.dataset.id;
            if (!data.name) {
                showToast("Name is required.", "error");
                return;
            }

            if (id) {
                // Edit location
                await axios.put(`/api/locations/${id}`, data).then(() => {
                    // 1. Update global locations array
                    const idx = locations.findIndex(
                        (loc) => String(loc.id) === String(id)
                    );
                    if (idx !== -1) {
                        locations[idx] = { ...locations[idx], ...data, id };
                    }

                    // 2. Update dropdown and pills
                    updateLocationInDropdown({ ...data, id });

                    // 3. Update the form in the locations container
                    const form = document.querySelector(
                        `.location-form[data-location-id="${id}"]`
                    );
                    if (form) {
                        const nameElem = form.querySelector("h3");
                        const addressElem = form.querySelector(
                            "p.text-sm.text-gray-600"
                        );
                        if (nameElem) nameElem.textContent = data.name;
                        if (addressElem) addressElem.textContent = data.address;
                    }

                    // 4. Optionally, update display
                    window.updateLocationDisplay();
                    renderSelectedLocationContainers();
                    console.log(
                        "Location updated successfully with this id : ",
                        id
                    );
                    loadLocationsTable();
                });
            } else {
                //adding new location
                await axios.post(`/api/locations`, data).then((response) => {
                    console.log(
                        "the response data is for adding new location is:",
                        response.data
                    );

                    console.log(
                        "trying to add the new location using the create form method"
                    );
                    locations.push(response.data);
                    window.locations.push(response.data);
                    records[response.data.id] = []; // Initialize empty records array for the new location
                    const container = document.getElementById(
                        "selectedLocationsForms"
                    );
                    container.style.display = "";
                    if (
                        container &&
                        !container.querySelector(
                            `[data-location-id="${response.data.id}"]`
                        )
                    ) {
                        container.appendChild(
                            createLocationForm(response.data)
                        );
                        console.log(
                            "New location form added successfully to the location container!!"
                        );
                    }
                    // Attach event listener to the Add New Entry button
                    const addEntryBtn = container.querySelector(
                        `.add-shift-type-btn[data-location-id="${response.data.id}"]`
                    );
                    if (addEntryBtn) {
                        addEntryBtn.addEventListener("click", function () {
                            addDefaultShiftRow(response.data.id);
                        });
                    }
                    // Attach event listener to the Save and Review button
                    const saveButton = document.getElementById(
                        `saveBtn_${response.data.id}`
                    );
                    if (saveButton) {
                        saveButton.addEventListener("click", function () {
                            renderTable(response.data.id);
                            // console.log("Fetching locations with shift data...");
                            // updateAvailableLocations();
                            locations.push(response.data);

                            handleSaveButtonClick(response.data.id);
                            updateAvailableLocations();
                            getLocationsWithShiftData();
                            if (
                                updateAvailableLocations() &&
                                getLocationsWithShiftData()
                            ) {
                                console.log(
                                    "Location added and update successfulllllly!!!!:",
                                    response.data
                                );
                            }
                        });
                    }

                    const reviewButton = document.getElementById(
                        `reviewTableBtn_${response.data.id}`
                    );
                    console.log("kakakkkakakakakkakakak", reviewButton);
                    if (reviewButton) {
                        reviewButton.addEventListener("click", function () {
                            console.log("review button clicked");
                            renderTable(response.data.id);
                            // console.log("Fetching locations with shift data...");
                            // updateAvailableLocations();
                            locations.push(response.data);

                            handleExportButtonClick(response.data.id);
                            // updateAvailableLocations();
                            // getLocationsWithShiftData();
                        });
                    }
                    // loadLocationsTable();
                    addLocationToDropdown(response.data); // <-- here
                    window.updateLocationDisplay();
                    renderSelectedLocationContainers();

                    loadLocationsTable();
                });
            }
        } catch (error) {
            showToast("Failed to save location.", "error");
        } finally {
            hideButtonSpinner(btn);
        }
    }

    // Cancel add/edit
    if (e.target.closest(".cancelLocationBtn")) {
        const btn = e.target.closest(".cancelLocationBtn");
        showButtonSpinner(btn);
        await loadLocationsTable();
        hideButtonSpinner(btn);
    }

    // Edit existing location
    if (e.target.closest(".editLocationBtn")) {
        const btn = e.target.closest(".editLocationBtn");
        showButtonSpinner(btn);
        if (document.querySelector(".editing-row")) return;
        const tds = tr.querySelectorAll("td");
        const [name, address, city, state] = Array.from(tds)
            .slice(0, 4)
            .map((td) => td.textContent.trim());
        tr.innerHTML = `
            <td class="border px-2 py-1"><input type="text" class="form-input w-full px-2 py-1 border" value="${name}"></td>
            <td class="border px-2 py-1"><input type="text" class="form-input w-full px-2 py-1 border" value="${address}"></td>
            <td class="border px-2 py-1"><input type="text" class="form-input w-full px-2 py-1 border" value="${city}"></td>
            <td class="border px-2 py-1">
                <select class="form-select w-full px-2 py-1 border">
                    <option value="">Select State</option>
                ${AU_STATES.map(
                    (s) =>
                        `<option value="${s}" ${
                            s === state ? "selected" : ""
                        }>${s}</option>`
                ).join("")}
            </select>
        </td>            <td class="border px-2 py-1 flex gap-2">
                 <button class="saveLocationBtn text-green-600 bg-green-100 hover:bg-green-200 rounded shadow px-2 py-1" title="Save">
        <i class="fas fa-check"></i>
        <i class="fas fa-spinner fa-spin hidden ml-1"></i>
    </button>
    <button class="cancelLocationBtn text-gray-600 bg-gray-100 hover:bg-gray-200 rounded shadow px-2 py-1" title="Cancel">
        <i class="fas fa-times"></i>
        <i class="fas fa-spinner fa-spin hidden ml-1"></i>
    </button>
            </td>
        `;
        tr.classList.add("editing-row", "shadow-lg", "bg-blue-50", "rounded");
        tr.dataset.id = tr.dataset.id;
        hideButtonSpinner(btn);
    }

    // Delete location
    if (e.target.closest(".deleteLocationBtn")) {
        const btn = e.target.closest(".deleteLocationBtn");
        showButtonSpinner(btn);
        try {
            const id = tr.dataset.id;
            if (confirm("Are you sure you want to delete this location?")) {
                await axios.delete(`/api/locations/${id}`);
                loadLocationsTable();
                removeLocationFromDropdown(id);
                window.updateLocationDisplay();
            }
        } catch (error) {
            showToast("Failed to delete location.", "error");
        } finally {
            hideButtonSpinner(btn);
        }
    }
}

window.loadLocationsTable = async function loadLocationTable() {
    showLocationTableLoading();
    await axios
        .get("/api/locations")
        .then((res) => {
            const tbody = document.querySelector("#locationCrudTable tbody");
            tbody.innerHTML = "";
            res.data.forEach((loc) => {
                const tr = document.createElement("tr");
                tr.classList.add("bg-white");
                tr.dataset.id = loc.id;
                tr.innerHTML = `
                <td class="border px-2 py-1">${loc.name}</td>
                <td class="border px-2 py-1">${loc.address}</td>
                <td class="border px-2 py-1">${loc.city}</td>
                <td class="border px-2 py-1">${loc.state}</td>
                <td class="border px-2 py-1 flex gap-2">
                   <button class="editLocationBtn text-blue-600" title="Edit">
            <i class="fas fa-edit"></i>
            <i class="fas fa-spinner fa-spin hidden ml-1"></i>
        </button>
        <button class="deleteLocationBtn text-red-600" title="Delete">
            <i class="fas fa-trash"></i>
            <i class="fas fa-spinner fa-spin hidden ml-1"></i>
        </button>
                </td>
            `;
                tbody.appendChild(tr);
            });
        })
        .finally(() => {
            // hideLocationTableLoading();
            reattachLocationCrudTableEvents(); // <--- Add this line
        });
};

async function calculateForMultipleLocations(locationsData) {
    // locationsData: Array of { location_id, shifts: [...] }
    try {
        const response = await apiService.calculateReviewMulti({
            locations: locationsData,
        });
        if (response.data.success) {
            // response.data.results is expected to be an object keyed by location_id
            // Each value contains timesheet_data, timesheet_headings, totals, etc.
            return response.data.results;
        } else {
            showToast("Failed to calculate for multiple locations.", "error");
            return null;
        }
    } catch (error) {
        showToast("Error calculating for multiple locations.", "error");
        console.error(error);
        return null;
    }
}

// Helper function to save records to both localStorage and database
function saveRecordsToStorage(locationId) {
    // Get quotation ID from window
    const quotationId = window.quotationId;

    //save to localStorage with quotation-specific key
    localStorage.setItem(
        `quotation_${quotationId}selectedlocations${locationId}Records`,
        JSON.stringify(records[locationId])
    );
    // // Save to localStorage for immediate use
    // localStorage.setItem(
    //     `records_${locationId}`,
    //     JSON.stringify(records[locationId])
    // );

    // Save to database for persistence
    if (typeof window.saveShiftDataToDatabase === "function") {
        window.saveShiftDataToDatabase(locationId, records[locationId]);
    }
}

// Function to load records from database/localStorage when location form is shown
function loadRecordsForLocation(locationId) {
    const quotationId = window.quotationId;
    console.log(`Loading records for location ${quotationId}`);

    // Check if we already have records loaded
    if (records[locationId] && records[locationId].length > 0) {
        console.log(
            `Records already loaded for quotation ${quotationId}, location ${locationId}`
        );
        renderTable(locationId);
        return;
    }

    // Try localStorage first (for immediate response) with quotation-specific key
    const localData = localStorage.getItem(
        `quotation_${quotationId}selectedlocations${locationId}Records`
    );
    if (localData) {
        try {
            const parsedRecords = JSON.parse(localData);
            if (Array.isArray(parsedRecords) && parsedRecords.length > 0) {
                console.log(
                    `Loading ${parsedRecords.length} records from localStorage for quotation ${quotationId}, for location ${locationId}`
                );
                records[locationId] = parsedRecords;
                renderTable(locationId);
                return;
            }
        } catch (e) {
            console.error("Error parsing localStorage data:", e);
        }
    }

    console.log(
        `No records found for quotation ${quotationId}, location ${locationId}`
    );
}

// MultiSelect Dropdown functionality
class MultiSelectDropdown {
    constructor(containerId) {
        console.log(
            "Initializing MultiSelectDropdown with container ID:",
            containerId
        );
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with ID ${containerId} not found`);
            return;
        }

        console.log("Container found:", this.container);

        this.searchInput = this.container.querySelector(".location-search");
        this.dropdown = this.container.querySelector(".location-dropdown");
        this.optionsContainer =
            this.container.querySelector(".location-options");
        this.pillsContainer = this.container.querySelector(".selected-pills");

        // Also try to find pills container outside the main container if it's not inside
        if (!this.pillsContainer) {
            this.pillsContainer = document.querySelector(".selected-pills");
            console.log(
                "Pills container found outside main container:",
                !!this.pillsContainer
            );
        }

        this.selectedValues = new Set();

        console.log("Elements found:", {
            searchInput: !!this.searchInput,
            dropdown: !!this.dropdown,
            optionsContainer: !!this.optionsContainer,
            pillsContainer: !!this.pillsContainer,
        });

        this.init();
    }

    init() {
        const requiredElements = {
            searchInput: !!this.searchInput,
            dropdown: !!this.dropdown,
            optionsContainer: !!this.optionsContainer,
            pillsContainer: !!this.pillsContainer,
        };

        console.log("Required elements check:", requiredElements);

        if (
            !this.searchInput ||
            !this.dropdown ||
            !this.optionsContainer ||
            !this.pillsContainer
        ) {
            console.error(
                "Required elements not found in multiSelect container:",
                requiredElements
            );
            return;
        }

        console.log("MultiSelectDropdown initialized successfully");

        // Toggle dropdown
        this.searchInput.addEventListener("click", () => {
            console.log("Search input clicked, toggling dropdown");
            this.toggleDropdown();
        });

        // Also toggle on focus
        this.searchInput.addEventListener("focus", () => {
            console.log("Search input focused, opening dropdown");
            this.openDropdown();
        });

        // Filter options
        this.searchInput.addEventListener("input", (e) =>
            this.filterOptions(e.target.value)
        );

        // Close dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!this.container.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Handle option selection
        this.optionsContainer.addEventListener("change", (e) => {
            if (e.target.type === "checkbox") {
                this.handleOptionSelect(e.target);
            }
        });

        // Prevent dropdown from closing when clicking inside
        this.dropdown.addEventListener("click", (e) => e.stopPropagation());
    }

    toggleDropdown() {
        const isHidden = this.dropdown.classList.contains("hidden");
        console.log("Toggling dropdown, currently hidden:", isHidden);
        if (isHidden) {
            this.openDropdown();
        } else {
            this.closeDropdown();
        }
    }

    openDropdown() {
        console.log("Opening dropdown");
        this.dropdown.classList.remove("hidden");
        this.dropdown.classList.add("dropdown-enter-active");
        this.searchInput.focus();
    }

    closeDropdown() {
        console.log("Closing dropdown");
        this.dropdown.classList.add("hidden");
        this.dropdown.classList.remove("dropdown-enter-active");
        this.searchInput.value = "";
        this.filterOptions("");
    }

    filterOptions(searchTerm) {
        const options =
            this.optionsContainer.querySelectorAll(".location-option");
        let visibleCount = 0;

        options.forEach((option) => {
            const text = option.textContent.toLowerCase();
            const matches =
                searchTerm === "" || text.includes(searchTerm.toLowerCase());

            if (matches) {
                option.style.display = "flex";
                visibleCount++;
            } else {
                option.style.display = "none";
            }
        });
    }

    handleOptionSelect(checkbox) {
        const value = checkbox.value;

        // GUARD: Prevent duplicate calls by tracking last processed state
        const lastState = this.lastProcessedStates || new Map();
        if (!this.lastProcessedStates) {
            this.lastProcessedStates = lastState;
        }

        const stateKey = `${value}_${checkbox.checked}`;
        const now = Date.now();
        const lastProcessed = lastState.get(stateKey);

        // If same state was processed within last 100ms, ignore duplicate
        if (lastProcessed && now - lastProcessed < 100) {
            return;
        }

        lastState.set(stateKey, now);

        // Get the location name from the label structure
        const label = checkbox.closest("label");
        const nameDiv = label.querySelector(".font-medium");
        const text = nameDiv ? nameDiv.textContent.trim() : `Location ${value}`;

        // Find the option container for this checkbox
        const optionContainer = checkbox.closest(".location-option");

        if (checkbox.checked) {
            // SELECTING the location
            console.log("Adding location:", value);
            this.selectedValues.add(value);
            this.addPill(value, text);
            this.showLocationForm(value);
        } else {
            // DESELECTING the location
            console.log("Removing location:", value);
            this.selectedValues.delete(value);
            this.removePill(value);
            this.hideLocationForm(value);

            // IMMEDIATE PROTECTIVE FIX: Ensure the option remains visible
            this.ensureOptionVisible(value);

            // ADDITIONAL PROTECTION: Re-ensure visibility after small delay
            setTimeout(() => {
                this.ensureOptionVisible(value);
            }, 5);

            // FINAL PROTECTION: Re-ensure visibility after longer delay
            setTimeout(() => {
                this.ensureOptionVisible(value);
            }, 50);
        }

        // Check option container state after operations
        setTimeout(() => {
            console.log("Option container after:", {
                display: optionContainer
                    ? optionContainer.style.display
                    : "not found",
                visible: optionContainer
                    ? optionContainer.offsetHeight > 0
                    : false,
                inDOM: optionContainer
                    ? document.contains(optionContainer)
                    : false,
            });
        }, 10);

        this.updateSearchPlaceholder();

        // Trigger updateLocationDisplay if it exists
        if (typeof window.updateLocationDisplay === "function") {
            console.log("Triggering updateLocationDisplay");
            window.updateLocationDisplay();
        }
    }

    addPill(value, text) {
        console.log("Adding pill:", {
            value,
            text,
            pillsContainer: !!this.pillsContainer,
        });

        if (!this.pillsContainer) {
            console.error("Pills container not found, cannot add pill");
            return;
        }

        // Remove the placeholder text if it exists
        const placeholder = this.pillsContainer.querySelector(".text-gray-400");
        if (placeholder) {
            console.log("Removing placeholder");
            placeholder.remove();
        }

        // Check if pill already exists
        const existingPill = this.pillsContainer.querySelector(
            `[data-value="${value}"]`
        );
        if (existingPill) {
            console.log("Pill already exists for value:", value);
            return;
        }

        const pill = document.createElement("div");
        pill.className = "location-pill";
        pill.dataset.value = value;
        pill.style.cssText = `
            display: inline-flex;
            align-items: center;
            background-color: #3B82F7;
            color: white;
            padding: 0.375rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 500;
            margin: 0.125rem;
            transition: all 0.2s ease-in-out;
        `;
        pill.innerHTML = `
            <span style="margin-right: 0.5rem;">${text}</span>
            <div class="remove-btn" style="
                padding: 0.125rem;
                border-radius: 50%;
                background-color: rgba(255, 255, 255, 0.2);
                cursor: pointer;
                transition: background-color 0.2s ease-in-out;
                display: flex;
                align-items: center;
                justify-content: center;
            " onclick="window.multiSelectDropdown.removePillByValue('${value}')">
                <svg style="width: 12px; height: 12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </div>
        `;

        this.pillsContainer.appendChild(pill);
    }

    removePill(value) {
        if (!this.pillsContainer) {
            console.error("Pills container not found, cannot remove pill");
            return;
        }

        // Check option state before removing pill
        const optionContainer = this.optionsContainer
            .querySelector(`input[value="${value}"]`)
            ?.closest(".location-option");

        const pill = this.pillsContainer.querySelector(
            `[data-value="${value}"]`
        );
        if (pill) {
            pill.remove();
        } else {
            console.warn("Pill not found for value:", value);
        }

        // Add placeholder back if no pills remain
        if (this.pillsContainer.children.length === 0) {
            const placeholder = document.createElement("span");
            placeholder.className = "text-gray-400 text-sm italic";
            placeholder.textContent = "No locations selected";
            this.pillsContainer.appendChild(placeholder);
        }
    }

    // Helper method to clear all pills and reset to placeholder
    clearAllPills() {
        if (!this.pillsContainer) {
            return;
        }

        this.pillsContainer.innerHTML = "";
        const placeholder = document.createElement("span");
        placeholder.className = "text-gray-400 text-sm italic";
        placeholder.textContent = "No locations selected";
        this.pillsContainer.appendChild(placeholder);
    }

    removePillByValue(value) {
        // Find the corresponding checkbox and its container
        const checkbox = this.optionsContainer.querySelector(
            `input[value="${value}"]`
        );
        const locationOption = checkbox
            ? checkbox.closest(".location-option")
            : null;

        if (checkbox && locationOption) {
            if (checkbox.checked) {
                checkbox.checked = false;
                // Manually trigger the selection logic
                this.handleOptionSelect(checkbox);

                // // Check the state after handling
                // setTimeout(() => {
                //     console.log('Location option display after:', locationOption.style.display);
                //     console.log('Location option classes after:', locationOption.className);
                //     console.log('  Location option is in DOM:', document.contains(locationOption));
                // }, 100);
            } else {
                console.warn(
                    "Checkbox was already unchecked for value:",
                    value
                );
            }
        } else {
            console.error(
                "Checkbox or location option not found for value:",
                value
            );
        }
    }

    // Force show all options - debug method
    showAllOptions() {
        const options =
            this.optionsContainer.querySelectorAll(".location-option");
        options.forEach((option) => {
            option.style.display = "flex";
        });
    }

    // Protective method to ensure an option is visible after deselection
    ensureOptionVisible(value) {
        const option = this.optionsContainer
            .querySelector(`input[value="${value}"]`)
            ?.closest(".location-option");
        if (option) {
            option.style.display = "flex";
        } else {
            console.error(
                "Could not find option to make visible for value:",
                value
            );
        }
    }

    updateSearchPlaceholder() {
        if (!this.searchInput) {
            return;
        }

        const count = this.selectedValues.size;
        if (count === 0) {
            this.searchInput.placeholder = "Search or select locations...";
        } else {
            this.searchInput.placeholder = `${count} location(s) selected`;
        }
    }

    showLocationForm(locationId) {
        const form = document.querySelector(
            `[data-location-id="${locationId}"]`
        );
        if (form) {
            form.style.display = "block";
            // Load records for this location
            if (typeof window.loadRecordsForLocation === "function") {
                window.loadRecordsForLocation(locationId);
            }
        }
    }

    hideLocationForm(locationId) {
        // Check option state before hiding form
        const optionContainer = this.optionsContainer
            .querySelector(`input[value="${locationId}"]`)
            ?.closest(".location-option");
        const form = document.querySelector(
            `[data-location-id="${locationId}"]`
        );
        if (form) {
            form.style.display = "none";
            console.log(
                "Location form hidden successfully for location:",
                locationId
            );
        } else {
            console.warn("Location form not found for ID:", locationId);
        }

        // // Check option state after hiding form
        // setTimeout(() => {
        //     console.log('Option container state after hiding form:', {
        //         display: optionContainer ? optionContainer.style.display : 'not found',
        //         visible: optionContainer ? optionContainer.offsetHeight > 0 : false,
        //         inDOM: optionContainer ? document.contains(optionContainer) : false
        //     });
        // }, 10);

        // console.log('=== hideLocationForm END ===');
    }

    getSelectedValues() {
        // Just return the selected values without saving to localStorage
        // Saving will be handled centrally in updateLocationDisplay
        return Array.from(this.selectedValues);
    }

    setSelectedValues(values) {
        // Clear current selections
        this.selectedValues.clear();
        this.pillsContainer.innerHTML = "";

        // Uncheck all checkboxes
        const checkboxes = this.optionsContainer.querySelectorAll(
            'input[type="checkbox"]'
        );
        checkboxes.forEach((cb) => (cb.checked = false));

        // Set new selections
        values.forEach((value) => {
            const checkbox = this.optionsContainer.querySelector(
                `input[value="${value}"]`
            );
            if (checkbox) {
                checkbox.checked = true;
                this.handleOptionSelect(checkbox);
            }
        });

        // Don't save here - let updateLocationDisplay handle saving centrally
    }

    selectAll() {
        console.log("Selecting all locations");
        const checkboxes = this.optionsContainer.querySelectorAll(
            'input[type="checkbox"]'
        );
        checkboxes.forEach((checkbox) => {
            if (!checkbox.checked) {
                checkbox.checked = true;
                this.handleOptionSelect(checkbox);
            }
        });
    }

    deselectAll() {
        console.log("Deselecting all locations");

        // Clear all selected values
        this.selectedValues.clear();

        // Clear all pills at once
        this.clearAllPills();

        // Uncheck all checkboxes
        const checkboxes = this.optionsContainer.querySelectorAll(
            'input[type="checkbox"]'
        );
        checkboxes.forEach((checkbox) => {
            if (checkbox.checked) {
                checkbox.checked = false;
                // Hide the form for this location
                const value = checkbox.value;
                this.hideLocationForm(value);
            }
        });

        // Update search placeholder
        this.updateSearchPlaceholder();

        // Trigger updateLocationDisplay if it exists
        if (typeof window.updateLocationDisplay === "function") {
            console.log("Triggering updateLocationDisplay after deselect all");
            window.updateLocationDisplay();
        }
    }
}

// Make it globally available
window.MultiSelectDropdown = MultiSelectDropdown;

// Global debug function
window.debugDropdown = function () {
    if (window.multiSelectDropdown) {
        window.multiSelectDropdown.debugState();
    } else {
        console.log("MultiSelectDropdown not initialized");
    }
};

// Global function to show all options
window.showAllOptions = function () {
    if (window.multiSelectDropdown) {
        window.multiSelectDropdown.showAllOptions();
    } else {
        console.log("MultiSelectDropdown not initialized");
    }
};

// Make the function globally available so it can be called from the window script
window.loadRecordsForLocation = loadRecordsForLocation;

// Store the latest calculate response for each location
const latestCalculateResponses = {};
const latestMultiCalculateResponses = {};
window.latestMultiCalculateResponses = latestMultiCalculateResponses;
async function loadShiftTypes() {
    try {
        shiftTypes = await apiService.getShiftTypes();
        window.shiftTypes = shiftTypes; // Fetch shift types from the API
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
function renderLocationDropdown(
    locations,
    selectedLocationIds,
    allLocationData,
    selectedColumnIds
) {
    const container = document.getElementById("locationDropdownText");
    container.innerHTML = "";

    locations.forEach((loc) => {
        const box = document.createElement("span");
        box.className =
            "location-label inline-block cursor-pointer px-3 py-1 rounded border text-xs font-semibold box-border transition duration-300 " +
            (selectedLocationIds.has(String(loc.id))
                ? "bg-[#337ab7] text-white border-[#337ab7]"
                : "bg-gray-300 opacity-50 text-gray-700 border-gray-300") +
            " hover:border-blue-500 hover:shadow-md hover:shadow-blue-500 hover:bg-blue-400 hover:text-white";
        box.textContent = loc.name;
        box.style.userSelect = "none";

        box.addEventListener("click", async () => {
            // Check if records exist for this location
            if (!records[loc.id] || records[loc.id].length === 0) {
                showToast(
                    `No records found for location "${loc.name}". Please add shifts before selecting.`,
                    "error"
                );
                return; // Prevent selection
            }

            if (selectedLocationIds.has(String(loc.id))) {
                selectedLocationIds.delete(String(loc.id));
            } else {
                selectedLocationIds.add(String(loc.id));
                box.classList.add("opacity-50", "pointer-events-none"); // Show loading state

                // If data not loaded, fetch and store in allLocationData[loc.id]
                if (!allLocationData[String(loc.id)]) {
                    // Prepare mappedShifts for this location
                    const mappedShifts = records[loc.id].map((rec) => {
                        const shiftTypeObj = shiftTypes.find(
                            (st) =>
                                st.name === rec.shiftType ||
                                st.id === rec.shiftType
                        );
                        return {
                            shift_type_id: shiftTypeObj
                                ? shiftTypeObj.id
                                : rec.shiftType,
                            day: rec.day,
                            from: rec.from,
                            to: rec.to,
                            employees: parseInt(rec.employees, 10),
                            date_range: rec.dateRange || rec.date_range,
                        };
                    });
                    const response = await apiService.calculateReview({
                        location_id: loc.id,
                        shifts: mappedShifts,
                    });
                    allLocationData[String(loc.id)] = response.data;
                }
                box.classList.remove("opacity-50", "pointer-events-none");
            }
            //handle no data

            // --- FIX: Handle empty selection ---
            if (selectedLocationIds.size === 0) {
                populatePreviewTable([], [], selectedColumnIds);
            } else {
                // Combine data for all selected locations
                const combinedData = [];
                selectedLocationIds.forEach((id) => {
                    if (allLocationData[id]) {
                        combinedData.push(
                            ...allLocationData[id].timesheet_data
                        );
                    }
                });
                // Use the headings from the first selected location
                const firstSelectedId = [...selectedLocationIds][0];
                const headings =
                    allLocationData[firstSelectedId]?.timesheet_headings || [];
                populatePreviewTable(headings, combinedData, selectedColumnIds);
            }
            // Re-render pills to update their checked/unchecked state
            renderLocationDropdown(
                locations,
                selectedLocationIds,
                allLocationData,
                selectedColumnIds
            );
        });

        container.appendChild(box);
    });
}

window.renderColumnDropdown = function renderColumnDropdown(
    headings,
    selectedColumnIds,
    coreColumns,
    previewData
) {
    // Uncheck "Date Range" and "Week Starting" by default
    selectedColumnIds.delete("date_range");
    selectedColumnIds.delete("week_starting");
    // Use the text container as the main selector area
    const container = document.getElementById("columnDropdownText");
    container.innerHTML = "";

    // Container for the pills/boxes
    const boxContainer = document.createElement("div");
    boxContainer.className = "flex flex-wrap gap-2 p-2";

    headings.forEach((heading, idx) => {
        const colId = heading.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const isCore = coreColumns.includes(colId);

        // Create the pill/box
        const box = document.createElement("span");
        box.className =
            "column-label inline-block cursor-pointer px-3 py-1 rounded border text-xs font-semibold box-border transition duration-300 " +
            (selectedColumnIds.has(colId)
                ? "bg-[#337ab7] text-white border-[#337ab7]"
                : "bg-gray-300 opacity-50 text-gray-700 border-gray-300") +
            " hover:border-blue-500 hover:shadow-md hover:shadow-blue-500 hover:bg-blue-400 hover:text-white";

        box.textContent = heading;
        box.style.userSelect = "none";
        if (isCore) {
            box.style.opacity = "0.7";
            box.style.cursor = "not-allowed";
        }

        box.addEventListener("click", () => {
            if (isCore) return;
            if (selectedColumnIds.has(colId)) {
                selectedColumnIds.delete(colId);
                box.className =
                    "column-label inline-block cursor-pointer px-3 py-1 rounded border text-xs font-semibold transition duration-200 bg-gray-300 opacity-50 text-gray-700 border-gray-300";
            } else {
                selectedColumnIds.add(colId);
                box.className =
                    "column-label inline-block cursor-pointer px-3 py-1 rounded border text-xs font-semibold transition duration-200 bg-[#337ab7] text-white border-[#337ab7]";
            }
            // No need to update dropdown text, just re-render table
            populatePreviewTable(headings, previewData, selectedColumnIds);
        });

        boxContainer.appendChild(box);
    });

    container.appendChild(boxContainer);
};

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
        saveButton.replaceWith(saveButton.cloneNode(true)); // Remove all listeners
        const newSaveButton = document.getElementById(`saveBtn_${location.id}`);
        console.log(`Initializing save button for location ${location.id}`);
        if (newSaveButton) {
            newSaveButton.addEventListener("click", function () {
                console.log(`Save button clicked for location: ${location.id}`);
                renderTable(location.id);
                handleSaveButtonClick(location.id);
            });
        }

        const reviewButton = document.getElementById(
            `reviewTableBtn_${location.id}`
        );
        console.log("kakakkkakakakakkakakak", reviewButton);
        if (reviewButton) {
            reviewButton.addEventListener("click", function () {
                console.log("review button clicked");
                renderTable(location.id);
                // console.log("Fetching locations with shift data...");
                // updateAvailableLocations();
                locations.push(location.id);

                handleExportButtonClick(location.id);
                // updateAvailableLocations();
                // getLocationsWithShiftData();
            });
        }
    });
}

// Normalize function for headings
function normalizeHeading(h) {
    return h.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

window.renderExportButton = function renderExportButton(locationId) {
    console.log("export button renderes");
    // Remove any existing export button for this location
    const oldExportBtn = document.getElementById(
        `exportTimesheetBtn_${locationId}`
    );
    if (oldExportBtn) oldExportBtn.remove();
    console.log(`Rendering export button for location: ${locationId}`);

    // Create the export button
    const exportBtn = document.createElement("button");
    exportBtn.id = `exportTimesheetBtn_${locationId}`;
    exportBtn.type = "button";
    exportBtn.className =
        "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow mt-4";
    exportBtn.innerHTML = `Export to Excel <i class="fa-solid fa-file-arrow-down ml-2"></i>`;

    document.getElementById("exportBTN").appendChild(exportBtn);

    // Add export logic
    exportBtn.addEventListener("click", async function () {
        // Example inside your export logic:
        let exportData;
        let isMultiLocation = false;
        console.log(
            latestCalculateResponses[locationId],
            locationId,
            "dadasfafafd"
        );

        // Check if latestMultiCalculateResponses has data
        if (
            window.latestMultiCalculateResponses &&
            window.latestMultiCalculateResponses.timesheet_data &&
            Array.isArray(
                window.latestMultiCalculateResponses.timesheet_data
            ) &&
            window.latestMultiCalculateResponses.timesheet_data.length > 0
        ) {
            exportData = window.latestMultiCalculateResponses;
            isMultiLocation = true;
        } else {
            // Fallback to single location
            console.log(latestCalculateResponses[locationId]);
            exportData = latestCalculateResponses[locationId];
        }

        if (!exportData) {
            showToast("No data to export. Please calculate first.", "error");
            return;
        }
        exportBtn.disabled = true;
        exportBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Exporting...`;
        console.log("Exporting data for location:", locationId, exportData);
        // Get the DataTable instance
        // const table = $("#previewTable").DataTable();

        // // Get all rows in the current order (after sorting, filtering, etc.)
        // const sortedData = table
        //     .rows({ order: "applied", search: "applied" })
        //     .data()
        //     .toArray();

        // Get the export mode from the radio buttons (if present)
        let perLocationTabs = false;
        const exportModeRadio = document.querySelector(
            'input[name="previewLocationExportMode"]:checked'
        );
        if (exportModeRadio) {
            perLocationTabs = exportModeRadio.value === "separate";
        }
        // Get the currently visible columns (from the preview table)
        // Get DataTable instance
        const table = $("#previewTable").DataTable();

        // Get all rows in the current order (after sorting, filtering, etc.)
        const sortedData = table
            .rows({ order: "applied", search: "applied" })
            .data()
            .toArray();

        // Get the full headings from the latest calculate response
        const allHeadings = exportData?.timesheet_headings || [];
        console.log("all headings", allHeadings);
        const selectedColumnIds = window.latestSelectedColumnIds; // Make sure you set this when rendering the table
        // Get the visible columns as per the dropdown
        const visibleColumns = allHeadings.filter((h) =>
            selectedColumnIds.has(h.toLowerCase().replace(/[^a-z0-9]/g, "_"))
        );

        // Build export rows using sortedData and visibleColumns
        const exportRows = sortedData.map((row) =>
            visibleColumns.map((h) => {
                const idx = visibleColumns.indexOf(h);
                return row[idx];
            })
        );
        const hiddenColumns = allHeadings.filter(
            (h) => !visibleColumns.includes(h)
        );

        console.log("the payload:", {
            data: exportRows,
            headings: visibleColumns,
            hiddenColumns: hiddenColumns,
            totals: exportData?.totals || [],
            per_location_tabs: perLocationTabs,
        });

        // Prepare payload
        const payload = {
            data: exportRows,
            headings: visibleColumns,
            hiddenColumns: hiddenColumns,
            totals: exportData?.totals || [],
            per_location_tabs: perLocationTabs, // from radio button
        };

        try {
            const res = await apiService.exportReview(payload);
            if (res.data.type === "application/json") {
                // Read the error message from the blob
                const reader = new FileReader();
                reader.onload = function () {
                    const errorJson = JSON.parse(reader.result);
                    showToast(errorJson.error || "Export failed.", "error");
                    console.error("Export error:", errorJson);
                };
                reader.readAsText(res.data);
                exportBtn.disabled = false;
                exportBtn.innerHTML = `Export to Excel <i class="fa-solid fa-file-arrow-down ml-2"></i>`;
                return;
            }
            if (res.data && res.data.success && res.data.download_url) {
                console.log("Export successful:", res.data);
                window.open(res.data.download_url, "_blank");
                showToast("Export successful!", "success");
            } else {
                console.error("Export failed:", res.data);
                showToast("Export failed.", "error");
            }
        } catch (e) {
            console.error("Export error:", e);
            showToast("Export failed.", "error");
        } finally {
            exportBtn.disabled = false;
            exportBtn.innerHTML = `Export to Excel <i class="fa-solid fa-file-arrow-down ml-2"></i>`;
        }
    });
    console.log("Export button rendered for location:", locationId);
};

function handleExportButtonClick(locationId) {
    const reviewBtn = document.getElementById(`reviewTableBtn_${locationId}`);
    const btnSpinner = reviewBtn.querySelector(".review-btn-spinner");
    console.log(btnSpinner);

    console.log(`Export button clicked for location: ${locationId}`);
    btnSpinner.classList.remove("hidden");

    // Validate records for the location
    const { duplicates, defaultShiftTypeRecords } = validateRecords(locationId);
    if (duplicates.length > 0) {
        btnSpinner.classList.add("hidden");
        highlightDuplicateRows(locationId, duplicates);
        showToast(
            "Duplicate records found. Please resolve them before saving.",
            "error"
        );

        return;
    }

    if (defaultShiftTypeRecords.length > 0) {
        btnSpinner.classList.add("hidden");
        highlightDuplicateRows(locationId, defaultShiftTypeRecords);
        showToast(
            "Records with the default shift type are not allowed. Please update them.",
            "error"
        );

        return;
    } else {
        showToast(
            "No duplicates found. Proceeding to review table.",
            "success"
        );
    }

    // Get all selected locations from your main multi-select
    const allSelectedLocationIds = window.multiSelectDropdown
        ? window.multiSelectDropdown.getSelectedValues()
        : [];

    // Set up the selectedLocationIds set for the preview modal
    // Only the locationId clicked is checked by default
    const selectedLocationIds = new Set([String(locationId)]);
    window.allLocationData = {};
    const allLocationData = window.allLocationData;

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
            allLocationData[locationId] = response.data;

            latestCalculateResponses[locationId] = response.data;
            console.log(latestCalculateResponses[locationId]);
            console.log("API response from calculateReview:", response);
            // Handle the API response as needed

            const previewHeadings = response.data.timesheet_headings;
            const previewData = response.data.timesheet_data;

            // By default, select all columns
            const selectedColumnIds = new Set(
                previewHeadings.map((h) =>
                    h.toLowerCase().replace(/[^a-z0-9]/g, "_")
                )
            );
            console.log(locationId, "before going in showPreview");
            btnSpinner.classList.add("hidden");
            console.log(selectedLocationIds);
            console.log(allSelectedLocationIds);

            showPreviewTableModal({
                headings: previewHeadings,
                data: previewData,
                selectedColumnIds,
                totals: response.data.totals,
                exportId: locationId,
                allSelectedLocationIds, // pass all selected locations for pills
                selectedLocationIds, // only the reviewed location checked
                allLocationData,
            });
        })
        .catch((error) => {
            console.error("API error from calculateReview:", error);
            showToast("Error when calculating.", "error");
        });
}

// function roundMinutes(timeStr) {
//     if (!timeStr) return timeStr;
//     let [h, m] = timeStr.split(":").map(Number);
//     if (m === 1) m = 0;
//     if (m === 59) {
//         m = 0;
//         h = (h + 1) % 24; // increment hour, wrap to 0 if 24
//     }
//     return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
// }

function handleSaveButtonClick(locationId, silent = false, silent2 = false) {
    return new Promise((resolve) => {
        console.log(`Save button clicked for location: ${locationId}`);

        const saveBtn = document.getElementById(`saveBtn_${locationId}`);
        const btnText = saveBtn.querySelector(".save-btn-text");
        const btnSpinner = saveBtn.querySelector(".save-btn-spinner");
        const btnCheck = saveBtn.querySelector(".save-btn-check");
        const totalsDisplay = document.getElementById(
            `totalsDisplay_${locationId}`
        );

        // Show spinner, hide text and check
        btnText.classList.add("hidden");
        btnSpinner.classList.remove("hidden");
        btnCheck.classList.add("hidden");
        if (records[locationId].length === 0) {
            if (!silent2) {
                showToast("No records to save.", "error");
            }

            totalsDisplay.innerHTML = `
    `;

            btnSpinner.classList.add("hidden");
            btnText.classList.remove("hidden");
            resolve(true);
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

            resolve(true);
            return;
        } else {
            if (!silent2)
                showToast(
                    "No duplicates found. Proceeding to save.",
                    "success"
                );
        }

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
                    latestCalculateResponses[locationId] = response.data; // Store for export
                    console.log(
                        "Latest calculate response stored for location:",
                        locationId,
                        "latestCalculateResponses:",
                        latestCalculateResponses
                    );
                    // Save shift data to database after successful calculation
                    if (typeof window.saveShiftDataToDatabase === "function") {
                        window.saveShiftDataToDatabase(
                            locationId,
                            records[locationId]
                        );
                    }

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
       <strong> Total Billable:</strong> $${Number(
           totals.billable
       ).toLocaleString(undefined, {
           minimumFractionDigits: 2,
           maximumFractionDigits: 2,
       })}
    `;
                    }
                    btnSpinner.classList.add("hidden");
                    btnCheck.classList.remove("hidden");
                    setTimeout(() => {
                        btnCheck.classList.add("hidden");
                        btnText.classList.remove("hidden");
                    }, 1500);
                    if (!silent) toggleFormWithoutSaving(locationId);
                    resolve(true);
                    // Show check for 1.5 seconds
                    // if (!silent) {
                    //     // Show the preview modal ONLY if not silent
                    //     document
                    //         .getElementById("previewModal")
                    //         .classList.remove("hidden");
                    //     document.body.classList.add("overflow-hidden");
                    //     console.log("Preview modal opened");
                    // }
                    // // Render the export button

                    // // Store data locally
                    // const previewHeadings = response.data.timesheet_headings;
                    // const previewData = response.data.timesheet_data;
                    // const coreColumns = [
                    //     "week_starting",
                    //     "shift_type",
                    //     "location",
                    // ]; // match backend keys

                    // // By default, select all columns
                    // const selectedColumnIds = new Set(
                    //     previewHeadings.map((h) =>
                    //         h.toLowerCase().replace(/[^a-z0-9]/g, "_")
                    //     )
                    // );

                    // // Render dropdown and table
                    // renderColumnDropdown(
                    //     previewHeadings,
                    //     selectedColumnIds,
                    //     coreColumns,
                    //     previewData
                    // );
                    // console.log(
                    //     "Column dropdown rendered with headings:",
                    //     previewHeadings,
                    //     "and selected columns:",
                    //     selectedColumnIds
                    // );
                    // populatePreviewTable(
                    //     previewHeadings,
                    //     previewData,
                    //     selectedColumnIds
                    // );
                    // renderExportButton(locationId);
                    // console.log(
                    //     "Preview table populated with headings:",
                    //     previewHeadings,
                    //     "and data:",
                    //     previewData
                    // );

                    // // Dropdown toggle logic (unchanged)
                    // document.getElementById("columnDropdownBtn").onclick =
                    //     function (e) {
                    //         e.stopPropagation();
                    //         document
                    //             .getElementById("columnDropdownMenu")
                    //             .classList.toggle("hidden");
                    //     };
                    // document.addEventListener("click", function (e) {
                    //     const menu =
                    //         document.getElementById("columnDropdownMenu");
                    //     const btn =
                    //         document.getElementById("columnDropdownBtn");
                    //     if (
                    //         !menu.contains(e.target) &&
                    //         !btn.contains(e.target)
                    //     ) {
                    //         menu.classList.add("hidden");
                    //     }
                    // });
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

window.adjustTableScrollY = function adjustTableScrollY() {
    const wrapper = document.getElementById("previewTableWrapper");
    if (!wrapper) return;
    // Calculate available height for the table body
    // Subtract some px for modal header/footer if needed
    const availableHeight = wrapper.clientHeight - 10; // adjust -10 as needed
    if ($.fn.DataTable.isDataTable("#previewTable")) {
        const dt = $("#previewTable").DataTable();
        dt.settings()[0].oScroll.sY = availableHeight + "px";
        dt.draw(false);
        dt.columns.adjust();
    }
};

window.populatePreviewTable = function populatePreviewTable(
    headings,
    data,
    selectedColumnIds
) {
    window.latestSelectedColumnIds = selectedColumnIds;
    // Destroy DataTable before clearing table
    const table = document.getElementById("previewTable");
    const previewContainer = table.parentElement; // The div containing the table

    // Remove any existing option div
    let optionDiv = document.getElementById("previewLocationOptionDiv");
    if (optionDiv) optionDiv.remove();
    console.log(document.getElementById("previewLocationOptionDiv"));

    // Destroy DataTable and clear table
    if ($.fn.DataTable.isDataTable("#previewTable")) {
        $("#previewTable").DataTable().destroy();
    }
    console.log(document.getElementById("previewLocationOptionDiv"));

    let thead = table.querySelector("thead");
    if (!thead) {
        thead = document.createElement("thead");
        table.appendChild(thead);
    }
    let tbody = table.querySelector("tbody");
    if (!tbody) {
        tbody = document.createElement("tbody");
        table.appendChild(tbody);
    }
    thead.innerHTML = "";
    tbody.innerHTML = "";

    // Use original headings to find location index
    const originalHeadings = window.originalPreviewHeadings || headings;
    const locationIndex = originalHeadings.findIndex(
        (h) => h.toLowerCase().replace(/[^a-z0-9]/g, "_") === "location"
    );
    let uniqueLocations = [];
    if (locationIndex !== -1) {
        uniqueLocations = [...new Set(data.map((row) => row[locationIndex]))];
    }
    console.log(uniqueLocations);

    // Only show the option if more than one location
    if (uniqueLocations.length > 1) {
        optionDiv = document.createElement("div");
        optionDiv.id = "previewLocationOptionDiv";
        optionDiv.className =
            "mb-4 p-3 border rounded bg-blue-50 flex gap-6 items-center";
        optionDiv.innerHTML = `
            <label class="flex items-center gap-2">
                <input type="radio" name="previewLocationExportMode" value="single" checked>
                <span>All in One Page</span>
            </label>
            <label class="flex items-center gap-2">
                <input type="radio" name="previewLocationExportMode" value="separate">
                <span>Separate Tabs by Location</span>
            </label>
            <span class="text-xs text-gray-500 ml-4">(This will affect the export format)</span>
        `;
        console.log(document.getElementById("previewLocationOptionDiv"));

        const placeholder = document.getElementById(
            "previewLocationOptionPlaceholder"
        );
        if (placeholder) {
            placeholder.innerHTML = ""; // Clear previous content
            placeholder.appendChild(optionDiv);
        }
        console.log(document.getElementById("previewLocationOptionDiv"));
    }
    console.log(document.getElementById("previewLocationOptionDiv"));

    // Only show columns that are selected
    const visibleColumns = headings.filter((h) =>
        selectedColumnIds.has(h.toLowerCase().replace(/[^a-z0-9]/g, "_"))
    );

    // const headingBreaks = {
    //     "Emp. Numb": "Emp.<wbr>Numb",
    //     "Shift Type": "Shift<wbr> Type",
    //     "Week Starting": "Week<wbr> Starting",
    //     "Date Range": "Date<wbr> Range",
    //     "Day (06–18)": "Day<wbr>(06–18)",
    //     "Night (18–06)": "Night<wbr>(18–06)",
    //     "Scheduled Hours": "Scheduled<wbr> Hours",
    //     "Scheduled Start": "Scheduled<wbr> Start",
    //     "Scheduled Finish": "Scheduled<wbr> Finish",
    //     "Client Day Rate": "Client<wbr> Day<wbr> Rate",
    //     "Client Night Rate": "Client<wbr> Night<wbr> Rate",
    //     "Client Sat Rate": "Client<wbr> Sat<wbr> Rate",
    //     "Client Sun Rate": "Client<wbr> Sun<wbr> Rate",
    //     "Client PH Rate": "Client<wbr> PH<wbr> Rate",
    //     "Client Billable": "Client<wbr> Billable",
    //     // Add more as needed
    // };

    // Build table header
    const trHead = document.createElement("tr");
    visibleColumns.forEach((heading) => {
        const th = document.createElement("th");
        th.innerHTML = heading; // Use breaks if defined
        th.className =
            "border border-gray-300 px-1 py-1 text-xs break-words w-[50px] text-center align-middle";
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    // // Build table body
    // if (!data || data.length === 0) {
    //     const tr = document.createElement("tr");
    //     const td = document.createElement("td");
    //     td.colSpan = visibleColumns.length;
    //     td.className =
    //         "border border-gray-300 px-1 py-1 text-xs break-all w-[90px] max-w-[90px] text-center align-middle";
    //     td.textContent = "No calculated data available";

    //     tr.appendChild(td);
    //     tbody.appendChild(tr);
    //     return;
    // }

    // Show "No data" if data is empty
    if (!data || data.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = visibleColumns.length || 1;
        td.className =
            "border border-gray-300 px-1 py-1 text-xs break-all w-[90px] max-w-[90px] text-center align-middle";
        td.textContent = "No data available";
        tr.appendChild(td);
        tbody.appendChild(tr);
        // Optionally, destroy DataTable if it exists
        if ($.fn.DataTable.isDataTable("#previewTable")) {
            $("#previewTable").DataTable().destroy();
        }
        return;
    }

    data.forEach((row) => {
        const tr = document.createElement("tr");

        // Highlight row if public_holiday is set and not empty/zero/"-"
        // Find the index of "Public Holiday" in visibleColumns and in headings
        const phIndex = headings.findIndex(
            (h) => h.toLowerCase().replace(/[^a-z0-9]/g, "_") === "ph"
        );
        const isPublicHoliday = phIndex !== -1 && Number(row[phIndex]) > 0;

        visibleColumns.forEach((heading) => {
            // Find the index of this heading in the headings array
            const idx = headings.indexOf(heading);
            let value = idx !== -1 ? row[idx] : "-";
            const td = document.createElement("td");
            td.className =
                "border border-gray-300 px-1 py-1 text-xs break-words  text-center align-middle";

            // Format hours columns
            const hourColumns = [
                "Scheduled Hours",
                "Day (0600–1800)",
                "Night (1800–0600)",
                "Saturday",
                "Sunday",
                "PH",
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
            // // Special formatting for Start Date
            // if (heading === "Start Date" && value && value !== "-") {
            //     const dateObj = new Date(value);
            //     const dayName = dateObj.toLocaleDateString("en-US", {
            //         weekday: "long",
            //     });
            //     value = isPublicHoliday
            //         ? `${value} (${dayName}) PH`
            //         : `${value} (${dayName})`;
            //     td.innerHTML = value; // Use innerHTML for <br>
            // } else {
            //     td.textContent = value;
            // }
            if (heading === "Date Range" && value && value !== "-") {
                // Insert <wbr> after 'to' for better wrapping
                // value = value.replace(/\s+to\s+/, " <wbr>to<wbr> ");
                td.innerHTML = value; // Use innerHTML to allow <wbr>
            } else if (heading === "Start Date" && value && value !== "-") {
                const dateObj = new Date(value);
                const dayName = dateObj.toLocaleDateString("en-US", {
                    weekday: "long",
                });
                value = isPublicHoliday
                    ? `${value} (${dayName})`
                    : `${value} (${dayName})`;
                td.innerHTML = value; // Use innerHTML for <br>
            } else {
                td.textContent = value;
            }
            tr.appendChild(td);
        });
        if (isPublicHoliday) {
            tr.style.backgroundColor = "#fffbe6";
        }
        tbody.appendChild(tr);
    });

    // (Re)initialize DataTable
    let dt = $("#previewTable").DataTable({
        paging: false,
        searching: true,
        autoWidth: false,
        ordering: true,
        scrollX: true,
        scrollY: "40vh",
        scrollCollapse: false,
        columnDefs: [{ targets: "_all" }],
    });

    dt.columns.adjust().draw(false);
    $(window).on("resize", function () {
        $($.fn.dataTable.tables(true)).DataTable().columns.adjust().draw(false);
    });
    // Add margin-bottom to the DataTables search bar
    // Find the filter container
    const $filter = $(".dataTables_filter");
    if ($filter.length && !$("#datatable-title").length) {
        // Create a flex wrapper div with three columns
        const $flexDiv = $(`
        <div class="w-full flex items-center mb-4" style="min-height:40px;">
            <div class="flex-1 flex items-center"></div>
            <div class="flex-1 text-center  text-2xl text-[#2679b5]" id="datatable-title">Preview Table</div>
            <div class="flex-1"></div>
        </div>
    `);

        // Move the search bar into the left column
        $flexDiv.children().eq(0).append($filter.contents());
        // Replace the filter's content with the flex container
        $filter.empty().append($flexDiv);
        // Remove float and align left for the search bar
        $filter.css({ float: "none", "text-align": "left", margin: 0 });
    }
};
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
        saveRecordsToStorage(locationId);
        updateAvailableLocations();
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
        if (rec.shiftType === "Default") {
            tr.classList.add("bg-green-100");
        }
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
            saveRecordsToStorage(locationId);

            updateAvailableLocations();
            // Optionally re-render the table to reflect changes
            renderTable(locationId);
        });
    });
}
function addRow(locationId, clickedRow) {
    // Get the `groupedId` of the clicked row to find its position in the `records` array
    const groupedId = clickedRow.dataset.id;
    const quotationId = window.quotationId;

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

    // Create the new record object with quotation and locations IDs
    const newRecords = selectedDays.map((day) => ({
        id: generateRecordId(), // Add the unique ID
        groupedId: recordId, // Use the same ID for grouping
        day,
        shiftType,
        from,
        to,
        employees,
        dateRange,
        quotationId: quotationId, // Add quotation ID
        locationId: locationId, // Add location ID
    }));

    // Insert the new records directly after the clicked record in the `records` array
    records[locationId].splice(recordIndex + 1, 0, ...newRecords);

    console.log(
        `Records after adding duplicate for quotation ${quotationId}, location ${locationId}:`,
        records[locationId]
    );

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
        onValueUpdate: function (selectedDates, dateStr, instance) {
            let [hour, minute] = dateStr.split(":").map(Number);

            if (hour === 0) {
                if (minute === 0) {
                    minute = 1;
                } else if (![1, 15, 30, 45].includes(minute)) {
                    if (minute < 8) minute = 1;
                    else if (minute < 23) minute = 15;
                    else if (minute < 38) minute = 30;
                    else if (minute < 52) minute = 45;
                    else minute = 1;
                }
            } else if (hour === 23) {
                if (![0, 15, 30, 45, 59].includes(minute)) {
                    if (minute < 8) minute = 0;
                    else if (minute < 23) minute = 15;
                    else if (minute < 38) minute = 30;
                    else if (minute < 52) minute = 45;
                    else minute = 0;
                }
            } else {
                if (![0, 15, 30, 45].includes(minute)) {
                    if (minute < 8) minute = 0;
                    else if (minute < 23) minute = 15;
                    else if (minute < 38) minute = 30;
                    else if (minute < 52) minute = 45;
                    else minute = 0;
                }
            }

            const newTime = `${hour.toString().padStart(2, "0")}:${minute
                .toString()
                .padStart(2, "0")}`;
            if (dateStr !== newTime) {
                instance.setDate(newTime, true, "H:i");
            }
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
    const quotationId = window.quotationId;

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
            existingRecord.locationId = locationId;
        } else {
            // Add a new record for the updated day
            records[locationId].push({
                groupedId: rowId,
                id: generateRecordId(),
                // Use the unique ID from the previous form data
                // Add the unique ID
                day,
                shiftType,
                from,
                to,
                employees,
                dateRange,
                quotationId,
                locationId,
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
        //save using quotation specific key
        saveRecordsToStorage(locationId);
        updateAvailableLocations();
        // localStorage.setItem(
        //     `records_${locationId}`,
        //     JSON.stringify(records[locationId])
        // );
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

// Update the DOMContentLoaded event to load quotation-specific records
// Update the DOMContentLoaded event to load quotation-specific records
// document.addEventListener("DOMContentLoaded", async function () {
//     console.log(
//         "HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH"
//     );
//     // Load step 2 options and then populate saved data
//     await loadShiftTypes();

//     // Load quotation-specific records for each location FIRST
//     locations.forEach((location) => {
//         const quotationId = window.quotationId;

//         // Load records from localStorage with quotation-specific key
//         const savedRecords = localStorage.getItem(
//             `quotation${quotationId}selectedlocation${location.id}Records`
//         );

//         if (savedRecords) {
//             try {
//                 const parsedRecords = JSON.parse(savedRecords);
//                 records[location.id] = parsedRecords;
//                 console.log(
//                     `Loaded ${parsedRecords.length} records for quotation ${quotationId}, location ${location.id}`
//                 );
//                 renderTable(location.id);
//             } catch (e) {
//                 console.error(
//                     `Error parsing saved records for quotation ${quotationId}, location ${location.id}:`,
//                     e
//                 );
//             }
//         }
//     });

//     loadStep2Options().then(() => {
//         locations.forEach((location) => {
//             const shiftTypesSelect = document.getElementById(
//                 `shiftTypes_${location.id}`
//             );
//             const dateRangeInput = document.getElementById(
//                 `dateRange_${location.id}`
//             );
//             const addressElement = document
//                 .querySelector(`#form_${location.id}`)
//                 .parentElement.querySelector("p");

//             // Retrieve saved data for the location from local storage
//             const savedData = localStorage.getItem(`location_${location.id}`);

//             if (savedData) {
//                 const { shiftTypes, dateRange } = JSON.parse(savedData);
//                 console.log("Saved Data for Location:", {
//                     shiftTypes,
//                     dateRange,
//                 });

//                 // Populate shift types
//                 if (
//                     Array.isArray(shiftTypes) &&
//                     shiftTypes.length > 0 &&
//                     shiftTypesSelect
//                 ) {
//                     // Iterate over the options in the select element
//                     Array.from(shiftTypesSelect.options).forEach((option) => {
//                         // Check if the option's text matches any of the saved shift types
//                         if (shiftTypes.includes(option.textContent)) {
//                             option.selected = true; // Mark the option as selected
//                         }
//                     });

//                     // Update the dropdown button text to reflect the selected options
//                     const selectedOptions = Array.from(
//                         shiftTypesSelect.selectedOptions
//                     ).map((option) => option.textContent);
//                     const dropdownButton =
//                         shiftTypesSelect.parentElement.querySelector(
//                             "button span"
//                         );
//                     if (dropdownButton) {
//                         dropdownButton.textContent =
//                             selectedOptions.length > 0
//                                 ? selectedOptions.join(", ")
//                                 : "Select Shift Types";
//                     }
//                 }
//                 console.log("Shift Types Select Element:", shiftTypesSelect);

//                 // Populate date range
//                 if (dateRange) {
//                     dateRangeInput.value = dateRange;
//                 }

//                 // Update the address line with the saved data
//                 addressElement.textContent = `${
//                     location.address
//                 } | Shift Types: ${shiftTypes.join(
//                     ", "
//                 )} | Date Range: ${dateRange}`;

//                 // remove hidden class from the check icon
//                 const checkIcon = document.getElementById(
//                     `checkIcon_${location.id}`
//                 );
//                 checkIcon.classList.remove("hidden");

//                 // Add logs between function calls to identify the error
//                 console.log("Calling showBatchForm...");
//                 showBatchForm(location.id);

//                 console.log("Calling populateBatchShiftTypes...");
//                 populateBatchShiftTypes(location.id);

//                 console.log("Calling initializeTimePickers...");
//                 initializeTimePickers(location.id);

//                 console.log("Calling initializeShiftTable...");
//                 initializeShiftTable(location.id);

//                 console.log("All functions executed successfully.");
//                 initializeSaveButtons();
//             }
//         });

//         // Call the function to initialize Save buttons
//         initializeSaveButtons();

//     });

//     // Other initialization logic (e.g., toggle form visibility)
//     // window.toggleForm = async function (locationId) {
//     //     const form = document.getElementById(`form_${locationId}`);
//     //     const arrow = document.getElementById(`arrow_${locationId}`);
//     //     renderTable(locationId); // Ensure the table is rendered before toggling

//     //     // Only try to collapse if currently open
//     //     if (!form.classList.contains("max-h-0")) {
//     //         // Try to save before collapsing
//     //         let saveSucceeded = await handleSaveButtonClick(locationId, true); // pass a flag for silent mode
//     //         if (!saveSucceeded) {
//     //             // If save failed, do not collapse
//     //             return;
//     //         }
//     //     }

//     //     // Update the arrow icon
//     //     if (form.classList.contains("max-h-0")) {
//     //         form.classList.remove("max-h-0");
//     //         form.classList.add("max-h-[1000px]");
//     //         arrow.innerHTML = '<i class="fas fa-chevron-up"></i>'; // Down arrow
//     //         form.classList.add("p-2");
//     //     } else {
//     //         form.classList.add("max-h-0");
//     //         form.classList.remove("max-h-[1000px]");
//     //         arrow.innerHTML = '<i class="fas fa-chevron-down"></i>'; // Up arrow
//     //         form.classList.remove("p-2");
//     //     }
//     // };

//     // Load saved selections from localStorage
//     const savedSelections = localStorage.getItem("selectedOptions");
//     if (savedSelections) {
//         selectedOptions = JSON.parse(savedSelections);
//         setSummary(); // Update the summary with the loaded selections
//     }

//     // Event listeners for shift operations
//     locations.forEach((location) => {
//         const addShiftBtn = document.getElementById(
//             `addShiftBtn_${location.id}`
//         );
//         if (addShiftBtn) {
//             addShiftBtn.addEventListener("click", function () {
//                 addShift(location.id);
//             });
//         }

//         const updateShiftBtn = document.getElementById(
//             `updateShiftBtn_${location.id}`
//         );
//         if (updateShiftBtn) {
//             updateShiftBtn.addEventListener("click", function () {
//                 updateShift(location.id);
//             });
//         }
//     });

//     // Add event listeners to all "Add Shift Type" buttons
//     const addShiftTypeButtons = document.querySelectorAll(
//         ".add-shift-type-btn"
//     );
//     console.log("initalizing add default button");
//     addShiftTypeButtons.forEach((button) => {
//         button.addEventListener("click", function () {
//             const locationId = button.getAttribute("data-location-id");
//             addDefaultShiftRow(locationId);
//         });
//     });

//     // Attach event listener to the Cancel button
//     const cancelButton = document.querySelector(
//         "#addShiftTypeModal .bg-gray-500"
//     );
//     if (cancelButton) {
//         cancelButton.addEventListener("click", function () {
//             closeAddShiftTypeModal();
//         });
//     }

//     // Filter event listeners
//     locations.forEach((location) => {
//         const filterDayDropdown = document.getElementById(
//             `filterDay_${location.id}`
//         );
//         const filterShiftTypeDropdown = document.getElementById(
//             `filterShiftType_${location.id}`
//         );

//         if (filterDayDropdown) {
//             filterDayDropdown.addEventListener("change", function (e) {
//                 filterDayValue = e.target.value;
//                 console.log(
//                     `Filter Day Value for Location ${location.id}:`,
//                     filterDayValue
//                 );
//                 renderTable(location.id); // Pass the location ID to render the correct table
//             });
//         }

//         if (filterShiftTypeDropdown) {
//             filterShiftTypeDropdown.addEventListener("change", function (e) {
//                 console.log("Filter Shift Type Dropdown Changed", e.target);
//                 const shiftName = getShiftTypeTextById(
//                     location.id,
//                     e.target.value
//                 );
//                 console.log("Shift Name:", shiftName);
//                 filterShiftTypeValue = shiftName;
//                 console.log(
//                     `Filter Shift Type Value for Location ${location.id}:`,
//                     filterShiftTypeValue
//                 );
//                 renderTable(location.id); // Pass the location ID to render the correct table
//             });
//         }
//     });

//     // Preview modal close button
//     const closeBtn = document.getElementById("closePreviewModal");
//     if (closeBtn) {
//         closeBtn.addEventListener("click", function () {
//             document.getElementById("previewModal").classList.add("hidden");
//             document.body.classList.remove("overflow-hidden");
//             const exportBtn = document.querySelector("#exportBTN button");
//             if (exportBtn) exportBtn.remove();
//         });
//     }

//     // Add Event Listeners for Modal Actions
//     locations.forEach((location) => {
//         const locationId = location.id;

//         // Close Button
//         const closeBtn = document.getElementById(
//             `closeBatchFormModal_${locationId}`
//         );
//         if (closeBtn) {
//             closeBtn.addEventListener("click", () =>
//                 hideBatchFormModal(locationId)
//             );
//         }

//         // Cancel Button
//         const cancelBtn = document.getElementById(
//             `cancelBatchFormBtn_${locationId}`
//         );
//         if (cancelBtn) {
//             cancelBtn.addEventListener("click", () =>
//                 hideBatchFormModal(locationId)
//             );
//         }

//         // Save Button (for now, just hide the modal)
//         const saveBtn = document.getElementById(
//             `saveBatchFormBtn_${locationId}`
//         );
//         if (saveBtn) {
//             saveBtn.addEventListener("click", () => {
//                 // Pass the previous data to saveBatchForm
//                 console.log("Previous Form Data:", previousFormData);
//                 saveBatchForm(location.id, previousFormData);
//             });
//         }
//     });

//     // Attach event listener to the Add button
//     const addButton = document.querySelector("#addShiftTypeModal .bg-blue-600");
//     if (addButton) {
//         addButton.addEventListener("click", function () {
//             addShiftType();
//         });
//     }

//     // Form submission handling
//     const step2Form = document.getElementById("step2Form");
//     if (step2Form) {
//         step2Form.addEventListener("submit", function (e) {
//             if (!validateStep2Form()) {
//                 e.preventDefault();
//                 return;
//             }

//             // Get the array of location objects
//             const selectedLocations = getSelectedLocations();

//             // Update the hidden input field with the selectedLocations array as JSON
//             const selectedLocationsInput = document.getElementById(
//                 "selectedLocationsInput"
//             );
//             selectedLocationsInput.value = JSON.stringify(selectedLocations);

//             showToast(
//                 "Step 2 validated! Proceeding to next step...",
//                 "success"
//             );
//         });
//     }

//     // Back button logic
//     const backBtn = document.getElementById("backBtn");
//     if (backBtn) {
//         backBtn.addEventListener("click", function (e) {
//             e.preventDefault();
//             window.location.href = "/dataentry";
//         });
//     }
// });

window.generateRecordId = function generateRecordId() {
    const quotationId = window.quotationId;
    return `quotation${quotationId}_record_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
};
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
    const quotationId = window.quotationId;

    // Define default values
    const defaultDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const defaultShiftType = "Default";
    const defaultDateRange = "25-1-1 to 25-1-30";
    const defaultFrom = "00:01";
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
        quotationId: quotationId, // Add quotationId to each record
        locationId: locationId, // Add locationId to each record
    }));

    // Add to the in-memory records array
    records[locationId].push(...newRecords);
    console.log("records after adding default shift row:", records[locationId]);

    // // Handle localStorage
    // const storageKey = `records_${locationId}`;
    // let storedRecords = [];
    // const existing = localStorage.getItem(storageKey);
    // if (existing) {
    //     try {
    //         storedRecords = JSON.parse(existing);
    //     } catch (e) {
    //         storedRecords = [];
    //     }
    // }
    // storedRecords.push(...newRecords);
    // saveRecordsToStorage(locationId);

    // Re-render the table to reflect the new record
    renderTable(locationId);
    // --- NEW: Switch the new row to edit mode ---
    // Find the row in the DOM by its groupedId (use the first day as reference)
    const tbody = document.querySelector(`#shiftTable_${locationId} tbody`);
    const newRow = tbody.querySelector(`tr[data-id="${recordId}"]`);
    if (newRow) {
        NewUpdateRow(locationId, newRow);
    }

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
            console.log("ddd");
            const dateRangeInput = document.getElementById(
                `dateRange_${location.id}`
            );
            // console.log(dateRangeInput);
            // // Add event listener for date range changes
            // dateRangeInput.addEventListener("change", () => {
            //     console.log(`Date range updated for location ${location.id}`);

            //     // Update the <p> tag beside the address
            //     const addressElement = document
            //         .querySelector(`#form_${location.id}`)
            //         .parentElement.querySelector("p");

            //     if (addressElement) {
            //         const selectedShiftTypes = Array.from(
            //             shiftTypesSelect.selectedOptions
            //         ).map((option) => option.textContent);

            //         // Update the <p> tag with the new date range and preserve the shift types
            //         addressElement.textContent = `${
            //             locations.find((loc) => loc.id === location.id).address
            //         } | Shift Types: ${selectedShiftTypes.join(
            //             ", "
            //         )} | Date Range: ${dateRangeInput.value}`;

            //         // Update localStorage with the new date range
            //         const savedData = localStorage.getItem(
            //             `location_${location.id}`
            //         );
            //         const locationData = savedData
            //             ? JSON.parse(savedData)
            //             : { shiftTypes: selectedShiftTypes, dateRange: "" };

            //         locationData.dateRange = dateRangeInput.value; // Update the date range
            //         localStorage.setItem(
            //             `location_${location.id}`,
            //             JSON.stringify(locationData)
            //         );
            //     }
            // });

            // // Clear existing options
            // shiftTypesSelect.innerHTML = "";

            // Populate the select element with shift types
            // shiftTypes.forEach((st) => {
            //     const opt = document.createElement("option");
            //     opt.value = st.id; // Use the shift type ID as the value
            //     opt.textContent = st.name; // Use the shift type name as the label
            //     shiftTypesSelect.appendChild(opt);
            // });
            console.log("debugging");

            // // Handle pre-selected options (if saved in localStorage)
            // const savedData = localStorage.getItem(`location_${location.id}`);
            // if (savedData) {
            //     const { shiftTypes: savedShiftTypes } = JSON.parse(savedData);

            //     // Pre-select saved shift types
            //     if (
            //         Array.isArray(savedShiftTypes) &&
            //         savedShiftTypes.length > 0
            //     ) {
            //         Array.from(shiftTypesSelect.options).forEach((option) => {
            //             if (savedShiftTypes.includes(option.textContent)) {
            //                 option.selected = true;
            //             }
            //         });
            //     }
            // }

            // Initialize custom dropdown behavior (if needed)
            // initializeCustomDropdown(location.id, shiftTypesSelect);
            // Initialize Flatpickr for the date range input
            // flatpickr(dateRangeInput, {
            //     mode: "range",
            //     dateFormat: "y-m-d",
            //     allowInput: true,
            //     onClose: function (selectedDates, dateStr, instance) {
            //         // Ensure at least two dates are selected
            //         if (selectedDates.length === 2) {
            //             const startDate = selectedDates[0];
            //             const endDate = selectedDates[1];

            //             // Calculate the difference in days
            //             const diffInDays = Math.ceil(
            //                 (endDate - startDate) / (1000 * 60 * 60 * 24)
            //             );

            //             // Check if the range is less than 7 days
            //             if (diffInDays < 7) {
            //                 showToast(
            //                     "The selected date range must be at least 7 days.",
            //                     "error"
            //                 );

            //                 // Clear the input field or reset the selection
            //                 instance.clear();
            //             }
            //         }
            //     },
            //     onChange: function (selectedDates, dateStr, instance) {
            //         console.log("Selected Date Range:", dateStr);
            //     },
            // });
            console.log("ww");
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

                console.log("Calling initializeShiftTable...");
                initializeShiftTable(location.id);

                console.log("All functions executed successfully.");
            });
        }
    });
}

// // Initialize export modal functionality
// function initializeExportModal() {
//     console.log("initializing export modal");
//     const exportBtn = document.getElementById("exportBtn");
//     const exportModal = document.getElementById("exportModal");
//     const closeExportModal = document.getElementById("closeExportModal");
//     const cancelExportBtn = document.getElementById("cancelExportBtn");
//     const processExportBtn = document.getElementById("processExportBtn");

//     // Export type radio buttons
//     const exportTypeRadios = document.querySelectorAll(
//         'input[name="exportType"]'
//     );
//     const allLocationsOptions = document.getElementById("allLocationsOptions");
//     const specificLocationsOptions = document.getElementById(
//         "specificLocationsOptions"
//     );

//     console.log("Initializing export modal...", {
//         exportBtn: !!exportBtn,
//         exportModal: !!exportModal,
//         closeExportModal: !!closeExportModal,
//         cancelExportBtn: !!cancelExportBtn,
//         processExportBtn: !!processExportBtn,
//     });

//     // Open export modal
//     if (exportBtn) {
//         exportBtn.addEventListener("click", function () {
//             console.log("Export button clicked - opening modal");
//             updateAvailableLocations();
//             exportModal.classList.remove("hidden");
//             document.body.style.overflow = "hidden"; // Prevent background scrolling
//         });
//     }

//     // Close export modal function
//     function closeModal() {
//         console.log("Closing export modal");
//         exportModal.classList.add("hidden");
//         document.body.style.overflow = "auto"; // Restore scrolling
//     }

//     // Close modal event listeners
//     if (closeExportModal) {
//         closeExportModal.addEventListener("click", closeModal);
//     }
//     if (cancelExportBtn) {
//         cancelExportBtn.addEventListener("click", closeModal);
//     }

//     // Close modal on backdrop click
//     if (exportModal) {
//         exportModal.addEventListener("click", function (e) {
//             if (e.target === exportModal) {
//                 closeModal();
//             }
//         });
//     }

//     // Close modal on ESC key
//     document.addEventListener("keydown", function (e) {
//         if (e.key === "Escape" && !exportModal.classList.contains("hidden")) {
//             closeModal();
//         }
//     });

//     // Handle export type change
//     exportTypeRadios.forEach((radio) => {
//         radio.addEventListener("change", function () {
//             console.log("Export type changed to:", this.value);
//             if (this.value === "all") {
//                 allLocationsOptions.classList.remove("hidden");
//                 specificLocationsOptions.classList.add("hidden");
//             } else {
//                 allLocationsOptions.classList.add("hidden");
//                 specificLocationsOptions.classList.remove("hidden");
//             }
//         });
//     });

//     // Process export (placeholder for now)
//     if (processExportBtn) {
//         processExportBtn.addEventListener("click", async function () {
//             console.log(
//                 "Process export clicked - functionality to be implemented"
//             );
//             alert("Export functionality will be implemented here!");
//             // 1. Determine export type and selected locations
//             const exportType = document.querySelector(
//                 'input[name="exportType"]:checked'
//             ).value;
//             let selectedLocations = [];

//             if (exportType === "specific") {
//                 // Get checked checkboxes in the specific locations section
//                 const checkedBoxes = document.querySelectorAll(
//                     '#availableLocationsContainer input[name="specificLocations"]:checked'
//                 );
//                 const allWithData = getLocationsWithShiftData();
//                 selectedLocations = Array.from(checkedBoxes)
//                     .map((cb) => {
//                         return allWithData.find(
//                             (loc) => String(loc.id) === String(cb.value)
//                         );
//                     })
//                     .filter(Boolean);
//             } else {
//                 // All locations with data
//                 selectedLocations = getLocationsWithShiftData();
//             }

//             if (selectedLocations.length === 0) {
//                 showToast(
//                     "Please select at least one location with shift data.",
//                     "error"
//                 );
//                 return;
//             }
//             // 2. Prepare data for calculateForMultipleLocations
//             const locationsData = selectedLocations.map((loc) => ({
//                 location_id: loc.id,
//                 shifts: loc.shiftData,
//             }));
//             console.log("Locations data prepared for export:", locationsData);

//             // 3. Call calculateForMultipleLocations to get export-ready data
//             showLoading();
//             const calcResult = await calculateForMultipleLocations(
//                 locationsData
//             );
//             hideLoading();

//             if (!calcResult || !calcResult.data || !calcResult.data.success) {
//                 showToast("Failed to prepare export data.", "error");
//                 return;
//             }

//             // 4. Prepare export payload
//             const exportMode =
//                 exportType === "all"
//                     ? document.querySelector(
//                           'input[name="allLocationsFormat"]:checked'
//                       ).value
//                     : "single"; // default to single for specific

//             const perLocationTabs = exportMode === "separate"; // "separate" means one tab per location

//             const payload = {
//                 data: calcResult.data.timesheet_data,
//                 headings: calcResult.data.timesheet_headings,
//                 totals: calcResult.data.totals,
//                 per_location_tabs: perLocationTabs,
//             };

//             // 5. Export and download
//             showLoading();
//             try {
//                 const res = await apiService.exportReview(payload);
//                 if (res.data && res.data.success && res.data.download_url) {
//                     window.open(res.data.download_url, "_blank");
//                     showToast("Export successful!", "success");
//                 } else {
//                     showToast("Export failed.", "error");
//                 }
//             } catch (e) {
//                 showToast("Export failed.", "error");
//             }
//             hideLoading();
//             // closeModal(); // Uncomment this when actual export is implemented
//         });
//     }
// }

// function updateAvailableLocations() {
//     const container = document.getElementById("availableLocationsContainer");
//     if (!container) {
//         console.log("Available locations container not found");
//         return;
//     }

//     container.innerHTML = "";

//     // Get locations that have saved shift data
//     const locationsWithData = getLocationsWithShiftData();
//     console.log("Locations with data:", locationsWithData);

//     if (locationsWithData.length === 0) {
//         container.innerHTML =
//             '<p class="text-sm text-gray-500">No locations with saved shift data found.</p>';
//         return;
//     }

//     locationsWithData.forEach((location) => {
//         const div = document.createElement("div");
//         div.className = "flex items-center justify-between p-2 border rounded";

//         // Use the record count from the enhanced getLocationsWithShiftData function
//         const recordCount = location.recordCount || 0;

//         div.innerHTML = `
//                     <label class="flex items-center flex-1">
//                         <input type="checkbox" name="specificLocations" value="${
//                             location.id
//                         }" class="mr-2">
//                         <div>
//                             <span class="font-medium">${location.name}</span>
//                             <div class="text-xs text-gray-500">${
//                                 location.address
//                             }</div>
//                         </div>
//                     </label>
//                     <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
//                         ${recordCount} shift${recordCount !== 1 ? "s" : ""}
//                     </span>
//                 `;

//         container.appendChild(div);
//     });
// }

// function getLocationsWithShiftData() {
//     const locationsWithData = [];

//     locations.forEach((location) => {
//         let recordCount = 0;
//         let hasData = false;
//         let dataSource = "";

//         // ONLY check localStorage - ignore window.records completely
//         const quotationId = window.quotationId;
//         const possibleKeys = [
//             `quotation_${quotationId}selectedlocations${location.id}Records`,
//             // `records_${location.id}`,
//             // `quotation${quotationId}selectedlocation${location.id}Records`,
//             // `quotation_${quotationId}selectedlocations${location.id}Records`, // Primary pattern
//             // `quotation_${quotationId}_selectedlocations${location.id}Records`,
//             // `quotation${quotationId}_selectedlocations${location.id}Records`
//         ];

//         // Check only localStorage keys
//         for (const key of possibleKeys) {
//             const savedRecords = localStorage.getItem(key);
//             if (savedRecords) {
//                 try {
//                     const parsedRecords = JSON.parse(savedRecords);
//                     console.log(`Checking localStorage key: ${key}`, {
//                         isArray: Array.isArray(parsedRecords),
//                         length: Array.isArray(parsedRecords)
//                             ? parsedRecords.length
//                             : "N/A",
//                         data: parsedRecords,
//                     });

//                     // Only include if localStorage has valid, non-empty array
//                     if (
//                         Array.isArray(parsedRecords) &&
//                         parsedRecords.length > 0
//                     ) {
//                         recordCount = parsedRecords.length;
//                         hasData = true;
//                         dataSource = `localStorage[${key}]`;
//                         shiftData = parsedRecords;
//                         console.log(
//                             `   Found ${recordCount} valid records for location ${location.name} in ${key} with these records ${shiftData}`
//                         );
//                         break; // Found valid data, stop checking other keys
//                     } else if (
//                         Array.isArray(parsedRecords) &&
//                         parsedRecords.length === 0
//                     ) {
//                         console.log(
//                             `  Found empty array for location ${location.name} in ${key} - excluding from export`
//                         );
//                         dataSource = `localStorage[${key}] (empty)`;
//                         // Continue checking other keys in case there's valid data elsewhere
//                     } else {
//                         console.log(
//                             `  Invalid data format for location ${location.name} in ${key}`
//                         );
//                     }
//                 } catch (e) {
//                     console.error(`Error parsing localStorage key ${key}:`, e);
//                 }
//             }
//         }

//         // Add location only if localStorage has valid data
//         if (hasData) {
//             console.log(
//                 `   Including location ${location.name} in export (${recordCount} shifts from ${dataSource})`
//             );
//             locationsWithData.push({
//                 ...location,
//                 recordCount: recordCount,
//                 shiftData: shiftData,
//             });
//         } else {
//             console.log(
//                 `  Excluding location ${location.name} from export (no valid localStorage data found)`
//             );
//         }
//     });

//     console.log(
//         "Final locations with localStorage data:",
//         locationsWithData.map((loc) => ({
//             name: loc.name,
//             recordCount: loc.recordCount,
//         }))
//     );

//     return locationsWithData;
// }

// function saveBatchForm(locationId, previousFormData, clickedRow) {
//     const quotationId = window.quotationId;
//     console.log(`Saving batch form for quotation ${quotationId}, location ${locationId}`);

//     console.log("Saving batch form for location:", locationId);
//     // Get modal field values
//     const shiftTypeCell = clickedRow.querySelector("td:nth-child(2)");

//     const dayCell = clickedRow.querySelector("td:nth-child(1)");

//     const dateRangeCell = clickedRow.querySelector("td:nth-child(3)");

//     const fromCell = clickedRow.querySelector("td:nth-child(4)");
//     const toCell = clickedRow.querySelector("td:nth-child(5)");
//     const employeesCell = clickedRow.querySelector("td:nth-child(6)");

//     const selectedDays = Array.from(dayCell.querySelectorAll(".day-label"))
//         .filter((dayLabel) => dayLabel.classList.contains("bg-[#337ab7]"))
//         .map((dayLabel) => dayLabel.textContent.trim());

//     const shiftTypeId = shiftTypeCell.querySelector(
//         ".shift-type-dropdown"
//     ).value;
//     const shiftType = getShiftTypeTextById(locationId, shiftTypeId);
//     const dateRange = dateRangeCell.querySelector(
//         ".flatpickr-date-range"
//     ).value;
//     const from = fromCell.querySelector(".flatpickr-from").value;
//     const to = toCell.querySelector(".flatpickr-to").value;
//     const employees = employeesCell.querySelector(".employees-input").value;
//     console.log(`Saving edits for location ${locationId}:`, {
//         selectedDays,
//         shiftType,
//         from,
//         to,
//         employees,
//     });

//     // Validate inputs
//     if (
//         !selectedDays.length ||
//         !shiftType ||
//         !from ||
//         !to ||
//         employees <= 0 ||
//         !dateRange
//     ) {
//         showToast("Please fill in all required fields.", "error");
//         return;
//     }
//     // Check for duplicates before any operations
//     const duplicateDays = [];
//     selectedDays.forEach((day) => {
//         const existingRecord = records[locationId].find((rec) =>
//             rec.day === day &&
//             rec.from === from &&
//             rec.to === to &&
//             rec.shiftType === shiftType &&
//             rec.quotationId === quotationId
//         );
//         if (existingRecord) {
//             existingRecord.shiftType = shiftType;
//             existingRecord.dateRange = dateRange;
//             existingRecord.from = from;
//             existingRecord.to = to;
//             existingRecord.employees = employees;
//             existingRecord.quotationId = quotationId;
//             existingRecord.locationId = locationId;
//         }
//         else{
//             // add a new record for the updated day
//             records[locationId].push({
//                 groupId: rowId,
//                 id: generateUniqueId(),
//                 day,
//                 from,
//                 to,
//                 shiftType,
//                 dateRange,
//                 employees,
//                 quotationId: quotationId,//add quotationId
//                 locationId: locationId//add locationId
//             });
//         }
//         const hasDuplicate = records[locationId].some(
//             (rec) =>
//                 rec.day === day &&
//                 rec.from === from &&
//                 rec.to === to &&
//                 rec.shiftType === shiftType &&
//                 // Skip the record we're currently editing
//                 !(
//                     previousFormData &&
//                     previousFormData.dayArray.includes(day) &&
//                     rec.shiftType === previousFormData.shiftType &&
//                     rec.from === previousFormData.fromTime &&
//                     rec.to === previousFormData.toTime
//                 )
//         );

//         if (hasDuplicate) {
//             duplicateDays.push(day);
//         }
//     });

//     if (duplicateDays.length > 0) {
//         showToast(
//             `Duplicate records found for days: ${duplicateDays.join(
//                 ", "
//             )}. Cannot add records with the same day, from, and to times.`,
//             "error"
//         );
//         return;
//     }

//     // STEP 1: Handle direct updates - if we're editing an existing record
//     if (previousFormData && previousFormData.shiftType) {
//         // Find the records matching the previous form data
//         const recordsToUpdate = records[locationId].filter(
//             (rec) =>
//                 rec.shiftType === previousFormData.shiftType &&
//                 rec.from === previousFormData.fromTime &&
//                 rec.to === previousFormData.toTime &&
//                 rec.employees === parseInt(previousFormData.employees, 10) &&
//                 previousFormData.dayArray.includes(rec.day)
//         );

//         // If we found records to update
//         if (recordsToUpdate.length > 0) {
//             console.log("Records to update:", recordsToUpdate);

//             // Check for matching records BEFORE updating anything
//             const matchingRecords = records[locationId].filter(
//                 (rec) =>
//                     rec.shiftType === shiftType &&
//                     rec.from === from &&
//                     rec.to === to &&
//                     rec.employees === employees &&
//                     !selectedDays.includes(rec.day) &&
//                     !recordsToUpdate.includes(rec)
//             );

//             if (matchingRecords.length > 0) {
//                 // Show modal asking if user wants to merge
//                 const daysText = matchingRecords.map((r) => r.day).join(", ");
//                 const modalHtml = `
//                     <div>
//                         <p>Found records with the same attributes but different days:</p>
//                         <p><strong>Days:</strong> ${daysText}</p>
//                         <p>Would you like to merge these records?</p>
//                     </div>
//                 `;

//                 showModal(
//                     modalHtml,
//                     function onConfirm(close) {
//                         // IF USER CONFIRMS, update and merge

//                         // 1. Remove the records to update
//                         records[locationId] = records[locationId].filter(
//                             (rec) => !recordsToUpdate.includes(rec)
//                         );

//                         // 2. Remove matching records
//                         records[locationId] = records[locationId].filter(
//                             (rec) => !matchingRecords.includes(rec)
//                         );

//                         // 3. Add all merged days
//                         const allDays = [
//                             ...selectedDays,
//                             ...matchingRecords.map((r) => r.day),
//                         ];

//                         allDays.forEach((day) => {
//                             records[locationId].push({
//                                 day,
//                                 shiftType,
//                                 from,
//                                 to,
//                                 employees,
//                             });
//                         });

//                         renderTable(locationId);
//                         close();
//                         showToast("Records merged successfully!", "success");
//                         hideBatchFormModal(locationId);

//                         localStorage.setItem(
//                             `records_${locationId}`,
//                             JSON.stringify(records[locationId])
//                         );
//                     },
//                     function onCancel(close) {
//                         // CANCEL SHOULD NOT MODIFY ANYTHING
//                         if (typeof close === "function") {
//                             close();
//                         }
//                         showToast("Operation cancelled", "info");
//                         hideBatchFormModal(locationId);
//                     }
//                 );
//             } else {
//                 // No matching records, proceed with normal update
//                 records[locationId] = records[locationId].filter(
//                     (rec) => !recordsToUpdate.includes(rec)
//                 );

//                 // Add new records with the updated values
//                 selectedDays.forEach((day) => {
//                     records[locationId].push({
//                         day,
//                         shiftType,
//                         from,
//                         to,
//                         employees,
//                     });
//                 });

//                 showToast("Shift updated successfully!", "success");
//                 hideBatchFormModal(locationId);
//                 renderTable(locationId);
//                 localStorage.setItem(
//                     `records_${locationId}`,
//                     JSON.stringify(records[locationId])
//                 );
//             }
//             return; // Important: stop execution here
//         }
//     }

//     // STEP 2: Handle adding new records (no previous data)

//     // Check for matching records BEFORE adding anything
//     const matchingRecords = records[locationId].filter(
//         (rec) =>
//             rec.shiftType === shiftType &&
//             rec.from === from &&
//             rec.to === to &&
//             rec.employees === employees &&
//             !selectedDays.includes(rec.day)
//     );

//     if (matchingRecords.length > 0) {
//         // Show modal asking if user wants to merge
//         const daysText = matchingRecords.map((r) => r.day).join(", ");
//         const modalHtml = `
//             <div>
//                 <p>Found records with the same attributes but different days:</p>
//                 <p><strong>Days:</strong> ${daysText}</p>
//                 <p>Would you like to merge these records?</p>
//             </div>
//         `;

//         showModal(
//             modalHtml,
//             function onConfirm(close) {
//                 // IF USER CONFIRMS, add and merge

//                 // 1. Remove matching records
//                 records[locationId] = records[locationId].filter(
//                     (rec) => !matchingRecords.includes(rec)
//                 );

//                 // 2. Add all merged days
//                 const allDays = [
//                     ...selectedDays,
//                     ...matchingRecords.map((r) => r.day),
//                 ];

//                 allDays.forEach((day) => {
//                     records[locationId].push({
//                         day,
//                         shiftType,
//                         from,
//                         to,
//                         employees,
//                     });
//                 });

//                 renderTable(locationId);
//                 close();
//                 showToast("Records merged successfully!", "success");
//                 hideBatchFormModal(locationId);
//                 localStorage.setItem(
//                     `records_${locationId}`,
//                     JSON.stringify(records[locationId])
//                 );
//             },
//             function onCancel(close) {
//                 // CANCEL SHOULD NOT MODIFY ANYTHING
//                 if (typeof close === "function") {
//                     close();
//                 }
//                 showToast("Operation cancelled", "info");
//                 hideBatchFormModal(locationId);
//             }
//         );
//     } else {
//         // No matching records, proceed with adding new records
//         selectedDays.forEach((day) => {
//             records[locationId].push({
//                 day,
//                 shiftType,
//                 from,
//                 to,
//                 employees,
//             });
//         });

//         showToast("Shift added successfully!", "success");
//         hideBatchFormModal(locationId);
//         renderTable(locationId);
//         localStorage.setItem(
//             `records_${locationId}`,
//             JSON.stringify(records[locationId])
//         );
//     }
// }
// Simplified Location Selection and Display Logic

console.log("hellooooooooooooooooooo");
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
            if (
                Array.isArray(shiftTypes) &&
                shiftTypes.length > 0 &&
                shiftTypesSelect
            ) {
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
                    shiftTypesSelect.parentElement.querySelector("button span");
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

            console.log("Calling initializeShiftTable...");
            initializeShiftTable(location.id);
        }
    });

    // Call the function to initialize Save buttons
    initializeSaveButtons();
});

console.log("hellooooooooooooooooooooooooo");
// Other initialization logic (e.g., toggle form visibility)
function toggleFormWithoutSaving(locationId) {
    const form = document.getElementById(`form_${locationId}`);
    const arrow = document.getElementById(`arrow_${locationId}`);
    const totals = document.getElementById(`totalsDisplay_${locationId}`);
    renderTable(locationId); // Ensure the table is rendered before toggling

    // Update the arrow icon
    if (form.classList.contains("max-h-0")) {
        form.classList.remove("max-h-0");
        // form.classList.add("mt-4");
        totals.classList.add("hidden");

        form.classList.add("max-h-[1000px]");

        arrow.innerHTML = '<i class="fas fa-chevron-up"></i>'; // Down arrow
        form.classList.add("p-2");
    } else {
        // form.classList.remove("mt-4");
        totals.classList.remove("hidden");

        form.classList.add("max-h-0");
        form.classList.remove("max-h-[1000px]");
        const exportBtn = document.querySelector("#exportBTN button");
        if (exportBtn) exportBtn.remove();

        arrow.innerHTML = '<i class="fas fa-chevron-down"></i>'; // Up arrow
        form.classList.remove("p-2");
    }
}
window.toggleForm = async function (locationId) {
    const form = document.getElementById(`form_${locationId}`);
    const arrow = document.getElementById(`arrow_${locationId}`);
    const totals = document.getElementById(`totalsDisplay_${locationId}`);
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
        totals.classList.add("hidden");

        form.classList.add("max-h-[1000px]");

        arrow.innerHTML = '<i class="fas fa-chevron-up"></i>'; // Down arrow
        form.classList.add("p-2");
    } else {
        // form.classList.remove("mt-4");
        totals.classList.remove("hidden");

        form.classList.add("max-h-0");
        form.classList.remove("max-h-[1000px]");
        const exportBtn = document.querySelector("#exportBTN button");
        if (exportBtn) exportBtn.remove();

        arrow.innerHTML = '<i class="fas fa-chevron-down"></i>'; // Up arrow
        form.classList.remove("p-2");
    }
};
// Add to DOMContentLoaded event handler
locations.forEach((location) => {
    // Load records from localStorage if available
    const savedRecords = localStorage.getItem(`Locationss_${location.id}`);

    // const savedRecords = localStorage.getItem(`Location_${location.id}`, `quotation_${location.id}`);
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
// Event listeners for shift operations
locations.forEach((location) => {
    const addShiftBtn = document.getElementById(`addShiftBtn_${location.id}`);
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

//Update the locations in real-time
// Add a new location to the dropdown and select it
function addLocationToDropdown(location) {
    const optionsContainer = document.querySelector(".location-options");
    if (!optionsContainer) return;

    // Create the option element
    const label = document.createElement("label");
    label.className =
        "location-option flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer";
    label.setAttribute("data-location-id", location.id);
    label.setAttribute("data-name", location.name);
    label.setAttribute("data-address", location.address);

    label.innerHTML = `
        <div class="flex-1">
            <div class="font-medium text-sm text-gray-900">
                <input type="checkbox" value="${location.id}" class="mr-3 text-blue-600 focus:ring-blue-500" checked>
                ${location.name}
            </div>
            <div class="text-xs text-gray-500">${location.address}</div>
        </div>
    `;
    optionsContainer.appendChild(label);

    // Select the new location in the dropdown
    if (window.multiSelectDropdown) {
        const checkbox = label.querySelector('input[type="checkbox"]');
        checkbox.checked = true;
        window.multiSelectDropdown.handleOptionSelect(checkbox);
    }
}

// Update an existing location in the dropdown and pills
function updateLocationInDropdown(location) {
    const option = document.querySelector(
        `.location-option[data-location-id="${location.id}"]`
    );
    if (option) {
        option.querySelector(".font-medium").innerHTML = `
            <input type="checkbox" value="${
                location.id
            }" class="mr-3 text-blue-600 focus:ring-blue-500" ${
            window.multiSelectDropdown.selectedValues.has(String(location.id))
                ? "checked"
                : ""
        }>
            ${location.name}
        `;
        option.querySelector(".text-xs").textContent = location.address;
    }
    // Update pill if selected
    const pill = document.querySelector(
        `.location-pill[data-value="${location.id}"] span`
    );
    if (pill) pill.textContent = location.name;
}

// Remove a location from the dropdown and pills
function removeLocationFromDropdown(locationId) {
    const option = document.querySelector(
        `.location-option[data-location-id="${locationId}"]`
    );
    if (option) option.remove();

    // Remove pill if present
    const pill = document.querySelector(
        `.location-pill[data-value="${locationId}"]`
    );
    if (pill) pill.remove();

    // Update dropdown state
    if (window.multiSelectDropdown) {
        window.multiSelectDropdown.selectedValues.delete(String(locationId));
        window.multiSelectDropdown.updateSearchPlaceholder();
    }
}
// function renderSelectedLocationContainers() {
//     const selectedIds = window.multiSelectDropdown.getSelectedValues();
//     const container = document.getElementById('selectedLocationsForms');
//     container.innerHTML = '';

//     if (selectedIds.length === 0) {
//         container.innerHTML = '<div class="text-center text-gray-500 py-8">No locations selected. Please select locations above.</div>';
//         return;
//     }

//     selectedIds.forEach(id => {
//         const location = locations.find(loc => String(loc.id) === String(id));
//         if (location) {
//             const locationForm = createLocationForm(location.id, location.name, location.address);
//             console.log("the location form, is ...:", locationForm);
//             container.appendChild(locationForm);
//         }
//     });
// }

function renderSelectedLocationContainers() {
    const selectedIds = window.multiSelectDropdown.getSelectedValues();
    const forms = document.querySelectorAll(".location-form");
    forms.forEach((form) => {
        const locationId = form.getAttribute("data-location-id");
        if (selectedIds.includes(locationId)) {
            form.style.display = "block";
        } else {
            form.style.display = "none";
        }
    });
}
function createLocationForm(location) {
    const div = document.createElement("div");
    div.className = "location-form";
    div.setAttribute("data-location-id", location.id);
    div.style.display = "block"; // Show it by default

    div.innerHTML = `
        <div class="border border-gray-300 rounded mt-2 mb-6 bg-gray-100">
            <div class="cursor-pointer p-2" onclick="toggleForm('${location.id}')">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-lg text-[#2679b5]">${location.name}</h3>
                    <span id="arrow_${location.id}" class="text-sm text-gray-500">
                        <i class="fas fa-chevron-down"></i>
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <p class="text-sm text-gray-600">${location.address}</p>
                    <p id="totalsDisplay_${location.id}" class="text-sm text-gray-700 mt-2"></p>
                </div>
            </div>
            <div id="form_${location.id}" class="overflow-hidden max-h-0 transition-all duration-700 ease-in-out bg-white">
                <!-- Add your form fields and shift table here -->
                <div class="mt-1 rounded mx-5" id="batchForm_${location.id}">
                    <div class="flex justify-between items-center mt-2">
                        <div class="flex items-center gap-4 p-2">
                            <label>Filter by Day:</label>
                            <select id="filterDay_${location.id}" class="border rounded px-2 py-1">
                                <option value="">All</option>
                                <option value="Mon">Monday</option>
                                <option value="Tue">Tuesday</option>
                                <option value="Wed">Wednesday</option>
                                <option value="Thu">Thursday</option>
                                <option value="Fri">Friday</option>
                                <option value="Sat">Saturday</option>
                                <option value="Sun">Sunday</option>
                            </select>
                            <label class="ml-4">Filter by Shift Type:</label>
                            <select id="filterShiftType_${location.id}" class="border rounded px-2 py-1">
                                <option value="">All</option>
                            </select>
                        </div>
                        <button type="button"
                            class="bg-[#428bca] text-white px-3 py-1 rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 add-shift-type-btn"
                            data-location-id="${location.id}">
                            Add New Entry
                        </button>
                    </div>
                    <table class="min-w-full border mt-1" id="shiftTable_${location.id}">
                        <thead>
                            <tr>
                                <th class="border px-2 py-1">Day</th>
                                <th class="border px-2 py-1">Shift Type</th>
                                <th class="border px-2 py-1">Date Range</th>
                                <th class="border px-2 py-1">From</th>
                                <th class="border px-2 py-1">To</th>
                                <th class="border px-2 py-1"># Employees</th>
                                <th class="border px-2 py-1">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Rows will be rendered by JS -->
                        </tbody>
                    </table>
                    <div class="flex justify-end">
                        <button type="button" id="saveBtn_${location.id}"
                            class="bg-[#87b87f] hover:bg-lime-700 text-white px-3 py-2 rounded border mt-3">
                            <span class="save-btn-text">Save and Review</span>
                            <span class="save-btn-spinner hidden">
                                <i class="fas fa-spinner fa-spin"></i>
                            </span>
                            <span class="save-btn-check hidden" id="checkIcon_${location.id}">
                                <i class="fas fa-check"></i>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    return div;
}

// Add event listeners to all "Add Shift Type" buttons
const addShiftTypeButtons = document.querySelectorAll(".add-shift-type-btn");
console.log("initalizing add default button");
addShiftTypeButtons.forEach((button) => {
    button.addEventListener("click", function () {
        const locationId = button.getAttribute("data-location-id");
        addDefaultShiftRow(locationId);
    });
});

const backBtnLocation = document.getElementById("backToSelectionBtn");
if (backBtnLocation)
    backBtnLocation.addEventListener("click", openLocationCrudModal);

const closeLocBtn = document.getElementById("closeLocationCrudModal");
if (closeLocBtn) closeLocBtn.addEventListener("click", closeLocationCrudModal);

const addLocBtn = document.getElementById("addLocationBtn");
if (addLocBtn) addLocBtn.addEventListener("click", addLocationRow);

const locCrudTbody = document.querySelector("#locationCrudTable tbody");
if (locCrudTbody)
    locCrudTbody.addEventListener("click", handleLocationCrudTableClick);

document
    .getElementById("addShiftTypeBtn")
    .addEventListener("click", addShiftTypeRow);
// document
//     .getElementById("closeShiftTypeCrudModal")
//     .addEventListener("click", closeShiftTypeCrudModal);
document
    .querySelector("#shiftTypeCrudTable tbody")
    .addEventListener("click", handleShiftTypeCrudTableClick);
// document
//     .getElementById("openShiftTypeCrudBtn")
//     .addEventListener("click", openShiftTypeCrudModal);

locations.forEach((location) => {
    const addShiftBtn = document.getElementById(`addShiftBtn_${location.id}`);
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
// Add event listeners for each export button after rendering the preview modal/table

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
            const shiftName = getShiftTypeTextById(location.id, e.target.value);
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
        document.body.classList.remove("overflow-hidden");
        const exportBtn = document.querySelector("#exportBTN button");
        if (exportBtn) exportBtn.remove();
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
    const saveBtn = document.getElementById(`saveBatchFormBtn_${locationId}`);
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
if (step2Form) {
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
}

// Back button logic
const backBtn = document.getElementById("backBtn");
if (backBtn) {
    backBtn.addEventListener("click", function (e) {
        e.preventDefault();
        window.location.href = "/dataentry";
    });
}

//selected location logic - COMMENTED OUT TO PREVENT CONFLICTS WITH NEW SYSTEM

// document.addEventListener('DOMContentLoaded', function() {
//     const locationDropdown = document.getElementById('locationDropdown');
//     const locationOptions = document.getElementById('locationOptions');
//     const selectedLocations = document.getElementById('selectedLocations');
//     const placeholderText = document.getElementById('placeholderText');
//     const selectedLocationsForms = document.getElementById('selectedLocationsForms');
//     const selectedLocationsInput = document.getElementById('selectedLocationsInput');
//     const selectedCount = document.getElementById('selectedCount');

//     let selectedLocationIds = [];

//     // Toggle dropdown
//     locationDropdown.addEventListener('click', function() {
//         locationOptions.style.display = locationOptions.style.display === 'block' ? 'none' : 'block';
//     });

//     // Close dropdown when clicking outside
//     document.addEventListener('click', function(e) {
//         if (!locationDropdown.contains(e.target) && !locationOptions.contains(e.target)) {
//             locationOptions.style.display = 'none';
//         }
//     });

//     // Handle checkbox changes
//     document.querySelectorAll('.location-checkbox').forEach(checkbox => {
//         checkbox.addEventListener('change', function() {
//             updateSelectedLocations();
//         });
//     });

//     // Select All button
//     document.getElementById('selectAllBtn').addEventListener('click', function() {
//         document.querySelectorAll('.location-checkbox').forEach(checkbox => {
//             checkbox.checked = true;
//         });
//         updateSelectedLocations();
//     });

//     // Clear All button
//     document.getElementById('clearAllBtn').addEventListener('click', function() {
//         document.querySelectorAll('.location-checkbox').forEach(checkbox => {
//             checkbox.checked = false;
//         });
//         updateSelectedLocations();
//     });

//     // Confirm Selection button
//     document.getElementById('confirmSelectionBtn').addEventListener('click', function() {
//         generateLocationForms();
//         locationOptions.style.display = 'none';
//     });

//     // Back button to show location selection again
//     document.getElementById('backBtn').addEventListener('click', function() {
//         document.querySelector('.bg-white.p-4.mb-6.rounded.border').scrollIntoView({
//             behavior: 'smooth'
//         });
//     });

//     function updateSelectedLocations() {
//         const checkedBoxes = document.querySelectorAll('.location-checkbox:checked');
//         selectedLocationIds = Array.from(checkedBoxes).map(cb => cb.value);

//         // Update selected count
//         selectedCount.textContent = checkedBoxes.length;
//
//         // Update selected locations display
//         selectedLocations.innerHTML = '';

//         if (checkedBoxes.length === 0) {
//             placeholderText.style.display = 'block';
//             selectedLocations.appendChild(placeholderText);
//         } else {
//             placeholderText.style.display = 'none';
//             checkedBoxes.forEach(checkbox => {
//                 const locationTag = document.createElement('div');
//                 locationTag.className = 'location-tag';
//                 locationTag.innerHTML = `
//                     ${checkbox.dataset.name}
//                     <span class="remove-btn" onclick="removeLocation('${checkbox.value}')">&times;</span>
//                 `;
//                 selectedLocations.appendChild(locationTag);
//             });
//         }

//         // Update hidden input
//         selectedLocationsInput.value = JSON.stringify(selectedLocationIds);
//     }

//     function generateLocationForms() {
//         const checkedBoxes = document.querySelectorAll('.location-checkbox:checked');
//         selectedLocationsForms.innerHTML = '';

//         if (checkedBoxes.length === 0) {
//             selectedLocationsForms.innerHTML = '<div class="text-center text-gray-500 py-8">No locations selected. Please select locations above.</div>';
//             return;
//         }

//         checkedBoxes.forEach(checkbox => {
//             const locationId = checkbox.value;
//             const locationName = checkbox.dataset.name;
//             const locationAddress = checkbox.dataset.address;

//             const locationForm = createLocationForm(locationId, locationName, locationAddress);
//             selectedLocationsForms.appendChild(locationForm);
//         });

//         // Initialize JavaScript for the new forms
//         if (typeof initializeLocationForms === 'function') {
//             initializeLocationForms();
//         }
//     }

//     function createLocationForm(locationId, locationName, locationAddress) {
//         const div = document.createElement('div');
//         div.className = 'border border-gray-300 rounded mt-2 mb-6 bg-gray-100';
//         div.innerHTML = `
//             <!-- Location Header -->
//             <div class="cursor-pointer p-2" onclick="toggleForm('${locationId}')">
//                 <div class="flex justify-between items-center mb-2">
//                     <h3 class="text-lg text-[#2679b5]">${locationName}</h3>
//                     <span id="arrow_${locationId}" class="text-sm text-gray-500">
//                         <i class="fas fa-chevron-down"></i>
//                     </span>
//                 </div>
//                 <div class="flex justify-between items-center">
//                     <p class="text-sm text-gray-600">${locationAddress}</p>
//                     <p id="totalsDisplay_${locationId}" class="text-sm text-gray-700 mt-2"></p>
//                 </div>
//             </div>

//             <!-- Hidden Form -->
//             <div id="form_${locationId}" class="overflow-hidden max-h-0 transition-all duration-700 ease-in-out bg-white">
//                 <div class="mt-1 rounded mx-5" id="batchForm_${locationId}">
//                     <div class="flex justify-between items-center mt-2">
//                         <div class="flex items-center gap-4 p-2">
//                             <label>Filter by Day:</label>
//                             <select id="filterDay_${locationId}" class="border rounded px-2 py-1">
//                                 <option value="">All</option>
//                                 <option value="Mon">Monday</option>
//                                 <option value="Tue">Tuesday</option>
//                                 <option value="Wed">Wednesday</option>
//                                 <option value="Thu">Thursday</option>
//                                 <option value="Fri">Friday</option>
//                                 <option value="Sat">Saturday</option>
//                                 <option value="Sun">Sunday</option>
//                             </select>
//                             <label class="ml-4">Filter by Shift Type:</label>
//                             <select id="filterShiftType_${locationId}" class="border rounded px-2 py-1">
//                                 <option value="">All</option>
//                             </select>
//                         </div>
//                         <button type="button"
//                             class="bg-[#428bca] text-white px-3 py-1 rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 add-shift-type-btn"
//                             data-location-id="${locationId}">
//                             Add New Entry
//                         </button>
//                     </div>

//                     <!-- Shift Details Table -->
//                     <table class="min-w-full border mt-1" id="shiftTable_${locationId}">
//                         <thead>
//                             <tr>
//                                 <th class="border px-2 py-1">Day</th>
//                                 <th class="border px-2 py-1">Shift Type</th>
//                                 <th class="border px-2 py-1">Date Range</th>
//                                 <th class="border px-2 py-1">From</th>
//                                 <th class="border px-2 py-1">To</th>
//                                 <th class="border px-2 py-1"># Employees</th>
//                                 <th class="border px-2 py-1">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             <!-- Rows will be rendered by JS -->
//                         </tbody>
//                     </table>

//                     <div class="flex justify-end">
//                         <button type="button" id="saveBtn_${locationId}"
//                             class="bg-[#87b87f] hover:bg-lime-700 text-white px-3 py-2 rounded border mt-3">
//                             <span class="save-btn-text">Save and Review</span>
//                             <span class="save-btn-spinner hidden">
//                                 <i class="fas fa-spinner fa-spin"></i>
//                             </span>
//                             <span class="save-btn-check hidden" id="checkIcon_${locationId}">
//                                 <i class="fas fa-check"></i>
//                             </span>
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         `;
//         return div;
//     }

//     // Function to remove location
//     window.removeLocation = function(locationId) {
//         const checkbox = document.getElementById(`location_${locationId}`);
//         if (checkbox) {
//             checkbox.checked = false;
//             updateSelectedLocations();
//             generateLocationForms(); // Regenerate forms after removing location
//         }
//     };

//     // Function to toggle forms (will be used by dynamically created forms)
//     window.toggleForm = function(locationId) {
//         const form = document.getElementById(`form_${locationId}`);
//         const arrow = document.getElementById(`arrow_${locationId}`);

//         if (form.style.maxHeight === '0px' || form.style.maxHeight === '') {
//             form.style.maxHeight = form.scrollHeight + 'px';
//             arrow.innerHTML = '<i class="fas fa-chevron-up"></i>';
//         } else {
//             form.style.maxHeight = '0px';
//             arrow.innerHTML = '<i class="fas fa-chevron-down"></i>';
//         }
//     };

//     // Load any previously selected locations
//     const savedLocations = localStorage.getItem(`quotation_${quotationId}_selected_locations`);
//     if (savedLocations) {
//         const locationIds = JSON.parse(savedLocations);
//         locationIds.forEach(id => {
//             const checkbox = document.getElementById(`location_${id}`);
//             if (checkbox) {
//                 checkbox.checked = true;
//             }
//         });
//         updateSelectedLocations();
//         generateLocationForms();
//     }

//     // Save selections to localStorage when they change
//     document.addEventListener('change', function(e) {
//         if (e.target.classList.contains('location-checkbox')) {
//             localStorage.setItem(`quotation_${quotationId}_selected_locations`, JSON.stringify(selectedLocationIds));
//         }
//     });
// });
