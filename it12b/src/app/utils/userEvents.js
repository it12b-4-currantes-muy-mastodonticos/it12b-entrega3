"use client";

// Crear un evento personalizado para la actualización del usuario
export const USER_LOGIN_EVENT = "user_login_updated";

// Función para emitir el evento cuando el usuario inicia sesión
export const emitUserLoginEvent = (userData) => {
  if (typeof window !== "undefined") {
    const event = new CustomEvent(USER_LOGIN_EVENT, { detail: userData });
    window.dispatchEvent(event);
  }
};

// Añadir esto al archivo existente

export const USER_LOGOUT_EVENT = "user_logout";

export const emitUserLogoutEvent = () => {
  if (typeof window !== "undefined") {
    const event = new CustomEvent(USER_LOGOUT_EVENT);
    window.dispatchEvent(event);
  }
};
