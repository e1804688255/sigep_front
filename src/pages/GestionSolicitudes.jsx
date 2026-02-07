import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Button,
  Card,
  Space,
  Typography,
  notification,
  Modal,
  Input,
  Tooltip,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import api from "../api/axiosConfig";
import dayjs from "dayjs";

const { Text } = Typography;
const { TextArea } = Input;

const GestionSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalRechazo, setModalRechazo] = useState({
    visible: false,
    id: null,
  });
  const [motivoRechazo, setMotivoRechazo] = useState("");

  // 1. OBTENER INFORMACIÓN DEL USUARIO LOGUEADO
  // Extraemos el objeto completo para tener acceso a los roles
  const user = JSON.parse(localStorage.getItem("usuario_data")) || {};
  const rolesUsuario = user.roles || [];

  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/solicitudes");
      setSolicitudes(res.data);
    } catch (error) {
      notification.error({
        message: "Error de carga",
        description: "No se pudieron obtener las solicitudes del servidor.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  // 2. LÓGICA PARA VISUALIZAR EVIDENCIA PDF
  const verEvidencia = (base64String) => {
    if (!base64String)
      return notification.warning({ message: "Sin archivo adjunto" });

    try {
      const base64Pure = base64String.replace(
        /^data:application\/pdf;base64,/,
        "",
      );
      const byteCharacters = atob(base64Pure);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(blob);

      const newWindow = window.open(fileURL, "_blank");
      if (newWindow) {
        newWindow.onload = () => {
          setTimeout(() => URL.revokeObjectURL(fileURL), 100);
        };
      }
    } catch (e) {
      notification.error({ message: "Error al procesar el archivo PDF" });
    }
  };

  // 3. ACCIONES DE GESTIÓN (APROBAR / RECHAZAR)
  const handleAprobar = async (id) => {
    try {
      // Enviamos quién ejecuta la acción para auditoría en el backend
      await api.put(`/api/solicitudes/${id}/aprobar`, {
        ejecutadoPor: user.idEmpleado,
      });
      notification.success({ message: "Solicitud procesada correctamente" });
      cargarSolicitudes();
    } catch (error) {
      const msg =
        error.response?.data?.message || "Error al procesar la aprobación";
      notification.error({ message: msg });
    }
  };

  const confirmarRechazo = async () => {
    if (!motivoRechazo.trim())
      return notification.warning({
        message: "Debe indicar un motivo de rechazo",
      });

    try {
      await api.put(`/api/solicitudes/${modalRechazo.id}/rechazar`, {
        motivo: motivoRechazo,
        ejecutadoPor: user.idEmpleado,
      });
      notification.info({ message: "Solicitud rechazada" });
      setModalRechazo({ visible: false, id: null });
      setMotivoRechazo("");
      cargarSolicitudes();
    } catch (error) {
      notification.error({ message: "Error al registrar el rechazo" });
    }
  };

  // 4. CONFIGURACIÓN DE COLUMNAS
  const columns = [
    {
      title: "Empleado",
      dataIndex: "nombreEmpleado",
      render: (text) => <Text strong>{text || "Cargando..."}</Text>,
    },
    {
      title: "Tipo",
      dataIndex: "tipo",
      render: (tipo) => <Tag color="blue">{tipo}</Tag>,
    },
    {
      title: "Desde/Hasta",
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: "12px" }}>
            {dayjs(r.fechaInicio).format("DD MMM YYYY")}
          </Text>
          <Text type="secondary" style={{ fontSize: "10px" }}>
            al {dayjs(r.fechaFin).format("DD MMM YYYY")}
          </Text>
        </Space>
      ),
    },
    {
      title: "Evidencia",
      dataIndex: "evidenciaBase64",
      align: "center",
      render: (val) =>
        val ? (
          <Tooltip title="Ver Certificado PDF">
            <Button
              type="text"
              danger
              icon={<FilePdfOutlined style={{ fontSize: "22px" }} />}
              onClick={() => verEvidencia(val)}
            />
          </Tooltip>
        ) : (
          <Text type="secondary">---</Text>
        ),
    },
    {
      title: "Estado Actual",
      dataIndex: "estadoSolicitud",
      render: (estado) => {
        let color = "orange";
        if (estado === "APROBADO") color = "green";
        if (estado.includes("RECHAZADO")) color = "red";
        return <Tag color={color}>{estado.replace(/_/g, " ")}</Tag>;
      },
    },
    {
      title: "Acciones Administrativas",
      key: "acciones",
      render: (_, record) => {
        // --- LÓGICA DE ROLES PARA LA BANDEJA ---
        const esAdmin = rolesUsuario.includes("ROLE_ADMIN");
        const esJefe = rolesUsuario.includes("ROLE_JEFE") || esAdmin;
        const esTH = rolesUsuario.includes("ROLE_TH") || esAdmin;

        // ¿Le toca a este usuario firmar ahora mismo?
        const pendienteMiFirma =
          (esJefe && record.estadoSolicitud === "PENDIENTE_APROBACION_JEFE") ||
          (esTH && record.estadoSolicitud === "PENDIENTE_AUTORIZACION_TH");

        if (pendienteMiFirma) {
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                style={{ background: "#52c41a", borderColor: "#52c41a" }}
                onClick={() => handleAprobar(record.id)}
              >
                Aprobar
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() =>
                  setModalRechazo({ visible: true, id: record.id })
                }
              >
                Rechazar
              </Button>
            </Space>
          );
        }

        return (
          <Text type="secondary" italic style={{ fontSize: "11px" }}>
            Sin acciones pendientes
          </Text>
        );
      },
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <Card
        title={
          <Space>
            <EyeOutlined />
            <span>Bandeja de Decisiones Administrativas</span>
          </Space>
        }
        extra={
          <Button
            type="dashed"
            icon={<ReloadOutlined />}
            onClick={cargarSolicitudes}
          >
            Actualizar
          </Button>
        }
        style={{
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <Table
          columns={columns}
          dataSource={solicitudes}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          locale={{
            emptyText: "No hay solicitudes pendientes de su aprobación",
          }}
        />
      </Card>

      <Modal
        title="Confirmar Rechazo de Solicitud"
        open={modalRechazo.visible}
        onOk={confirmarRechazo}
        onCancel={() => {
          setModalRechazo({ visible: false, id: null });
          setMotivoRechazo("");
        }}
        okText="Confirmar Rechazo"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
        centered
      >
        <div style={{ marginBottom: 15 }}>
          <Text>
            Por favor, ingrese el motivo del rechazo. El empleado podrá
            visualizar este comentario.
          </Text>
        </div>
        <TextArea
          rows={4}
          value={motivoRechazo}
          onChange={(e) => setMotivoRechazo(e.target.value)}
          placeholder="Ej: Fechas no disponibles o falta de sustento médico."
          maxLength={255}
          showCount
        />
      </Modal>
    </div>
  );
};

export default GestionSolicitudes;
