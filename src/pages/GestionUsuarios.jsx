import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Card,
  Tag,
  Space,
  Modal,
  Input,
  message,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  LockOutlined,
  UnlockOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import api from "../api/axiosConfig";

const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para el Modal de Reset Password
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/usuarios?t=${new Date().getTime()}`);
      setUsuarios(res.data);
    } catch (error) {
      console.error(error);
      message.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGICA 1: CAMBIAR ESTADO (BLOQUEAR/DESBLOQUEAR) ---
  const toggleEstadoUsuario = async (usuario) => {
    try {
      // NOTA: Esto asume que tienes un endpoint PUT para actualizar el estado
      // Si no lo tienes, deberemos crearlo en Spring Boot.
      // Por ahora simulamos que enviamos el estado opuesto.
      const id = usuario.idUsuario;
      const nuevoEstado = !usuario.estado;

      await api.put(`/api/usuarios/${id}/estado`, {
        estado: nuevoEstado,
      });

      message.success(
        `Usuario ${nuevoEstado ? "activado" : "bloqueado"} correctamente`,
      );
      cargarUsuarios();
    } catch (error) {
      message.error("Error al cambiar estado");
      console.error(error);
    }
  };

  // --- LOGICA 2: RESET PASSWORD ---
  const abrirModalPassword = (usuario) => {
    setSelectedUser(usuario);
    setNewPassword(""); // Limpiar campo
    setIsModalOpen(true);
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      message.warning("Por favor escribe la nueva contraseña");
      return;
    }

    try {
      const id = selectedUser.idUsuario;
      await api.put(`/api/usuarios/${id}/reset-password`, {
        nuevaClave: newPassword,
      });

      message.success(`Contraseña actualizada para ${selectedUser.username}`);
      setIsModalOpen(false);
    } catch (error) {
      // Si falla, mostramos error (puede que falte el endpoint)
      message.error("Error al actualizar contraseña");
      console.error(error);
    }
  };

  // --- COLUMNAS ---
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 60,
    },
    {
      title: "Usuario",
      dataIndex: "username",
      key: "username",
      render: (text) => (
        <span>
          <UserOutlined style={{ marginRight: 8, color: "#1890ff" }} />
          <strong>{text}</strong>
        </span>
      ),
    },
    {
      title: "Empleado Asociado",
      key: "empleado",
      render: (_, record) => {
        const p = record.empleado?.persona;
        return p ? (
          `${p.nombres} ${p.apellidos}`
        ) : (
          <span style={{ color: "red" }}>Sin Asignar</span>
        );
      },
    },
    {
      title: "Roles",
      dataIndex: "roles",
      key: "roles",
      render: (roles) => (
        <>
          {roles &&
            roles.map((rol) => (
              <Tag color="geekblue" key={rol.id}>
                {rol.nombre}
              </Tag>
            ))}
        </>
      ),
    },
    {
      title: "Estado Acceso",
      dataIndex: "estado",
      key: "estado",
      render: (estado) => (
        <Tag color={estado ? "success" : "error"}>
          {estado ? "HABILITADO" : "BLOQUEADO"}
        </Tag>
      ),
    },
    {
      title: "Seguridad IT",
      key: "acciones",
      render: (_, record) => (
        <Space>
          <Tooltip title="Resetear Contraseña">
            <Button
              icon={<SafetyCertificateOutlined />}
              onClick={() => abrirModalPassword(record)}
              style={{ color: "#faad14", borderColor: "#faad14" }}
            >
              Clave
            </Button>
          </Tooltip>

          <Tooltip
            title={record.estado ? "Bloquear Acceso" : "Desbloquear Acceso"}
          >
            <Popconfirm
              title={
                record.estado
                  ? "¿Bloquear a este usuario?"
                  : "¿Reactivar a este usuario?"
              }
              onConfirm={() => toggleEstadoUsuario(record)}
              okText="Sí"
              cancelText="No"
            >
              <Button
                type={record.estado ? "default" : "primary"}
                danger={record.estado} // Rojo si está activo (para bloquear)
                icon={record.estado ? <LockOutlined /> : <UnlockOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="Gestión de Seguridad y Usuarios (IT)"
        extra={
          <Button icon={<ReloadOutlined />} onClick={cargarUsuarios}>
            Recargar
          </Button>
        }
      >
        <Table
          dataSource={usuarios}
          columns={columns}
          rowKey="idUsuario"
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* MODAL PARA CAMBIO DE CLAVE */}
      <Modal
        title={`Resetear Contraseña: ${selectedUser?.username}`}
        open={isModalOpen}
        onOk={handleResetPassword}
        onCancel={() => setIsModalOpen(false)}
        okText="Guardar Nueva Clave"
        cancelText="Cancelar"
      >
        <p>
          Ingresa la nueva contraseña temporal para el usuario. <br />
          <small style={{ color: "gray" }}>
            El usuario deberá usar esta clave para ingresar.
          </small>
        </p>
        <Input.Password
          placeholder="Nueva contraseña (ej: 12345)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          iconRender={(visible) =>
            visible ? <UnlockOutlined /> : <LockOutlined />
          }
        />
      </Modal>
    </div>
  );
};

export default GestionUsuarios;
