import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
    baseURL: 'http://localhost:8080', // Ajusta a tu puerto de Spring Boot
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para manejar errores globalmente si prefieres centralizarlos
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Si el backend está caído
        if (!error.response) {
            message.error("Error de conexión: El servidor no responde");
        }
        return Promise.reject(error);
    }
);

export default api;