<?php

/**
 * Deleting all temporary uploaded files.
 */
$files = glob('../upload-temp/*');

foreach ($files as $file){
    if (is_file($file)) unlink($file);
}

/**
 * Creating an explanation file in the temporary folder.
 */
$file = fopen("../upload-temp/README.md", "w");
fwrite($file, "- Uploaded files are temporarily stored here and deleted afterwards.");