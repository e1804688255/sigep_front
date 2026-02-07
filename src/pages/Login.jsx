// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { Form, Input, Button, Card, message, Alert } from "antd"; // Importamos Alert
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import api from "../api/axiosConfig";
import logo from "../assets/logo-sifuturo.png"; 

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null); // Nuevo estado para la alerta roja
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setErrorMsg(null); // Limpiamos errores previos

    try {
      // 1. Enviamos usuario y contraseña
      const response = await api.post("/api/auth/login", values);
      const data = response.data;

      // 2. Verificamos si el backend dijo "accesoConcedido": true
      if (data.accesoConcedido === true) {
          message.success(data.mensaje); 
          
          // --- ESTA FUE LA CLAVE: VOLVEMOS A TU FORMATO ORIGINAL ---
          // Guardamos TODA la data tal cual lo hacías antes
          localStorage.setItem("usuario_data", JSON.stringify(data));
          
          // 4. Redirigimos al Dashboard
          navigate("/dashboard");
      } else {
          // Caso raro donde responde 200 OK pero accesoConcedido es false
          setErrorMsg("Acceso denegado. Revisa tus credenciales.");
      }

    } catch (error) {
      console.error("Error Login:", error);

      // --- AQUÍ INSERTAMOS LA LÓGICA DE LOS INTENTOS ---
      let mensajeParaMostrar = "Error de conexión o credenciales incorrectas";

      if (error.response && error.response.data) {
        const backendData = error.response.data;

        // Lógica para limpiar el mensaje sucio que viene del backend
        // Si viene como string JSON '{"mensaje":...}'
        if (typeof backendData === 'string' && backendData.includes('{')) {
             try {
                const parsed = JSON.parse(backendData);
                mensajeParaMostrar = parsed.detalles || parsed.mensaje || backendData;
             } catch (e) { mensajeParaMostrar = backendData; }
        } 
        // Si viene como objeto directo
        else if (backendData.detalles) {
            mensajeParaMostrar = backendData.detalles;
        } else if (backendData.message) {
             // A veces Spring mete el JSON dentro del message
             if (backendData.message.startsWith('{')) {
                try {
                    const parsed = JSON.parse(backendData.message);
                    mensajeParaMostrar = parsed.detalles || parsed.mensaje; 
                } catch (e) { mensajeParaMostrar = backendData.message; }
             } else {
                 mensajeParaMostrar = backendData.message;
             }
        }
      }

      // Evitamos mostrar "No message available"
      if (mensajeParaMostrar === "No message available") mensajeParaMostrar = "Credenciales incorrectas.";

      // Seteamos el estado para que aparezca la cajita roja
      setErrorMsg(mensajeParaMostrar);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f0f2f5" }}>
      <Card style={{ width: 400, boxShadow: "0 4px 15px rgba(0,0,0,0.1)", borderRadius: 10, textAlign: "center" }}>
        <div style={{ marginBottom: 30 }}>
          <img src={logo} alt="Sí Futuro" style={{ height: 60 }} />
          <h2 style={{ color: "#003a8c", marginTop: 10 }}>SIGEP</h2>
        </div>

        {/* --- NUEVA ALERTA ROJA --- */}
        {errorMsg && (
          <Alert
            message="Error de Ingreso"
            description={errorMsg}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMsg(null)}
            style={{ marginBottom: 20, textAlign: 'left' }}
          />
        )}

        <Form name="login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: true, message: "Ingresa tu usuario" }]}>
            <Input prefix={<UserOutlined />} placeholder="Usuario" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: "Ingresa tu contraseña" }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Contraseña" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Ingresar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;