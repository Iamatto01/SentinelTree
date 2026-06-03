/**
 * Google Apps Script for Jamal Awang Legacy Family Tree
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Spreadsheet: https://docs.google.com/spreadsheets/d/17zmCFlFGmMNrum1FZ6Ni4M15BGL9-kP65wqTbMaVTVg/edit
 * 2. Go to Extensions > Apps Script.
 * 3. Delete any code in the editor and paste ALL of this code.
 * 4. Click the "Deploy" button at the top right, then "New deployment".
 * 5. Click the gear icon next to "Select type" and choose "Web app".
 * 6. Set "Description" to something like "v1", "Execute as" to "Me", and "Who has access" to "Anyone".
 * 7. Click "Deploy". You will be asked to authorize access. Click "Review permissions", select your account, click "Advanced", and then "Go to ... (unsafe)". Allow all permissions.
 * 8. Copy the "Web app URL" provided after deployment.
 * 9. Paste this URL into your `supabase-config.js` file as the `googleWebAppUrl`.
 */

const SPREADSHEET_ID = "17zmCFlFGmMNrum1FZ6Ni4M15BGL9-kP65wqTbMaVTVg";
const DRIVE_FOLDER_ID = "11IxCJ40ZjFZahJo3zx6Tk9WZ2W3HKSIX";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action || "savePerson";

    if (action === "savePerson") {
      return handleSavePerson(payload.data);
    } else if (action === "syncDataset") {
      return handleSyncDataset(payload.data);
    } else if (action === "uploadGalleryImage") {
      return handleUploadGalleryImage(payload.data);
    }

    return buildResponse({ status: "error", message: "Unknown action." });
  } catch (error) {
    return buildResponse({ status: "error", message: error.toString() });
  }
}

// Ensure preflight requests (OPTIONS) return 200 OK for CORS
function doOptions(e) {
  return buildResponse({ status: "ok" });
}

function handleSavePerson(personData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  
  // Set headers if the sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "Name", "Relation", "Birthday", "Birth Place", "Occupation", "Phone", "Parent / Sibling", "Partner Name", "Notes", "Image URL", "Created At"]);
    sheet.getRange(1, 1, 1, 12).setFontWeight("bold");
  }

  let imageUrl = personData.imageUrl || "";

  // If a base64 image is provided, upload it to Google Drive
  if (personData.base64Image && personData.base64Image.trim() !== "") {
    try {
      const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      // Remove data:image/...;base64, prefix
      const base64Data = personData.base64Image.split(",")[1] || personData.base64Image;
      const decodedData = Utilities.base64Decode(base64Data);
      const blob = Utilities.newBlob(decodedData, getMimeType(personData.base64Image), (personData.name || "person") + "_photo");
      
      const file = folder.createFile(blob);
      // Ensure the file is accessible to anyone with the link
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      imageUrl = file.getDownloadUrl() || file.getUrl();
    } catch (e) {
      // Fallback if image upload fails
      Logger.log("Image upload failed: " + e.message);
    }
  }

  // Append row
  sheet.appendRow([
    personData.id || generateId(),
    personData.name || "",
    personData.relation || "",
    personData.birthday || "",
    personData.birthPlace || "",
    personData.occupation || "",
    personData.phone || "",
    personData.parentName || "",
    personData.partnerName || "",
    personData.notes || "",
    imageUrl,
    personData.createdAt || new Date().toISOString()
  ]);

  return buildResponse({ status: "success", imageUrl: imageUrl });
}

function handleUploadGalleryImage(data) {
  if (!data.base64Image) {
    return buildResponse({ status: "error", message: "No image provided" });
  }
  
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const base64Data = data.base64Image.split(",")[1] || data.base64Image;
    const decodedData = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decodedData, getMimeType(data.base64Image), "gallery_upload_" + new Date().getTime());
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const imageUrl = file.getDownloadUrl() || file.getUrl();
    return buildResponse({ status: "success", imageUrl: imageUrl });
  } catch (e) {
    return buildResponse({ status: "error", message: e.toString() });
  }
}

function handleSyncDataset(dataset) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  
  // Set headers if the sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "Name", "Relation", "Birthday", "Birth Place", "Occupation", "Phone", "Parent / Sibling", "Partner Name", "Notes", "Image URL", "Created At"]);
    sheet.getRange(1, 1, 1, 12).setFontWeight("bold");
  }

  if (Array.isArray(dataset)) {
    const rows = dataset.map(personData => [
      personData.id || generateId(),
      personData.name || "",
      personData.relation || "",
      personData.birthday || "",
      personData.birthPlace || "",
      personData.occupation || "",
      personData.phone || "",
      personData.parentName || "",
      personData.partnerName || "",
      personData.notes || "",
      personData.imageUrl || "",
      personData.createdAt || new Date().toISOString()
    ]);
    
    // Batch append is faster
    if (rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }
  }

  return buildResponse({ status: "success", count: dataset.length });
}

function getMimeType(base64String) {
  if (base64String.startsWith("data:image/jpeg")) return MimeType.JPEG;
  if (base64String.startsWith("data:image/png")) return MimeType.PNG;
  if (base64String.startsWith("data:image/gif")) return MimeType.GIF;
  return MimeType.JPEG; // Default
}

function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

function buildResponse(responseObject) {
  const output = ContentService.createTextOutput(JSON.stringify(responseObject));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
