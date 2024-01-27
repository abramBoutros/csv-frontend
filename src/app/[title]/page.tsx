"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Card,
  notification,
  Input,
  Button,
  Popconfirm,
  Form,
  InputNumber,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import "chartjs-plugin-zoom";

import { Line } from "react-chartjs-2";
import "chart.js/auto";

const originData: any = []; // fill this with your sheet data

const options: any = {
  responsive: true,
  plugins: {
    tooltip: {
      mode: "index",
      intersect: false,
    },
    legend: {
      display: true,
    },
  },
  hover: {
    mode: "nearest",
    intersect: true,
    onHover: (event: any, chartElement: any) => {
      if (chartElement.length) {
        const ctx = event.chart.ctx;
        const x = chartElement[0].element.x;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, event.chart.chartArea.top);
        ctx.lineTo(x, event.chart.chartArea.bottom);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        ctx.stroke();
        ctx.restore();
      }
    },
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: "Month",
      },
    },
    y: {
      display: true,
      title: {
        display: true,
        text: "Value",
      },
    },
  },
  elements: {
    line: {
      tension: 0,
    },
  },
};

export default function SheetPage({ params }: { params: { title: string } }) {
  const { title } = params;
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState("");
  const [data, setData] = useState(originData);

  const isEditing = (record: any) => record.key === editingKey;

  useEffect(() => {
    fetchData();
  }, []);

  const edit = (record: any) => {
    form.setFieldsValue({ ...record });
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey("");
  };

  const getChartData = () => {
    return {
      labels: data.map((item: any) => item.Month),
      datasets: [
        {
          label: "Revenue",
          data: data.map((item: any) => item.Revenue),
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.5)",
        },
        {
          label: "Expenses",
          data: data.map((item: any) => item.Expenses),
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
        },
        {
          label: "Profit",
          data: data.map((item: any) => item.Profit),
          borderColor: "rgb(120, 99, 132)",
          backgroundColor: "rgba(120, 99, 132, 0.5)",
        },
      ],
    };
  };

  const callApi = async (updatedData: any) => {
    try {
      const response = await fetch(
        `http://localhost:4200/csv/update/${title}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            data: updatedData,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("Error sending data to backend:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      const updatedData = data.map(({ key, ...item }: any) => item);

      await callApi(updatedData);

      notification.success({
        message: "Update Successful",
        description: "The sheet has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating sheet:", error);
      notification.error({
        message: "Update Failed",
        description: "There was an error updating the sheet.",
      });
    }
  };

  const save = async (key: any) => {
    try {
      const row = await form.validateFields();
      const newData = [...data];
      const index = newData.findIndex((item) => key === item.key);

      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        setData(newData);
        setEditingKey("");
      } else {
        newData.push(row);
        setData(newData);
        setEditingKey("");
      }
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    }
  };

  const handleDelete = (key: any) => {
    const newData = data.filter((item: any) => item.key !== key);
    setData(newData);
  };

  const fetchData = async () => {
    try {
      const response = await fetch(
        `http://localhost:4200/csv/getOneSheet/${title}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const formattedData = data.data.map((item: any, index: number) => ({
        key: index, // ensure each row has a unique key
        ...item,
      }));
      setData(formattedData);
    } catch (error) {
      if (!(error instanceof Error)) return;
      console.error("Error fetching data: ", error);
      notification.error({
        message: "Error",
        description: `Error fetching data ": ${error.message}`,
        duration: 4.5,
      });
    }
  };

  const columns = [
    {
      title: "Month",
      dataIndex: "Month",
      width: "25%",
      editable: true,
    },
    {
      title: "Revenue",
      dataIndex: "Revenue",
      width: "15%",
      editable: true,
    },
    {
      title: "Expenses",
      dataIndex: "Expenses",
      width: "15%",
      editable: true,
    },
    {
      title: "Profit",
      dataIndex: "Profit",
      width: "15%",
      editable: true,
    },
    {
      title: "operation",
      dataIndex: "operation",
      render: (_: any, record: any) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <a onClick={() => save(record.key)} style={{ marginRight: 8 }}>
              <CheckOutlined />
            </a>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <CloseOutlined />
            </Popconfirm>
          </span>
        ) : (
          <div>
            <Button
              icon={<EditOutlined />}
              disabled={editingKey !== ""}
              onClick={() => edit(record)}
            />
            <Popconfirm
              title="Sure to delete?"
              onConfirm={() => handleDelete(record.key)}
            >
              <Button
                icon={<DeleteOutlined />}
                danger
                style={{ marginLeft: 8 }}
              />
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record: any) => ({
        record,
        inputType: col.dataIndex === "Profit" ? "number" : "text",
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  const EditableCell = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    ...restProps
  }: any) => {
    const inputNode = inputType === "number" ? <InputNumber /> : <Input />;
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[{ required: true, message: `Please Input ${title}!` }]}
          >
            {inputNode}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  // const onHover: any = (event: any, chartElement: any): any => {
  //   event.native.target.style.cursor = chartElement[0] ? "pointer" : "default";
  // };

  return (
    <Form form={form} component={false}>
      <Card style={{ marginBottom: "20px", backgroundColor: "lightgrey" }}>
        <h1
          style={{ textAlign: "center", fontSize: "24px", fontStyle: "italic" }}
        >
          Editing: {title || "N/A"}
        </h1>
      </Card>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100vw",
          height: "400px",
        }}
      >
        <Line
          style={{ height: "100%", width: "60vw" }}
          data={getChartData()}
          options={options}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <Button
          type="primary"
          onClick={handleSubmit}
          className="ant-btn-primary mt-10"
        >
          Submit Changes
        </Button>
      </div>
      <Table
        components={{
          body: {
            cell: EditableCell,
          },
        }}
        bordered
        dataSource={data}
        columns={mergedColumns}
        rowClassName="editable-row"
        pagination={{
          onChange: cancel,
        }}
      />
    </Form>
  );
}
