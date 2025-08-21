// API service abstraction for all backend calls
import axios from "axios";

function axiosConfig() {
    console.log("Not Using static JWT for API calls");
    return {
        withCredentials: true,
        headers: {
            Accept: "application/json",
        },
    };
}

const apiService = {
    getDayTypes: () =>
        axios.get("/api/day-types", axiosConfig()).then((r) => r.data),
    getShiftTypes: () =>
        axios.get("/api/shift-types", axiosConfig()).then((r) => r.data),
    getLocations: () =>
        axios.get("/api/locations", axiosConfig()).then((r) => r.data),
    createShiftType: (data) =>
        axios.post("/api/shift-types", data, axiosConfig()),
    updateShiftType: (id, data) =>
        axios.put(`/api/shift-types/${id}`, data, axiosConfig()),
    createRate: (data) => axios.post("/api/rates", data, axiosConfig()),
    updateRate: (id, data) =>
        axios.put(`/api/rates/${id}`, data, axiosConfig()),
    deleteShiftType: (id) =>
        axios.delete(`/api/shift-types/${id}`, axiosConfig()),
    createLocation: (data) => axios.post("/api/locations", data, axiosConfig()),
    deleteLocation: (id) => axios.delete(`/api/locations/${id}`, axiosConfig()),

    // Review endpoints
    getReview: () =>
        axios.get("/api/review", axiosConfig()).then((r) => r.data),
    calculateReview: (data) =>
        axios.post("/api/review/calculate", data, axiosConfig()),
    calculateReviewMulti: (data) =>
        axios.post("/api/review/calculate-multi-merged", data, axiosConfig()),
    exportReview: (data, config = {}) =>
        axios.post("/api/review/export", data, { ...axiosConfig(), ...config }),
    saveReview: (data) => axios.post("/api/review/save", data, axiosConfig()),
};

export { apiService, axiosConfig };

// window.populatePreviewTable = function populatePreviewTable(
//     headings,
//     data,
//     selectedColumnIds
// ) {

//     const clientColumns = [
//     "client day rate",
//     "client night rate",
//     "client sat rate",
//     "client sun rate",
//     "client ph rate",
//     "client billable"
// ].map(h => h.toLowerCase());

//     const navyColumns = [
//     "week starting",
//     "shift type",
//     "location",
//     "start date",
//     "scheduled start",
//     "scheduled finish",
//     "scheduled hours",
//     "emp. numb",
//     "date range"

// ].map(h => h.toLowerCase());
//  const hourColumns = [
//                 "Day (0600–1800)",
//                 "Night (1800–0600)",
//                 "Saturday",
//                 "Sunday",
//                 "PH",
//             ].map(h => h.toLowerCase());
//  const hourColumnsCap = [
//                 "Scheduled Hours",
//                 "Day (0600–1800)",
//                 "Night (1800–0600)",
//                 "Saturday",
//                 "Sunday",
//                 "PH",
//             ];

//     window.latestSelectedColumnIds = selectedColumnIds;
//     // Destroy DataTable before clearing table
//     const table = document.getElementById("previewTable");
//     const previewContainer = table.parentElement; // The div containing the table

//     // Remove any existing option div
//     let optionDiv = document.getElementById("previewLocationOptionDiv");
//     if (optionDiv) optionDiv.remove();
//     console.log(document.getElementById("previewLocationOptionDiv"));

//     // Destroy DataTable and clear table
//     if ($.fn.DataTable.isDataTable("#previewTable")) {
//         $("#previewTable").DataTable().destroy();
//     }
//     console.log(document.getElementById("previewLocationOptionDiv"));

//     let thead = table.querySelector("thead");
//     if (!thead) {
//         thead = document.createElement("thead");
//         table.appendChild(thead);
//     }
//     let tbody = table.querySelector("tbody");
//     if (!tbody) {
//         tbody = document.createElement("tbody");
//         table.appendChild(tbody);
//     }
//     thead.innerHTML = "";
//     tbody.innerHTML = "";

//     // Use original headings to find location index
//     const originalHeadings = window.originalPreviewHeadings || headings;
//     const locationIndex = originalHeadings.findIndex(
//         (h) => h.toLowerCase().replace(/[^a-z0-9]/g, "_") === "location"
//     );
//     let uniqueLocations = [];
//     if (locationIndex !== -1) {
//         uniqueLocations = [...new Set(data.map((row) => row[locationIndex]))];
//     }
//     console.log(uniqueLocations);

//     // Only show the option if more than one location
//     if (uniqueLocations.length > 1) {
//         optionDiv = document.createElement("div");
//         optionDiv.id = "previewLocationOptionDiv";
//         optionDiv.className =
//             "mb-4 p-3 border rounded bg-blue-50 flex gap-6 items-center";
//         optionDiv.innerHTML = `
//             <label class="flex items-center gap-2">
//                 <input type="radio" name="previewLocationExportMode" value="single" checked>
//                 <span>All in One Page</span>
//             </label>
//             <label class="flex items-center gap-2">
//                 <input type="radio" name="previewLocationExportMode" value="separate">
//                 <span>Separate Tabs by Location</span>
//             </label>
//             <span class="text-xs text-gray-500 ml-4">(This will affect the export format)</span>
//         `;
//         console.log(document.getElementById("previewLocationOptionDiv"));

//         const placeholder = document.getElementById(
//             "previewLocationOptionPlaceholder"
//         );
//         if (placeholder) {
//             placeholder.innerHTML = ""; // Clear previous content
//             placeholder.appendChild(optionDiv);
//         }
//         console.log(document.getElementById("previewLocationOptionDiv"));
//     }
//     console.log(document.getElementById("previewLocationOptionDiv"));

//     // Only show columns that are selected
//     const visibleColumns = headings.filter((h) =>
//         selectedColumnIds.has(h.toLowerCase().replace(/[^a-z0-9]/g, "_"))
//     );

//     // const headingBreaks = {
//     //     "Emp. Numb": "Emp.<wbr>Numb",
//     //     "Shift Type": "Shift<wbr> Type",
//     //     "Week Starting": "Week<wbr> Starting",
//     //     "Date Range": "Date<wbr> Range",
//     //     "Day (06–18)": "Day<wbr>(06–18)",
//     //     "Night (18–06)": "Night<wbr>(18–06)",
//     //     "Scheduled Hours": "Scheduled<wbr> Hours",
//     //     "Scheduled Start": "Scheduled<wbr> Start",
//     //     "Scheduled Finish": "Scheduled<wbr> Finish",
//     //     "Client Day Rate": "Client<wbr> Day<wbr> Rate",
//     //     "Client Night Rate": "Client<wbr> Night<wbr> Rate",
//     //     "Client Sat Rate": "Client<wbr> Sat<wbr> Rate",
//     //     "Client Sun Rate": "Client<wbr> Sun<wbr> Rate",
//     //     "Client PH Rate": "Client<wbr> PH<wbr> Rate",
//     //     "Client Billable": "Client<wbr> Billable",
//     //     // Add more as needed
//     // };

//     // Build table header
//     const trHead = document.createElement("tr");
//     visibleColumns.forEach((heading) => {
//     const th = document.createElement("th");
//         th.innerHTML = heading; // Use breaks if defined
//     th.className =
//         "border border-gray-300 px-1 py-1 text-xs break-words w-[50px] text-center align-middle";
//     if (navyColumns.includes(heading.toLowerCase())) {
//         th.style.backgroundColor = "#10253B";
//         th.style.color = "#fff";
//         th.style.border = "none";

//     }
//     if (hourColumns.includes(heading.toLowerCase())) {
//         th.style.backgroundColor = "#000";
//         th.style.color = "#fff";
//          th.style.border = "none";
//     }
//      if (clientColumns.includes(heading.toLowerCase())) {
//         th.style.backgroundColor = "#843C0C";
//         th.style.color = "#fff";
//         th.style.border = "none";
//      }
//     trHead.appendChild(th);
// });
//     thead.appendChild(trHead);

//     // // Build table body
//     // if (!data || data.length === 0) {
//     //     const tr = document.createElement("tr");
//     //     const td = document.createElement("td");
//     //     td.colSpan = visibleColumns.length;
//     //     td.className =
//     //         "border border-gray-300 px-1 py-1 text-xs break-all w-[90px] max-w-[90px] text-center align-middle";
//     //     td.textContent = "No calculated data available";

//     //     tr.appendChild(td);
//     //     tbody.appendChild(tr);
//     //     return;
//     // }

//     // Show "No data" if data is empty
//     if (!data || data.length === 0) {
//         const tr = document.createElement("tr");
//         const td = document.createElement("td");
//         td.colSpan = visibleColumns.length || 1;
//         td.className =
//             "border border-gray-300 px-1 py-1 text-xs break-all w-[90px] max-w-[90px] text-center align-middle";
//         td.textContent = "No data available";
//         tr.appendChild(td);
//         tbody.appendChild(tr);
//         // Optionally, destroy DataTable if it exists
//         if ($.fn.DataTable.isDataTable("#previewTable")) {
//             $("#previewTable").DataTable().destroy();
//         }
//         return;
//     }

//     data.forEach((row) => {
//         const tr = document.createElement("tr");

//         // Highlight row if public_holiday is set and not empty/zero/"-"
//         // Find the index of "Public Holiday" in visibleColumns and in headings
//         const phIndex = headings.findIndex(
//             (h) => h.toLowerCase().replace(/[^a-z0-9]/g, "_") === "ph"
//         );
//         const isPublicHoliday = phIndex !== -1 && Number(row[phIndex]) > 0;

//         visibleColumns.forEach((heading) => {
//             // Find the index of this heading in the headings array
//             const idx = headings.indexOf(heading);
//             let value = idx !== -1 ? row[idx] : "-";
//             const td = document.createElement("td");
//             td.className =
//                 "border border-gray-300 px-1 py-1 text-xs break-words  text-center align-middle";
// if (clientColumns.includes(heading.toLowerCase())) {
//     td.style.backgroundColor = "#fce0cc";
//     td.style.border = "none";
// }
//             // Format hours columns

//             // Format currency columns
//             const currencyColumns = [
//                 "Client Day Rate",
//                 "Client Night Rate",
//                 "Client Sat Rate",
//                 "Client Sun Rate",
//                 "Client PH Rate",
//                 "Client Billable",
//             ];
//               if (hourColumnsCap.includes(heading) && value !== "-") {
//                 value = Number(value).toFixed(2);
//             } else if (currencyColumns.includes(heading) && value !== "-") {
//                 value = "$" + Number(value).toFixed(2);
//             }

//            if (hourColumns.includes(heading.toLowerCase())) {
//     td.className =
//         "px-1 py-1 text-xs break-words text-center align-middle"; // No border classes
//     td.style.backgroundColor = "#D9D9D9";
//     td.style.borderTop = "none";
//     td.style.borderBottom = "none";

// }

//             // // Special formatting for Start Date
//             // if (heading === "Start Date" && value && value !== "-") {
//             //     const dateObj = new Date(value);
//             //     const dayName = dateObj.toLocaleDateString("en-US", {
//             //         weekday: "long",
//             //     });
//             //     value = isPublicHoliday
//             //         ? ${value} (${dayName}) PH
//             //         : ${value} (${dayName});
//             //     td.innerHTML = value; // Use innerHTML for <br>
//             // } else {
//             //     td.textContent = value;
//             // }
//             if (heading === "Date Range" && value && value !== "-") {
//                 // Insert <wbr> after 'to' for better wrapping
//                 // value = value.replace(/\s+to\s+/, " <wbr>to<wbr> ");
//                 td.innerHTML = value; // Use innerHTML to allow <wbr>
//             } else if (heading === "Start Date" && value && value !== "-") {
//                 const dateObj = new Date(value);
//                 const dayName = dateObj.toLocaleDateString("en-US", {
//                     weekday: "long",
//                 });
//                 value = isPublicHoliday
//                     ? ${value} (${dayName})
//                     : ${value} (${dayName});
//                 td.innerHTML = value; // Use innerHTML for <br>
//             } else {
//                 td.textContent = value;
//             }
//             tr.appendChild(td);
//         });
//         if (isPublicHoliday) {
//             tr.style.backgroundColor = "#c8f7c5";
//         }
//         tbody.appendChild(tr);
//     });

//     // (Re)initialize DataTable
//     let dt = $("#previewTable").DataTable({
//         paging: false,
//         searching: true,
//         autoWidth: false,
//         ordering: true,
//         scrollX: true,
//         scrollY: "40vh",
//         scrollCollapse: false,
//         columnDefs: [{ targets: "_all" }],
//     });

//     dt.columns.adjust().draw(false);
//     $(window).on("resize", function () {
//         $($.fn.dataTable.tables(true)).DataTable().columns.adjust().draw(false);
//     });
//     // Add margin-bottom to the DataTables search bar
//     // Find the filter container
//     const $filter = $(".dataTables_filter");
//     if ($filter.length && !$("#datatable-title").length) {
//         // Create a flex wrapper div with three columns
//         const $flexDiv = $(`
//         <div class="w-full flex items-center mb-4" style="min-height:40px;">
//             <div class="flex-1 flex items-center"></div>
//             <div class="flex-1 text-center  text-2xl text-[#2679b5]" id="datatable-title">Preview Table</div>
//             <div class="flex-1"></div>
//         </div>
//     `);

//         // Move the search bar into the left column
//         $flexDiv.children().eq(0).append($filter.contents());
//         // Replace the filter's content with the flex container
//         $filter.empty().append($flexDiv);
//         // Remove float and align left for the search bar
//         $filter.css({ float: "none", "text-align": "left", margin: 0 });
//     }
// };
