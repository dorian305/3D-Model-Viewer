import { moduleWrapper } from './index.js';
import { doUpload } from './uploadFile.js';

const dragIndicatorDiv = document.querySelector("#drag-indicator-elem");

/**
 * Runs when items are dropped in drop zone.
 */
const drop = e => {
	e.preventDefault();
	hideIndicatorDiv();

	const uploadedFilesList = [];

	if (e.dataTransfer.items){
		for (const item of [...e.dataTransfer.items]){
			/**
			 * Skip items that aren't files.
			 */
			if (item.kind !== 'file') continue;

			const file = item.getAsFile();
			uploadedFilesList.push(file);
		}
	}
	else {
		for (const file of [...e.dataTransfer.files]){
			uploadedFilesList.push(file);
		}
	}

	/**
	 * Run file uploading.
	 * Sending "null" as first parameter because function expects an event,
	 * but this is direct function call.
	 */
	doUpload(null, uploadedFilesList);
}

const hideIndicatorDiv = () => dragIndicatorDiv.setAttribute("style", "display: none;");

/**
 * Hide drop zone when dragged files leave the window.
 */
dragIndicatorDiv.addEventListener("dragleave", () => hideIndicatorDiv());

/**
 * Preventing browser downloading dropped files.
 */
dragIndicatorDiv.addEventListener("drop", drop);
dragIndicatorDiv.addEventListener("dragover", e => e.preventDefault());

/**
 * Display drop zone for file upload when files get dragged into the window.
 */
moduleWrapper.addEventListener("dragenter", e => dragIndicatorDiv.removeAttribute("style"));