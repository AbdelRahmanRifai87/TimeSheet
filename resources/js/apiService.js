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
    exportReview: (data, config = {}) =>
        axios.post("/api/review/export", data, { ...axiosConfig(), ...config }),
    saveReview: (data) => axios.post("/api/review/save", data, axiosConfig()),
};

export { apiService, axiosConfig };
