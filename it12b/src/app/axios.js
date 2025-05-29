import axios from "axios";

// Mapeo entre user IDs y tokens
const tokenMap = {
  1: process.env.NEXT_PUBLIC_USER_TOKEN_1,
  2: process.env.NEXT_PUBLIC_USER_TOKEN_2,
  3: process.env.NEXT_PUBLIC_USER_TOKEN_3,
  4: process.env.NEXT_PUBLIC_USER_TOKEN_4,
  5: process.env.NEXT_PUBLIC_USER_TOKEN_5,
  6: process.env.NEXT_PUBLIC_USER_TOKEN_6,
};

const api = axios.create({
  baseURL: "http://guarded-thicket-57238-b0a5a41acd38.herokuapp.com",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor dinámico
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const userId = localStorage.getItem("user_id");
    console.debug(`[Axios] user_id obtenido del localStorage: ${userId}`);
    const token = tokenMap[userId];
    console.debug(`[Axios] Usando token para user_id=${userId}:`, token);
    if (token) {
      config.headers["X-Api-Token"] = token;
    }
  }
  return config;
});

export default api;
