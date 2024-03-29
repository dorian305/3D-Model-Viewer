import { loadModel } from "./index.js";
import { getExtension } from "./index.js";
import { customClass } from "./swalCustomClass.js";

const fileField = document.querySelector("#files");

/**
 * Function which prepares files for upload.
 */
export const doUpload = async (event, uploadedFilesList) => {
    /**
     * Allowed model extensions to upload.
     */
    const allowedModelExtensions = ["obj", "fbx",];
    
    /**
     * Allowed file extensions to upload.
     */
    const allowedFileExtensions = [...allowedModelExtensions, "mtl", "jpg", "png",];

    /**
     * Setting error variable.
     * Used when checking for errors during file upload.
     */
    const error = {
        code: 0,
        file: "",
        message: {
            1: "File extension is not supported. Make sure to only upload files with extensions: " + allowedFileExtensions.join(", "),
            2: "Invalid filename.<br>English - only characters, numbers and [ _-.] are allowed.",
            3: "No supported model files detected from the list of uploaded files.<br>Supported model files: " + allowedModelExtensions.join(", "),
            4: "Multiple model files detected from the list of uploaded files, please upload one model.",
            5: "No files have been selected.",
        },
    };

    /**
     * Counting the number of files from fileField if files
     * are uploaded through the input, or uploadedFilesList if files are drag and dropped.
     */
    const numberOfFiles = uploadedFilesList ? uploadedFilesList.length : fileField.files.length;

    /**
     * Save list of all file names, and list of all model names.
     */
    const list = uploadedFilesList ?? [...fileField.files];
    const fileList = [];
    let modelList = [];

    list.forEach(file => fileList.push(file.name));
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
         if (error.code === 0 && !allowedFileExtensions.includes(getExtension(filename)[1])) error.code = 1;

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
            html: `${error.message[error.code]}${error.file ? `<br><strong>Error file:</strong> ${error.file}` : ""}`,
            icon: "error",
            customClass : customClass,
        });

        return;
    }

    /**
     * Iterating over selected files and uploading them.
     */
    Swal.fire({
        title: `Uploading...`,
        html: `<div id="swal-upload-html"></div>`,
        customClass : customClass,
    });
    Swal.showLoading(); // Display loading icon.
    for (let i = 0; i < numberOfFiles; i++){
        /**
         * Display current file uploading message.
         */
        document.querySelector(`#swal-upload-html`).innerText = `Uploading ${list[i].name} (${i + 1} of ${numberOfFiles})`;

        /**
         * Send file to be uploaded.
         */
        const response = await uploadFile(list[i]);

        /**
         * If there was an error uploading a file,
         * notify user and exit function.
         */
        if (response.error_code !== 0){
            Swal.fire({
                title: `ERROR ${response.error_code}`,
                html: `${response.error_message}<br><strong>Error file:</strong> ${response.file}`,
                icon: "error",
                customClass : customClass,
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
export const uploadFile = async file => {
    /**
     * Populating form with uploaded file.
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
        try {
            return response.json();
        }

        catch (e) {
            Swal.fire({
                title: `An error occured`,
                html: `Error: ${e}.<br><strong>Error file:</strong> ${file.name}`,
                icon: "error",
                customClass : customClass,
            });
        }
    });

    return data;
}

fileField.addEventListener("change", doUpload);