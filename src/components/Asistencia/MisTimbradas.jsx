import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  notification,
  DatePicker,
} from "antd";
import {
  LoginOutlined,
  LogoutOutlined,
  CoffeeOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import api from "../../api/axiosConfig";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const MisTimbradas = () => {
  const [timbradas, setTimbradas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ultimoRegistro, setUltimoRegistro] = useState(null);
  const [fechas, setFechas] = useState([dayjs().startOf("month"), dayjs().endOf("day")]);

  const dataGuardada = JSON.parse(localStorage.getItem("usuario_data"));
  const idEmpleado = dataGuardada?.idEmpleado || 1;

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        inicio: fechas[0].startOf("day").format("YYYY-MM-DDTHH:mm:ss"),
        fin: fechas[1].endOf("day").format("YYYY-MM-DDTHH:mm:ss"),
      };
      const res = await api.get(`/api/timbradas/empleado/${idEmpleado}`, { params });
      setTimbradas(res.data);

      if (res.data.length > 0) {
        const hoy = dayjs().startOf("day");
        // Buscamos el último del día actual para la lógica de botones
        const ultimaHoy = res.data.find(t => dayjs(t.fechaHora).isAfter(hoy));
        setUltimoRegistro(ultimaHoy || null);
      }
    } catch (error) {
      message.error("Error al sincronizar datos");
    } finally {
      setLoading(false);
    }
  }, [idEmpleado, fechas]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // --- LÓGICA DE AGRUPACIÓN ---
  const transformarDatosParaTabla = (datos) => {
    const grupos = {};
    datos.forEach((t) => {
      const fechaKey = dayjs(t.fechaHora).format("YYYY-MM-DD");
      if (!grupos[fechaKey]) {
        grupos[fechaKey] = {
          key: fechaKey,
          fecha: fechaKey,
          entrada: null,
          almuerzoIn: null,
          almuerzoFin: null,
          salida: null,
        };
      }
      if (t.tipo === "ENTRADA") grupos[fechaKey].entrada = t.fechaHora;
      if (t.tipo === "ALMUERZO_INICIO") grupos[fechaKey].almuerzoIn = t.fechaHora;
      if (t.tipo === "ALMUERZO_FIN") grupos[fechaKey].almuerzoFin = t.fechaHora;
      if (t.tipo === "SALIDA") grupos[fechaKey].salida = t.fechaHora;
    });
    return Object.values(grupos).sort((a, b) => dayjs(b.fecha).diff(dayjs(a.fecha)));
  };

  const ejecutarTimbrada = async (tipo) => {
    setLoading(true);
    try {
      const pos = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve({ lat: null, lng: null })
        );
      });

      await api.post("/api/timbradas", {
        idEmpleado,
        tipo,
        latitud: pos.lat,
        longitud: pos.lng,
        observacion: "Marcación desde Portal Web",
      });

      notification.success({ message: "Registro Exitoso", placement: "bottomRight" });
      cargarDatos();
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.mensaje || "Error al registrar",
      });
    } finally {
      setLoading(false);
    }
  };

  // Lógica de botones
  const tipoActual = ultimoRegistro?.tipo;
  const isEntradaDisabled = !!tipoActual;
  const isAlmuerzoInDisabled = tipoActual !== "ENTRADA";
  const isAlmuerzoFinDisabled = tipoActual !== "ALMUERZO_INICIO";
  const isSalidaDisabled = !(tipoActual === "ENTRADA" || tipoActual === "ALMUERZO_FIN");

  const columns = [
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      render: (f) => <b>{dayjs(f).format("ddd DD/MM")}</b>,
    },
    {
      title: "Entrada",
      dataIndex: "entrada",
      render: (h) => h ? dayjs(h).format("hh:mm A") : <Text type="secondary">-</Text>,
    },
    {
      title: "Almuerzo",
      key: "almuerzo",
      render: (_, r) => (
        <Space>
          <Text type={r.almuerzoIn ? "default" : "secondary"}>
            {r.almuerzoIn ? dayjs(r.almuerzoIn).format("HH:mm") : "--:--"}
          </Text>
          <Text type="secondary">→</Text>
          <Text type={r.almuerzoFin ? "default" : "secondary"}>
            {r.almuerzoFin ? dayjs(r.almuerzoFin).format("HH:mm") : "--:--"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Salida",
      dataIndex: "salida",
      render: (h) => h ? dayjs(h).format("hh:mm A") : <Text type="secondary">-</Text>,
    },
    {
      title: "Estado",
      key: "estado",
      align: "center",
      render: (_, r) => {
        const completo = r.entrada && r.salida;
        return completo ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>Completo</Tag>
        ) : (
          <Tag color="warning" icon={<ExclamationCircleOutlined />}>Incompleto</Tag>
        );
      },
    },
  ];

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2}><ClockCircleOutlined /> Mi Control de Asistencia</Title>
      
      <Row gutter={[24, 24]} style={{ marginTop: "25px" }}>
        <Col xs={24} lg={8}>
          <Card title="Panel de Marcación" className="shadow-sm">
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              <Button type="primary" block size="large" icon={<LoginOutlined />} 
                disabled={isEntradaDisabled} loading={loading} onClick={() => ejecutarTimbrada("ENTRADA")}>
                INICIAR JORNADA
              </Button>
              <Row gutter={12}>
                <Col span={12}>
                  <Button block icon={<CoffeeOutlined />} disabled={isAlmuerzoInDisabled}
                    loading={loading} onClick={() => ejecutarTimbrada("ALMUERZO_INICIO")}>ALMUERZO</Button>
                </Col>
                <Col span={12}>
                  <Button block icon={<SyncOutlined />} disabled={isAlmuerzoFinDisabled}
                    loading={loading} onClick={() => ejecutarTimbrada("ALMUERZO_FIN")}>RETORNO</Button>
                </Col>
              </Row>
              <Button danger type="primary" block size="large" icon={<LogoutOutlined />}
                disabled={isSalidaDisabled} loading={loading} onClick={() => ejecutarTimbrada("SALIDA")}>
                FINALIZAR JORNADA
              </Button>
            </Space>
          </Card>

          <Card title="Resumen de Hoy" style={{ marginTop: 20 }}>
            <Statistic 
                title="Estado Actual" 
                value={tipoActual ? tipoActual.replace("_", " ") : "Pendiente"} 
                valueStyle={{ color: tipoActual ? "#1890ff" : "#cf1322", fontSize: "18px" }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card 
            title={<span><HistoryOutlined /> Resumen de Asistencia</span>}
            extra={
              <Space>
                <RangePicker defaultValue={fechas} onChange={(v) => v && setFechas(v)} />
                <Button type="primary" onClick={cargarDatos}>Filtrar</Button>
              </Space>
            }
          >
            <Table 
              columns={columns} 
              dataSource={transformarDatosParaTabla(timbradas)} 
              loading={loading}
              pagination={{ pageSize: 7 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MisTimbradas;