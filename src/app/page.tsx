"use client";

import { useRef, useState, useEffect } from "react";

import { Button, Card, Collapse, notification } from "antd";
const { Panel } = Collapse;

import { format } from "date-fns";

// const formattedCreatedAt = format(new Date(sheetData.createdAt), 'PPPppp');
// const formattedUpdatedAt = format(new Date(sheetData.updatedAt), 'PPPppp');

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState([]);
  const [fileTitle, setFileTitle] = useState("");

  const handleUpdateClick = (title: string) => {
    window.open(`/${title}`, "_blank");
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("http://localhost:4200/csv/getDataJSON");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      setFiles(data);
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

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileTitle(event.target.value);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files ? event.target.files[0] : null;

    if (file && fileTitle) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", fileTitle);

      try {
        const response = await fetch("http://localhost:4200/csv/uploadCSV", {
          method: "POST",
          body: formData,
        });
        console.log(response, "resooo");
        if (!response.ok) {
          throw new Error(`Invalid CSV Format`);
        }

        const result = await response.json();
        console.log(result);

        notification.success({
          message: "Success",
          description: "File uploaded successfully",
        });

        setFileTitle("");
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        fetchData();
      } catch (error) {
        console.error("Error uploading file: ", error);
        notification.error({
          message: "Failed",
          description: "Error uploading file: " + error,
        });
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } else {
      notification.error({
        message: "Error",
        description: "Please provide both a file and a title",
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (title: string) => {
    try {
      const response = await fetch(
        `http://localhost:4200/csv/delete/${title}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setFiles((prevFiles: any) =>
        prevFiles.filter((file: any) => file.title !== title)
      );

      notification.success({
        message: "Success",
        description: `The sheet "${title}" has been successfully deleted.`,
        duration: 4.5,
      });
    } catch (error) {
      if (!(error instanceof Error)) return;
      console.error("Error deleting sheet: ", error);
      notification.error({
        message: "Error",
        description: `There was an error deleting the sheet "${title}": ${error.message}`,
        duration: 4.5,
      });
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Half */}
      <div className="flex-1 bg-gray-100 flex flex-col justify-start items-center pt-20 p-20">
        <div
          style={{
            border: "3px dashed #90ee90",
            padding: "100px",
            borderRadius: "10px",
            backgroundColor: "#f0fff0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <input
            type="text"
            placeholder="Add a title"
            value={fileTitle}
            onChange={handleTitleChange}
            className="p-2 border border-gray-300 rounded text-black"
          />
          <br></br>
          <input
            type="file"
            placeholder="Upload file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".csv"
          />
          <Button
            type="primary"
            className="custom-button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            Upload New Sheet
          </Button>
          <p className="mt-2 text-sm text-gray-600">
            Only .csv files with the correct format are accepted
          </p>
        </div>
      </div>

      {/* Right Half */}
      <div className="flex-1 bg-gray-200 flex flex-col justify-start items-center pt-20 p-20 overflow-hidden">
        <Card
          className="w-full max-w-xl overflow-auto"
          style={{ maxHeight: "70vh" }}
        >
          <h2 className="text-2xl font-bold mb-4">Edit Existing Sheets</h2>
          <Collapse accordion>
            {files.map((file: any, index) => (
              <Panel header={file.title} key={index}>
                <p>Created: {format(new Date(file.createdAt), "PPPppp")}</p>
                <p>Last Update: {format(new Date(file.updatedAt), "PPPppp")}</p>
                <Button
                  className="mt-3 ant-btn-primary"
                  type="default"
                  onClick={() => handleUpdateClick(file.title)}
                >
                  Update
                </Button>
                <Button
                  className="mt-3 ml-5"
                  type="dashed"
                  danger
                  onClick={() => handleDelete(file.title)}
                >
                  Delete
                </Button>
              </Panel>
            ))}
          </Collapse>
        </Card>
      </div>
    </div>
  );
}
