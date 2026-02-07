import React, { useState, useEffect } from "react";
import { 
  Drawer, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Upload, 
  Button, 
  message, 
  Row, 
  Col, 
  Divider, 
  Space,
  InputNumber
} from "antd";
import { UploadOutlined, SaveOutlined, UserAddOutlined } from "@ant-design/icons";
import api from "../api/axiosConfig";

const { Option } = Select;

const ModalRegistroCandidato = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [cargos, setCargos] = useState([]);

  useEffect(() => {
    if (open) {
      cargarCargos();
    }
  }, [open]);

  const cargarCargos = async () => {
    try {
      const res = await api.get("/api/cargos");
      setCargos(res.data);
    } catch (error) {
      console.error("Error cargando cargos", error);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const fechaNacimientoStr = values.fechaNacimiento 
        ? values.fechaNacimiento.format("YYYY-MM-DD") 
        : null;

      let hojaVidaBase64 = null;
      // Validación segura para el archivo
      if (values.hojaVida && values.hojaVida.length > 0) {
        const file = values.hojaVida[0].originFileObj; 
        hojaVidaBase64 = await toBase64(file);
      }

      const payload = {
        cedula: values.cedula,
        nombres: values.nombres,
        apellidos: values.apellidos,
        correo: values.correo,
        telefono: values.celular,
        fechaNacimiento: fechaNacimientoStr,
        estadoPersona: "CANDIDATO",
        aspiracionSalarial: values.aspiracionSalarial,
        hojaVidaBase64: hojaVidaBase64,
        cargoPostulacion: { id: values.idCargo } 
      };

      await api.post("/api/personas/candidato", payload);
      
      message.success("¡Candidato registrado exitosamente!");
      form.resetFields();
      if (onSuccess) onSuccess(); 
      if (onClose) onClose();
    } catch (error) {
      console.error(error);
      message.error("Error al registrar el candidato.");
    } finally {
      setLoading(false);
    }
  };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  // Esto evita errores al leer el archivo desde el formulario
  const normFile = (e) => {
    if (Array.isArray(e)) return e;
    return e?.fileList;
  };

  return (
    <Drawer
      title={
        <Space>
           <UserAddOutlined />
           <span>Registrar Nuevo Postulante</span>
        </Space>
      }
      width={720}
      onClose={onClose}
      open={open}
      extra={
        <Space>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={() => form.submit()} type="primary" loading={loading} icon={<SaveOutlined />}>
            Guardar Candidato
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Divider orientation="left">Datos Personales</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="cedula" label="Cédula" rules={[{ required: true, message: 'Falta la cédula' }]}>
              <Input placeholder="Ej: 1720..." maxLength={13} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="nombres" label="Nombres" rules={[{ required: true, message: 'Falta el nombre' }]}>
              <Input placeholder="Nombres" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="apellidos" label="Apellidos" rules={[{ required: true, message: 'Falta el apellido' }]}>
              <Input placeholder="Apellidos" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="correo" label="Correo Electrónico" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="ejemplo@correo.com" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="celular" label="Teléfono / Celular">
              <Input placeholder="099..." />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="fechaNacimiento" label="Fecha Nacimiento">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Detalles de la Postulación</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="idCargo" label="Cargo al que aplica" rules={[{ required: true }]}>
              <Select placeholder="Selecciona el cargo...">
                {cargos.map(c => (
                  <Option key={c.id} value={c.id}>{c.nombre}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="aspiracionSalarial" label="Aspiración Salarial" rules={[{ required: true }]}>
               {/* AQUÍ ESTABA EL ERROR: Se agregó validación para que no falle si es null */}
               <InputNumber 
                  prefix="$" 
                  style={{ width: '100%' }} 
                  formatter={(value) => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                  parser={(value) => value ? value.replace(/\$\s?|(,*)/g, '') : ''}
               />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item 
                name="hojaVida" 
                label="Hoja de Vida (PDF)" 
                valuePropName="fileList"
                getValueFromEvent={normFile}
            >
              <Upload 
                beforeUpload={() => false} 
                maxCount={1} 
                accept=".pdf"
                listType="picture-card"
                className="upload-cv-box"
              >
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Subir PDF</div>
                </div>
              </Upload>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
};

export default ModalRegistroCandidato;