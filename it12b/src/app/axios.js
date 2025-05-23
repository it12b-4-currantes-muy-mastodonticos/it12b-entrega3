import axios from "axios";

const api = axios.create({
  baseURL: "http://guarded-thicket-57238-b0a5a41acd38.herokuapp.com", // Cambia según el servidor que uses
  headers: {
    "X-Api-Token": "TU_API_TOKEN", // Reemplaza con tu token
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});


export default api;