<?php

/**
 * Deleting all temporary uploaded files.
 */
$files = glob('../upload-temp/*');

foreach ($files as $file){
    if (is_file($file)) unlink($file);
}