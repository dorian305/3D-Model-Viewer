<?php

/**
 * Printing formatted data for readability.
 */
function print_formatted($data){
    print "<pre>";
    print_r($data);
    print "</pre>";
}

/**
 * Checking if filename is valid (English - only characters, numbers and [ _-.]).
 */
function check_filename($name){
    return preg_match("`^[-0-9A-Z_\.\ ]+$`i", $name) ? true : false;
}

/**
 * Allowed file extensions.
 */
$ALLOWED_FILE_EXTENSIONS = ["obj", "mtl", "fbx", "stl", "jpg", "png"];

/**
 * Where the uploaded files are stored.
 */
$UPLOAD_DIRECTORY = "../models/";

/**
 * Error messages that can occur during upload.
 */
$ERROR_CODE = 0; // Default, if code is 0, no error occured.
$ERROR_MESSAGE = [
    1 => "File extension is not supported. Make sure to only upload files with extensions: .obj, .mtl, .fbx, .stl, .jpg, png",
    2 => "Invalid filename. English - only characters, numbers and [ _-.] are allowed.",
    3 => "No files have been selected.",
];

/**
 * Validating the uploaded file.
 */
if (isset($_FILES["file"]) and is_uploaded_file($_FILES["file"]["tmp_name"])){
    // Extract MIME type.
    $mime_type = mime_content_type($_FILES["file"]["tmp_name"]);
    
    // Extract extension
    $file_extension = pathinfo($_FILES["file"]["name"], PATHINFO_EXTENSION);
    
    // Update error code if disallowed extension is uploaded.
    if (!in_array($file_extension, $ALLOWED_FILE_EXTENSIONS, true)){
        $ERROR_CODE = 1;
    }
    
    // Update error code if filename is invalid.
    if (!check_filename($_FILES["file"]["name"])){
        $ERROR_CODE = 2;
    }
}
/**
 * Update error code if no files uploaded.
 */
else {
    $ERROR_CODE = 3;
}

/**
 * If error code has changed, return the error message and exit script.
 */
if ($ERROR_CODE !== 0){
    header('Content-type: application/json');
    echo json_encode([
        "error_code" => $ERROR_CODE,
        "success_message" => "",
        "error_message" => "ERROR: {$ERROR_MESSAGE[$ERROR_CODE]}",
        "file" => $_FILES["file"]["name"],
    ]);
    exit();
}

/**
 * Move uploaded files to the target folder.
 */
move_uploaded_file($_FILES["file"]["tmp_name"], $UPLOAD_DIRECTORY . $_FILES["file"]["name"]);

/**
 * Return response after file upload.
 */
header('Content-type: application/json');
echo json_encode([
    "error_code" => $ERROR_CODE,
    "success_message" => "File has been uploaded successfully.",
    "error_message" => "",
    "file" => $_FILES["file"]["name"],
]);