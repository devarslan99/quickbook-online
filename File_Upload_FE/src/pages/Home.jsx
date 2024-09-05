import React, { useState , useEffect } from "react";
import GooglePicker from "react-google-picker";
import Cookies from 'js-cookie';
import axios from "axios";

const Home = () => {
  const CLIENT_ID =
    ""; // Replace with your actual Google Client ID
  const DEVELOPER_KEY = ""; // Replace with your actual Google API Key
  const SCOPE = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.readonly",
  ];

  const [files, setFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);

  const tokenExpiresAt = Cookies.get('tokenExpiresAt');
  console.log(tokenExpiresAt);
  const currentTime = Date.now();
  const cookies = document.cookie;
console.log(cookies); 
  // console.log();
  useEffect(() => {
    // Function to check if the token is expired
    const checkTokenExpiration = () => {
      const tokenExpiresAt = Cookies.get('tokenExpiresAt');
      if (tokenExpiresAt) {
        const currentTime = Date.now();
        console.log(currentTime);
        const expiresAt = parseInt(tokenExpiresAt, 10);
        if (currentTime >= tokenExpiresAt) {
          // Redirect if token is expired
          window.location.href = 'http://localhost:3000/authorize';
        }
      } else {
        // Redirect if tokenExpiresAt cookie is not present
        window.location.href = 'http://localhost:3000/authorize';
      }
    };

    // Check token expiration on component mount
    checkTokenExpiration();
  }, []);
  
  const handleFileSelect = (file) => {
    const selectedFile = {
      name: file.name,
      size: file.sizeBytes,
      type: file.mimeType,
      id: file.id,
      isGoogleDrive: true,
      uploading: false,
      status: "",
    };
    validateAndSetFiles([selectedFile]);
  };

  const validateAndSetFiles = (selectedFiles) => {
    const validFiles = selectedFiles.filter((file) => {
      if (file.size > 25 * 1024 * 1024) {
        setErrorMessage("File size must be less than 25 MB.");
        return false;
      } else if (
        !["application/pdf", "image/jpeg", "image/png"].includes(file.type)
      ) {
        setErrorMessage("Only PDF, JPEG, and PNG files are allowed.");
        return false;
      }
      return true;
    });

    setErrorMessage("");
    setFiles((prevFiles) => [...prevFiles, ...validFiles]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    setErrorMessages([]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(file.name);

      // Mark the file as uploading
      setFiles((prevFiles) =>
        prevFiles.map((f, index) =>
          index === i ? { ...f, uploading: true } : f
        )
      );

      const formData = new FormData();
      try {
        if (file.isGoogleDrive) {
          // Fetch the Google Drive file as a Blob
          const response = await axios.get(
            `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
            {
              headers: {
                Authorization: `Bearer ${file.oauthToken}`,
              },
              responseType: "blob",
            }
          );
          formData.append("file", response.data, file.name);
        } else {
          formData.append("file", file);
        }

        // Upload the file
        const response = await axios.post(
          "http://localhost:3000/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            withCredentials: true,
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress((prevProgress) => {
                const newProgress = [...prevProgress];
                newProgress[i] = percentCompleted;
                return newProgress;
              });
            },
          }
        );

        // Handle different response statuses
        if (response.status === 200) {
          setFiles((prevFiles) =>
            prevFiles.map((f, index) =>
              index === i ? { ...f, uploading: false, status: "uploaded" } : f
            )
          );
        } else if (response.status === 202) {
          setErrorMessages((prevMessages) => [
            ...prevMessages,
            { message: `${file.name} already exists.`, color: "magenta" },
          ]);
        } else if (response.status === 400) {
          setErrorMessages((prevMessages) => [
            ...prevMessages,
            {
              message: `Server error while uploading ${file.name}.`,
              color: "red",
            },
          ]);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        setErrorMessages((prevMessages) => [
          ...prevMessages,
          { message: `Error uploading ${file.name}.`, color: "red" },
        ]);
      }
    }

    setUploading(false);
    setUploadProgress([]);
    setFiles([]);
  };

  

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndSetFiles(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };


  return (
    <div className="flex items-center  min-h-screen flex-col w-screen bg-backImg bg-cover bg-center">
      <div className="bg-white rounded-lg p-10 mt-20 shadow-md">
        <h1 className="text-4xl text-center font-medium text-blue-500 mb-8 tracking-wider ">
          Upload Files For Invoice Creation
        </h1>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 w-full justify-center mt-6"
          disabled={uploading}
        >
          <div
            className={`border-2 border-dashed rounded-lg p-2 ${
              uploading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              onChange={(e) => validateAndSetFiles(Array.from(e.target.files))}
              multiple
              className="hidden w-full"
              disabled={uploading}
              id="fileInput"
            />
            <label htmlFor="fileInput"  className="cursor-pointer h-[20vh] flex items-center justify-center text-center ">
              Drag and drop files here, or click to select files
            </label>
          </div>
          <GooglePicker
            clientId={CLIENT_ID}
            developerKey={DEVELOPER_KEY}
            scope={SCOPE}
            onChange={(data) => console.log("on change:", data)}
            onAuthFailed={(data) => console.log("on auth failed:", data)}
            multiselect={true}
            navHidden={true}
            authImmediate={false}
            mimeTypes={["application/pdf", "image/png", "image/jpeg"]}
            viewId={"DOCS"}
            createPicker={(google, oauthToken) => {
              const picker = new google.picker.PickerBuilder()
                .addView(google.picker.ViewId.DOCS)
                .setOAuthToken(oauthToken)
                .setDeveloperKey(DEVELOPER_KEY)
                .setCallback((data) => {
                  if (data.action === google.picker.Action.PICKED) {
                    const file = data.docs[0];
                    handleFileSelect(file);
                  }
                });
              picker.build().setVisible(true);
            }}
          >
            <button
              className="bg-gradient-to-r from-blue-400 w-full text-white px-5 py-2 rounded-lg to-blue-800 font-semibold  hover:from-blue-500 hover:to-blue-900 "
              disabled={uploading}
            >
              Choose from Google Drive
            </button>
          </GooglePicker>

          {/* {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>} */}
          {/* {uploadProgress.length > 0 && (
            <ul>
              {uploadProgress.map((progress, index) => (
                <li key={index}>
                  {files[index].name}: {progress}%{" "}
                  {files[index].uploading && <span>Uploading...</span>}
                </li>
              ))}
            </ul>
          )} */}
          {/* {uploadProgress > 0 && <p>Uploading: {uploadProgress}%</p>} */}
          <div className="flex gap-3 flex-col items-center">
            <button
              type="submit"
              className="bg-gradient-to-tl from-blue-400 hover:from-blue-500 hover:to-blue-900  text-white px-5 py-2 w-full rounded-lg to-blue-800 font-semibold"
              disabled={uploading}
            >
              Upload
            </button>
            <a
              href="/invoice"
              disabled={uploading}
              className=" group bg-gradient-to-l flex items-center justify-center w-full gap-2 from-blue-400 text-center text-white px-5 py-2 rounded-lg to-blue-800 font-semibold  hover:from-blue-500 hover:to-blue-900 "
            >
              View Invoices
              <svg
                fill="none"
                stroke="currentColor"
                width="11"
                height="11"
                viewBox="0 0 10 10"
                aria-hidden="true"
                strokeWidth="1.5"
                className="text-white"
                strokeLinecap="round"
              >
                <path
                  className="opacity-0 transition group-hover:opacity-100"
                  d="M0 5h7"
                  strokeLinecap="round"
                ></path>
                <path
                  className="transition group-hover:translate-x-[3px]"
                  d="M1 1l4 4-4 4"
                  strokeLinecap="round"
                ></path>
              </svg>
            </a>
          </div>
        </form>
        <ul className="mt-5">
          {files.map((file, index) => {
            const fileName = file.name;
            const isUploaded = file.status === "uploaded";

            return (
              <li
                key={index}
                className={`font-semibold text-center list-decimal ${
                  isUploaded ? "text-green-600" : ""
                }`}
              >
                {fileName}
                {file.uploading && !isUploaded && <span> Uploading...</span>}
                {isUploaded && <span> Uploaded</span>}
              </li>
            );
          })}
        </ul>
        {errorMessages.length > 0 && (
          <ul className="mt-5 text-center list-decimal ">
            {errorMessages.map((error, index) => (
              <li key={index} style={{ color: error.color }}>
                {error.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Home;
