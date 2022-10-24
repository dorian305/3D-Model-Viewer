import { loadModel } from "./index.js";
import { getExtension } from "./index.js";

/**
 * Fetching input field and setting event listener
 * to fire when files are selected.
 */
const fileField = document.querySelector("#files");
fileField.addEventListener("change", doUpload, false);

/**
 * Function which prepares files for upload.
 */
async function doUpload(e){
    /**
     * Counting the number of selected files.
     */
    const numberOfFiles = fileField.files.length;

    /**
     * Error checking the files before uploading.
     */
    let error = {
        code: 0,
        file: "",
        message: {
            1: "File extension is not supported. Make sure to only upload files with extensions: .obj, .mtl, .fbx, .stl, .jpg, png.",
            2: "Invalid filename. English - only characters, numbers and [_-.] are allowed.",
            3: "No files have been selected.",
        },
    };
    [...fileField.files].forEach(file => {
        /**
         * Checking whether selected files are of allowed extension.
         */;
        if (!["obj", "mtl", "fbx", "stl", "jpg", "png",].includes(getExtension(file.name)[1])) error.code = 1;

        /**
         * Checking whether selected files are of allowed filename.
         */
        if (!(/^[-0-9A-Z_\.\ ]+$/i).test(file.name)) error.code = 2;

        /**
         * Checking whether no files have been selected.
         */
        if (numberOfFiles === 0) error.code = 3;

        /**
         * Set an error file if any file failed the error check.
         */
        if (error.code !== 0) error.file = file.name;
    });

    /**
     * If any file failed the error check, exit the function.
     */
    if (error.code !== 0){
        Swal.fire({
            title: `ERROR ${error.code}`,
            html: `${error.message[error.code]}<br>Error file: ${error.file}`,
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
     * Filter only model files from array of uploaded files,
     * and populate model list with the filtered list.
     */
    const fileList = [];
    const modelListContainer = document.querySelector("#model-list");

    [...fileField.files].forEach(file => fileList.push(file.name));
    const modelList = fileList.filter(file => ["obj", "fbx", "stl"].includes(getExtension(file)[1]));

    modelListContainer.innerHTML = "";
    modelList.forEach(model => modelListContainer.insertAdjacentHTML("beforeend",`<a class="model-list-element" href="${model}">${model}</a>`));

    /**
     * Clearing file field after upload.
     */
    fileField.value = "";

    /**
     * Close modal when files finish uploading.
     */
    Swal.close();

    /**
     * Display the first model.
     */
    loadModel(modelList[0]);
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