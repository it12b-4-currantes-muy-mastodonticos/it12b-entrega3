import axios from "axios";

// Use string keys to match localStorage behavior
const hardcodedTokenMap = {
  "1": "d7a9fb0517aade4b66a55320a5e11791",
  "2": "cbea22576d236e7b53dbd35ad0f19be6",
  "3": "84d58ef56f610af42a0e516c5fade785",
  "4": "3b6f4d004143639af2929981a30d3080",
  "5": "1054349cc4b3e55be668ddac6eb3fa76",
  "6": "84d58ef56f610af42a0e516c5fade785",
};

// Use string keys in the token map as well
const tokenMap = {
  "1": process.env.NEXT_PUBLIC_USER_TOKEN_1 || hardcodedTokenMap["1"],
  "2": process.env.NEXT_PUBLIC_USER_TOKEN_2 || hardcodedTokenMap["2"],
  "3": process.env.NEXT_PUBLIC_USER_TOKEN_3 || hardcodedTokenMap["3"],
  "4": process.env.NEXT_PUBLIC_USER_TOKEN_4 || hardcodedTokenMap["4"],
  "5": process.env.NEXT_PUBLIC_USER_TOKEN_5 || hardcodedTokenMap["5"],
  "6": process.env.NEXT_PUBLIC_USER_TOKEN_6 || hardcodedTokenMap["6"],
};

const api = axios.create({
  baseURL: "https://guarded-thicket-57238-b0a5a41acd38.herokuapp.com",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add more debugging for production
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const userId = localStorage.getItem("user_id");

    // Add detailed debugging
    console.debug(`[Axios] Request to ${config.url}`);
    console.debug(`[Axios] userId from localStorage: "${userId}" (type: ${typeof userId})`);
    console.debug(`[Axios] Available token keys: ${Object.keys(tokenMap).join(", ")}`);

    // Direct string lookup
    const token = tokenMap[userId];

    if (token) {
      console.debug(`[Axios] Found token for userId ${userId}: ${token.substring(0, 5)}...`);
      config.headers["X-Api-Token"] = token;
    } else {
      console.warn(`[Axios] No token found for userId: "${userId}"`);
    }
  }
  return config;
});

// Add response interceptor for better debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(`[Axios] Error for ${error.config?.url}: ${error.response?.status || error.message}`);

    if (error.response?.status === 401) {
      const userId = localStorage.getItem("user_id");
      console.error(`[Axios] 401 Unauthorized with userId: "${userId}"`);

      // Check if token was actually sent
      const sentToken = error.config?.headers?.["X-Api-Token"];
      console.error(`[Axios] Token sent in request: ${sentToken ? "Yes" : "No"}`);
    }

    return Promise.reject(error);
  }
);

export default api;