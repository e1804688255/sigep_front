import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Card,
  Divider,
  InputNumber,
  Space,
  Tag,
  Tabs,
  Tooltip,
  Descriptions,
  Alert,
} from "antd";
import {
  UserAddOutlined,
  ReloadOutlined,
  FilePdfOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import api from "../api/axiosConfig";
import ModalRegistroCandidato from "../components/ModalRegistroCandidato";

const { Option } = Select;

const GestionPersonal = () => {
  // --- ESTADOS ---
  const [cargos, setCargos] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalCandidatoOpen, setModalCandidatoOpen] = useState(false);

  // Estado del candidato seleccionado
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null);

  const [form] = Form.useForm();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [areasRes, rolesRes, cargosRes, personasRes] = await Promise.all([
        api.get("/api/areas"),
        api.get("/api/rol"),
        api.get("/api/cargos"),
        api.get("/api/personas"),
      ]);

      setAreas(areasRes.data);
      setRoles(rolesRes.data);
      setCargos(cargosRes.data);
      setPersonas(personasRes.data);
    } catch (error) {
      console.error(error);
      message.error("Error cargando la información.");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE SELECCIÓN ---
  const handleSeleccionarCandidato = (idPersona) => {
    const candidato = personas.find((p) => p.id === idPersona);
    if (candidato) {
      setCandidatoSeleccionado(candidato);
      form.setFieldsValue({
        salario: candidato.aspiracionSalarial,
        emailCorporativo: candidato.correo,
      });
    } else {
      setCandidatoSeleccionado(null);
      form.resetFields();
    }
  };

  // --- GUARDADO CORREGIDO ---
const handleGuardarEmpleado = async () => {
  try {
    const values = await form.validateFields();
    if (!candidatoSeleccionado) {
      message.warning("Debes seleccionar un candidato.");
      return;
    }

    setLoading(true);

    const fechaContratacionStr = values.fechaContratacion
      ? values.fechaContratacion.format("YYYY-MM-DD")
      : null;

    // --- PASO 1: ELIMINADO EL PUT /api/personas ---
    // Ya no lo hacemos aquí, el backend lo hará por nosotros.

    // --- PASO 2: CREAR EMPLEADO (Ahora es el primer paso) ---
    const empleadoPayload = {
      persona: { id: candidatoSeleccionado.id }, // Enviamos el ID del candidato
      area: { id: values.idArea },
      cargo: { id: values.idCargo },
      codigoEmpleado: values.codigoEmpleado,
      salarioBase: values.salario,
      emailCorporativo: values.emailCorporativo,
      fechaContratacion: fechaContratacionStr,
      tipoContrato: "INDEFINIDO",
      modalidadTrabajo: "PRESENCIAL",
      moneda: "USD",
    };

    // Al llamar a este POST, el backend validará que sea CANDIDATO y lo subirá a EMPLEADO
    const empleadoRes = await api.post("/api/empleado", empleadoPayload);
    const idEmpleadoNuevo = empleadoRes.data.idEmpleado;

    // --- PASO 3: CREAR USUARIO ---
    const usuarioPayload = {
      idEmpleado: idEmpleadoNuevo,
      password: values.password,
      rolesIds: values.roles,
    };

    await api.post("/api/usuarios", usuarioPayload);

    message.success(`¡Contratación exitosa de ${candidatoSeleccionado.nombres}!`);
    cerrarDrawer();
    cargarDatos();
  } catch (error) {
    console.error("Error:", error);
    message.error(error.response?.data?.mensaje || "Error al procesar.");
  } finally {
    setLoading(false);
  }
};

  const cerrarDrawer = () => {
    setDrawerVisible(false);
    setCandidatoSeleccionado(null);
    form.resetFields();
  };

  const abrirModalCandidatoDesdeDrawer = () => {
    setDrawerVisible(false);
    setTimeout(() => setModalCandidatoOpen(true), 300);
  };
  

  // --- COLUMNAS TABLAS ---
  const baseColumns = [
    { title: "Cédula", dataIndex: "cedula", key: "cedula" },
    {
      title: "Nombre Completo",
      key: "nombre",
      render: (_, r) => <strong>{r.nombres} {r.apellidos}</strong>,
    },
    { title: "Correo", dataIndex: "correo", key: "correo" },
    {
      title: "Cargo Postulación",
      key: "cargo",
      render: (_, r) => <Tag color="cyan">{r.cargoPostulacion?.nombre || "N/A"}</Tag>,
    },
  ];

  const columnsEmpleados = [
    ...baseColumns,
    {
      title: "Estado",
      key: "est",
      render: () => <Tag color="green" icon={<CheckCircleOutlined />}>ACTIVO</Tag>,
    },
  ];

  const columnsCandidatos = [
    ...baseColumns,
    {
      title: "Aspiración",
      dataIndex: "aspiracionSalarial",
      key: "asp",
      render: (val) => (val ? `$${val}` : "-"),
    },
    {
      title: "Hoja de Vida",
      key: "cv",
      render: (_, record) => (
        record.hojaVidaBase64 && (
          <Tooltip title="Ver PDF">
            <Button type="text" danger icon={<FilePdfOutlined />} />
          </Tooltip>
        )
      ),
    },
  ];

  const columnsRechazados = [
    ...baseColumns,
    {
      title: "Estado",
      key: "est",
      render: () => <Tag color="red">RECHAZADO</Tag>,
    },
  ];

 

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="Gestión de Recursos Humanos"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={cargarDatos} />
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setDrawerVisible(true)}
            >
              Procesar Contratación
            </Button>
            <Button
              style={{ backgroundColor: "#52c41a", color: "white", borderColor: "#52c41a" }}
              icon={<FilePdfOutlined />}
              onClick={() => setModalCandidatoOpen(true)}
            >
              Nuevo Candidato
            </Button>
          </Space>
        }
      >
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: `Empleados (${personas.filter((p) => p.estadoPersona === "EMPLEADO").length})`,
              children: <Table dataSource={personas.filter((p) => p.estadoPersona === "EMPLEADO")} columns={columnsEmpleados} rowKey="id" loading={loading} />,
            },
            {
              key: "2",
              label: `Candidatos (${personas.filter((p) => p.estadoPersona === "CANDIDATO").length})`,
              children: <Table dataSource={personas.filter((p) => p.estadoPersona === "CANDIDATO")} columns={columnsCandidatos} rowKey="id" loading={loading} />,
            },
            {
              key: "3",
              label: `Rechazados (${personas.filter((p) => p.estadoPersona === "RECHAZADO").length})`,
              children: <Table dataSource={personas.filter((p) => p.estadoPersona === "RECHAZADO")} columns={columnsRechazados} rowKey="id" loading={loading} />,
            },
          ]}
        />
      </Card>

      <Drawer
        title="Formalización de Contrato"
        width={720}
        onClose={cerrarDrawer}
        open={drawerVisible}
        extra={
          <Space>
            <Button onClick={cerrarDrawer}>Cancelar</Button>
            <Button
              onClick={handleGuardarEmpleado}
              type="primary"
              loading={loading}
              disabled={!candidatoSeleccionado}
            >
              Confirmar Contratación
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Alert
            message="Selección de Candidato"
            description="Al confirmar, el sistema generará automáticamente las credenciales de acceso."
            type="info"
            showIcon
            style={{ marginBottom: 15 }}
          />

          <Form.Item label="Buscar Candidato" required>
            <Select
              showSearch
              placeholder="Cédula o Nombre..."
              optionFilterProp="label"
              onChange={handleSeleccionarCandidato}
              options={personas
                .filter((p) => p.estadoPersona === "CANDIDATO")
                .map((p) => ({
                  value: p.id,
                  label: `${p.cedula} - ${p.nombres} ${p.apellidos}`,
                }))}
            />
          </Form.Item>

          {!candidatoSeleccionado ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <UserOutlined style={{ fontSize: 40, color: '#ccc' }} />
              <p>Seleccione un candidato para continuar</p>
              <Button type="link" onClick={abrirModalCandidatoDesdeDrawer}>
                O registre un candidato nuevo
              </Button>
            </div>
          ) : (
            <>
              <Descriptions title="Información Personal" bordered size="small" column={2}>
                <Descriptions.Item label="Cédula">{candidatoSeleccionado.cedula}</Descriptions.Item>
                <Descriptions.Item label="Correo">{candidatoSeleccionado.correo}</Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Datos Laborales</Divider>
              <Space style={{ display: "flex" }} align="baseline">
                <Form.Item name="codigoEmpleado" label="Código Interno" rules={[{ required: true }]}>
                  <Input placeholder="DIR-003" />
                </Form.Item>
                <Form.Item name="fechaContratacion" label="Fecha Inicio" rules={[{ required: true }]}>
                  <DatePicker />
                </Form.Item>
                <Form.Item name="salario" label="Sueldo Acordado" rules={[{ required: true }]}>
                  <InputNumber prefix="$" style={{ width: '100%' }} />
                </Form.Item>
              </Space>

              <Space style={{ display: "flex" }} align="baseline">
                <Form.Item name="idArea" label="Departamento" rules={[{ required: true }]} style={{ width: 200 }}>
                  <Select placeholder="Seleccione">
                    {areas.map(a => <Option key={a.id} value={a.id}>{a.nombre}</Option>)}
                  </Select>
                </Form.Item>
                <Form.Item name="idCargo" label="Cargo Oficial" rules={[{ required: true }]} style={{ width: 200 }}>
                  <Select placeholder="Seleccione">
                    {cargos.map(c => <Option key={c.id} value={c.id}>{c.nombre}</Option>)}
                  </Select>
                </Form.Item>
              </Space>

              <Form.Item name="emailCorporativo" label="Email Corporativo Asignado" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="juan.perez@empresa.com" />
              </Form.Item>

              <Divider orientation="left">Seguridad y Accesos</Divider>
              <Alert 
                message="Generación Automática" 
                description="El nombre de usuario se generará siguiendo la regla: InicialNombre + Apellido." 
                type="warning" 
                style={{ marginBottom: 15 }}
              />

              <Form.Item name="password" label="Contraseña Temporal" rules={[{ required: true, min: 6 }]}>
                <Input.Password placeholder="Establezca una clave inicial" />
              </Form.Item>

              <Form.Item name="roles" label="Roles / Permisos del Sistema" rules={[{ required: true }]}>
                <Select mode="multiple" placeholder="Seleccione roles...">
                  {roles.map(r => <Option key={r.id} value={r.id}>{r.nombre}</Option>)}
                </Select>
              </Form.Item>
            </>
          )}
        </Form>
      </Drawer>

      <ModalRegistroCandidato
        open={modalCandidatoOpen}
        onClose={() => setModalCandidatoOpen(false)}
        onSuccess={cargarDatos}
      />
    </div>
  );
};

export default GestionPersonal;