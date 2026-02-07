// src/components/MainLayout.jsx
import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, theme, Avatar, Dropdown } from "antd";
import { useNavigate, Outlet, Link } from "react-router-dom";
import logo from "../assets/logo-sifuturo.png";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
  HomeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  TeamOutlined,
  LockOutlined,
  BankOutlined,
  MedicineBoxOutlined,
  FileTextOutlined, // Para Mis Permisos
  CheckSquareOutlined, // Para Bandeja Solicitudes
  BarChartOutlined, // Para Reportes
  UsergroupAddOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

// 2. DICCIONARIO DE ICONOS: Traduce lo que envía Java a Componentes React
const iconMap = {
  home: <HomeOutlined />,
  user: <UserOutlined />,
  clock: <ClockCircleOutlined />,
  heart: <HeartOutlined />, // Icono de corazón simple para el empleado
  users: <TeamOutlined />,
  lock: <LockOutlined />,
  building: <BankOutlined />,

  // --- NUEVOS ---
  "file-text": <FileTextOutlined />, // Mis Permisos
  "check-square": <CheckSquareOutlined />, // Aprobar Solicitudes
  "bar-chart": <BarChartOutlined />, // Reportes
  "medicine-box": <MedicineBoxOutlined />, // Gestión Médica (Doctor)
};

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [userData, setUserData] = useState(null);

  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 3. Al cargar el Dashboard, leemos lo que guardó el Login
  useEffect(() => {
    const dataGuardada = localStorage.getItem("usuario_data");

    if (dataGuardada) {
      const data = JSON.parse(dataGuardada);
      setUserData(data);

      // Transformamos los menús de Java al formato de Ant Design
      const menusFormateados = data.menus.map((item) => ({
        key: item.ruta, // Usamos la ruta como llave única (/home, /mi-perfil)
        icon: iconMap[item.icono] || <UserOutlined />, // Si no encuentra el icono, pone uno por defecto
        label: item.titulo,
        onClick: () => navigate(`/dashboard${item.ruta}`), // Navegamos a /dashboard/home, etc.
      }));

      setMenuItems(menusFormateados);
    } else {
      // Si no hay datos, mandar al login
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("usuario_data");
    navigate("/");
  };

  // Menú desplegable del usuario (arriba a la derecha)
  const userMenu = {
    items: [
      {
        key: "1",
        label: "Cerrar Sesión",
        icon: <LogoutOutlined />,
        onClick: handleLogout,
        danger: true,
      },
      {
        key: "gestion-personal",
        icon: <UsergroupAddOutlined />,
        label: (
          <Link to="/dashboard/gestion-personal">Gestión de Personal</Link>
        ),
        // Opcional: Si quieres ocultarlo a usuarios normales más adelante, aquí pondremos la lógica
      },
    ],
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
        <div style={{ padding: "16px", textAlign: "center" }}>
          <img
            src={logo}
            alt="Logo"
            style={{ maxWidth: "100%", height: "40px" }}
          />
        </div>

        {/* 4. Aquí renderizamos los ítems dinámicos */}
        <Menu
          theme="light"
          mode="inline"
          defaultSelectedKeys={["/home"]}
          items={menuItems}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: "16px", width: 64, height: 64 }}
            />
            <h3>Sistema de Gestión (SIGEP)</h3>
          </div>

          {/* Avatar del usuario a la derecha */}
          <Dropdown menu={userMenu}>
            <div
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span>{userData?.username || "Usuario"}</span>
              <Avatar
                style={{ backgroundColor: "#003a8c" }}
                icon={<UserOutlined />}
              />
            </div>
          </Dropdown>
        </Header>

        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
