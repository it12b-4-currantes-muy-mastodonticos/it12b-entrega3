import axios from "axios";

// Mapeo entre user IDs y tokens

  const hardcodedTokenMap = {
    1: "d7a9fb0517aade4b66a55320a5e11791",
    2: "cbea22576d236e7b53dbd35ad0f19be6",
    3: "84d58ef56f610af42a0e516c5fade785",
    4: "3b6f4d004143639af2929981a30d3080", 
    5: "1054349cc4b3e55be668ddac6eb3fa76",
    6: "84d58ef56f610af42a0e516c5fade785",
  };

    const tokenMap = {
      1: process.env.NEXT_PUBLIC_USER_TOKEN_1 || hardcodedTokenMap[1],
      2: process.env.NEXT_PUBLIC_USER_TOKEN_2 || hardcodedTokenMap[2],
      3: process.env.NEXT_PUBLIC_USER_TOKEN_3 || hardcodedTokenMap[3],
      4: process.env.NEXT_PUBLIC_USER_TOKEN_4 || hardcodedTokenMap[4],
      5: process.env.NEXT_PUBLIC_USER_TOKEN_5 || hardcodedTokenMap[5],
      6: process.env.NEXT_PUBLIC_USER_TOKEN_6 || hardcodedTokenMap[6],
    };
const api = axios.create({
  baseURL: "https://guarded-thicket-57238-b0a5a41acd38.herokuapp.com",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor dinámico
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const userId = localStorage.getItem("user_id");
    const token = tokenMap[userId];
    console.debug(`[Axios] Usando token para user_id=${userId}:`, token);
    if (token) {
      config.headers["X-Api-Token"] = token;
    }
  }
  return config;
});

export default api;
