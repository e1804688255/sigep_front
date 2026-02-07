import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Button,
  Card,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  Space,
  Typography,
  notification,
  Badge,
} from "antd";
import {
  PlusOutlined,
  FilePdfOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined
} from "@ant-design/icons";
import api from "../api/axiosConfig";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const MisPermisos = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const usuario = JSON.parse(localStorage.getItem("usuario_data"));
  const idEmpleado = usuario?.idEmpleado || 1;

  // Cargar historial
  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/solicitudes/empleado/${idEmpleado}`);
      setSolicitudes(res.data);
    } catch (error) {
      notification.error({ message: "Error al cargar solicitudes" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  // Convertir archivo a Base64 para el Backend
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      let evidenciaStr = "";
      if (values.evidencia?.file) {
        evidenciaStr = await getBase64(values.evidencia.file.originFileObj);
      }

      const payload = {
        idEmpleado: idEmpleado,
        tipo: values.tipo,
        fechaInicio: values.rango[0].format("YYYY-MM-DDTHH:mm:ss"),
        fechaFin: values.rango[1].format("YYYY-MM-DDTHH:mm:ss"),
        motivo: values.motivo,
        evidenciaBase64: evidenciaStr,
      };

      await api.post("/api/solicitudes", payload);
      notification.success({
        message: "Solicitud enviada",
        description: "Ahora espera la aprobación de tu jefe.",
      });
      setIsModalVisible(false);
      form.resetFields();
      cargarSolicitudes();
    } catch (error) {
      notification.error({
        message: "Error",
        description:
          error.response?.data?.mensaje || "No se pudo crear la solicitud",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mapeo de estados para visualización
  const getStatusTag = (estado) => {
    const config = {
      PENDIENTE_APROBACION_JEFE: {
        color: "orange",
        text: "Pendiente Jefe",
        icon: <ClockCircleOutlined />,
      },
      PENDIENTE_AUTORIZACION_TH: {
        color: "blue",
        text: "Pendiente TH",
        icon: <SyncOutlined spin />,
      },
      APROBADO: {
        color: "green",
        text: "Aprobado",
        icon: <CheckCircleOutlined />,
      },
      RECHAZADO_TH: {
        color: "red",
        text: "Rechazado",
        icon: <CloseCircleOutlined />,
      },
    };
    const item = config[estado] || { color: "default", text: estado };
    return (
      <Tag icon={item.icon} color={item.color}>
        {item.text}
      </Tag>
    );
  };

  const columns = [
    {
      title: "Fecha Solicitud",
      dataIndex: "fechaSolicitud",
      render: (f) => dayjs(f).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Tipo",
      dataIndex: "tipo",
      render: (t) => <Text strong>{t}</Text>,
    },
    {
      title: "Periodo",
      key: "periodo",
      render: (_, r) => (
        <div style={{ fontSize: "12px" }}>
          {dayjs(r.fechaInicio).format("DD/MM/YY HH:mm")} <br />
          <Text type="secondary">al</Text>{" "}
          {dayjs(r.fechaFin).format("DD/MM/YY HH:mm")}
        </div>
      ),
    },
    {
      title: "Estado",
      dataIndex: "estadoSolicitud",
      render: (e) => getStatusTag(e),
    },
    {
      title: "Evidencia",
      dataIndex: "evidenciaBase64",
      render: (base64) =>
        base64 ? (
          <Button
            type="link"
            icon={<FilePdfOutlined />}
            onClick={() => {
              const win = window.open();
              win.document.write(
                `<iframe src="${base64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`,
              );
            }}
          >
            Ver
          </Button>
        ) : (
          "N/A"
        ),
    },
  ];

  return (
    <div style={{ padding: "30px" }}>
      <Card
        title={
          <>
            <HistoryOutlined /> Mis Permisos y Ausencias
          </>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Nueva Solicitud
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={solicitudes}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="Nueva Solicitud de Ausencia"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="tipo"
            label="Tipo de Permiso"
            rules={[{ required: true }]}
          >
            <Select placeholder="Selecciona el tipo">
              <Select.Option value="VACACIONES">Vacaciones</Select.Option>
              <Select.Option value="CITA_MEDICA">Cita Médica</Select.Option>
              <Select.Option value="INCAPACIDAD_MEDICA">
                Incapacidad (Reposos)
              </Select.Option>
              <Select.Option value="CALAMIDAD_DOMESTICA">
                Calamidad Doméstica
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="rango"
            label="Fecha y Hora (Desde/Hasta)"
            rules={[{ required: true }]}
          >
            <RangePicker
              showTime
              style={{ width: "100%" }}
              format="DD/MM/YYYY HH:mm"
            />
          </Form.Item>

          <Form.Item
            name="motivo"
            label="Motivo / Justificación"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="evidencia" label="Adjuntar Evidencia (PDF/Imagen)">
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<PlusOutlined />}>Seleccionar archivo</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MisPermisos;
