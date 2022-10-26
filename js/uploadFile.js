import { loadModel } from "./index.js";
import { getExtension } from "./index.js";

const fileField = document.querySelector("#files");

fileField.addEventListener("change", doUpload, false);

/**
 * Function which prepares files for upload.
 */
async function doUpload(e){
    /**
     * Setting error variable.
     * Used when checking for errors during file upload.
     */
    const error = {
        code: 0,
        file: "",
        message: {
            1: "File extension is not supported. Make sure to only upload files with extensions: .obj, .mtl, .fbx, .stl, .jpg, png",
            2: "Invalid filename.<br>English - only characters, numbers and [ _-.] are allowed.",
            3: "No supported model files detected from the list of uploaded files.<br>Supported model files: .obj, .fbx, .stl",
            4: "Multiple model files detected from the list of uploaded files, please upload one model.",
            5: "No files have been selected.",
        },
    };

    /**
     * Allowed file extensions to upload.
     */
    const allowedExtensions = ["obj", "mtl", "fbx", "stl", "jpg", "png",];

    /**
     * Counting the number of selected files.
     */
    const numberOfFiles = fileField.files.length;

    /**
     * Save list of all file names, and list of all model names.
     */
     const fileList = [];
     let modelList = [];
 
     [...fileField.files].forEach(file => fileList.push(file.name));
     modelList = fileList.filter(file => ["obj", "fbx", "stl"].includes(getExtension(file)[1]));

    /**
     * Error checking the files before uploading.
     */
    for (const filename of fileList){
        /**
         * If error code is already set, exit loop.
         */
        if (error.code !== 0) break;

        /**
         * Checking whether selected files are of allowed extension.
         */;
         if (error.code === 0 && !allowedExtensions.includes(getExtension(filename)[1])) error.code = 1;

         /**
          * Checking whether selected files are of allowed filename.
          */
         if (error.code === 0 && !(/^[-0-9A-Z_\.\ ]+$/i).test(filename)) error.code = 2;
 
         /**
          * Set an error file to a file that triggered the error.
          */
         if (error.code !== 0) error.file = filename;
    }

    /**
     * Checking whether any model files are uploaded.
     */
    if (error.code === 0 && modelList.length === 0) error.code = 3;

    /**
     * Checking whether multiple model files are uploaded.
     */
    if (error.code === 0 && modelList.length > 1) error.code = 4;

    /**
     * Checking whether no files have been selected.
     */
    if (error.code === 0 && numberOfFiles === 0) error.code = 5;

    /**
     * If error code has been changed, exit the function.
     */
    if (error.code !== 0){
        Swal.fire({
            title: `ERROR ${error.code}`,
            html: `${error.message[error.code]}${error.file ? `<br>Error file: ${error.file}` : ""}`,
            icon: "error",
        });

        return;
    }

    /**
     * Iterating over selected files and uploading them.
     */
    Swal.fire({
        title: `Uploading...`,
        html: `<div id="swal-upload-html"></div>`,
    });
    Swal.showLoading(); // Display loading icon.
    for (let i = 0; i < numberOfFiles; i++){
        /**
         * Display current file uploading message.
         */
        document.querySelector(`#swal-upload-html`).innerText = `Uploading ${fileField.files[i].name} (${i + 1} of ${numberOfFiles})`;

        /**
         * Send file to be uploaded.
         */
        const response = await uploadFile(fileField.files[i]);

        /**
         * If there was an error uploading a file,
         * notify user and exit function.
         */
        if (response.error_code !== 0){
            Swal.fire({
                title: `ERROR ${response.error_code}`,
                html: `${response.error_message}<br>Error file: ${response.file}`,
                icon: "error",
            });
            return;
        }

        /**
         * Display file uploaded success message.
         */
         document.querySelector(`#swal-upload-html`).innerText = response.success_message;
    }

    /**
     * Clearing file field after upload.
     */
    fileField.value = "";

    /**
     * Load the model.
     */
    loadModel(modelList[0]);

    /**
     * Close popup modal after model finishes uploading.
     */
    Swal.close();
}

/**
 * Uploading file to the server.
 */
async function uploadFile(file){
    /**
     * Constructing a Form Data to send to the backend,
     * so the PHP populates $_FILES properly.
     */
    const form = new FormData();
    form.append("file", file);

    /**
     * POST-ing data to the PHP file for processing,
     * and returning response.
     */
    const data = await fetch("../php/uploadfile.php", {
        method: "POST",
        body: form,
    }).then(response => {
        return response.json();
    });

    return data;
}