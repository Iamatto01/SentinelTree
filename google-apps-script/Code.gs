const PEOPLE_SHEET_NAME = 'family_members';
const GALLERY_SHEET_NAME = 'gallery_images';

const PEOPLE_COLUMNS = [
  'id',
  'family_id',
  'name',
  'relation',
  'birthday',
  'birth_place',
  'occupation',
  'phone',
  'notes',
  'parent_name',
  'partner_name',
  'family_head',
  'image_url',
  'created_at',
  'updated_at'
];

const GALLERY_COLUMNS = [
  'id',
  'family_id',
  'event_name',
  'image_url',
  'created_at'
];

function doPost(e) {
  try {
    const payload = parsePayload(e);
    const action = String(payload.action || '').trim();

    if (!action) {
      return jsonResponse({ success: false, error: 'Missing action.' });
    }

    const sheetId = String(payload.sheetId || '').trim();
    if (!sheetId) {
      return jsonResponse({ success: false, error: 'Missing sheetId.' });
    }

    const familyId = String(payload.familyId || '').trim();
    if (!familyId) {
      return jsonResponse({ success: false, error: 'Missing familyId.' });
    }
    const spreadsheet = SpreadsheetApp.openById(sheetId);

    switch (action) {
      case 'listPeople':
        return jsonResponse({
          success: true,
          people: listPeople(spreadsheet, familyId)
        });
      case 'getPerson':
        return jsonResponse({
          success: true,
          person: getPerson(spreadsheet, familyId, String(payload.id || ''))
        });
      case 'addPerson':
        return jsonResponse({
          success: true,
          person: addPerson(spreadsheet, familyId, payload.record || {})
        });
      case 'updatePerson':
        return jsonResponse({
          success: true,
          person: updatePerson(spreadsheet, familyId, String(payload.id || ''), payload.record || {})
        });
      case 'removePerson':
        removePerson(spreadsheet, familyId, String(payload.id || ''));
        return jsonResponse({ success: true });
      case 'listGalleryImages':
        return jsonResponse({
          success: true,
          images: listGalleryImages(spreadsheet, familyId, Number(payload.limit || 100))
        });
      case 'addGalleryImage':
        return jsonResponse({
          success: true,
          image: addGalleryImage(spreadsheet, familyId, payload.record || {})
        });
      case 'uploadMedia':
        return jsonResponse({
          success: true,
          ...uploadMedia(payload)
        });
      default:
        return jsonResponse({ success: false, error: 'Unsupported action.' });
    }
  } catch (error) {
    return jsonResponse({ success: false, error: error.message || String(error) });
  }
}

function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Missing request body.');
  }

  return JSON.parse(e.postData.contents);
}

function jsonResponse(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(spreadsheet, name, columns) {
  let sheet = spreadsheet.getSheetByName(name);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.appendRow(columns);
    return sheet;
  }

  const existingHeader = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String)
    : [];

  const normalizedHeader = existingHeader.map((value) => value.trim());
  if (!normalizedHeader.length) {
    sheet.getRange(1, 1, 1, columns.length).setValues([columns]);
    return sheet;
  }

  const hasSameLength = columns.length === normalizedHeader.length;
  const hasSameColumns = columns.every((column, index) => column === normalizedHeader[index]);
  const isSame = hasSameLength && hasSameColumns;
  if (!isSame) {
    sheet.clear();
    sheet.getRange(1, 1, 1, columns.length).setValues([columns]);
  }

  return sheet;
}

function sheetRowsToObjects(sheet) {
  const rowCount = sheet.getLastRow();
  const colCount = sheet.getLastColumn();
  if (rowCount < 2 || colCount === 0) return [];

  const values = sheet.getRange(1, 1, rowCount, colCount).getValues();
  const header = values[0].map((value) => String(value).trim());

  return values.slice(1).map((row, index) => {
    const obj = {};
    header.forEach((key, columnIndex) => {
      obj[key] = row[columnIndex];
    });
    obj.__row = index + 2;
    return obj;
  });
}

function generateId() {
  return Utilities.getUuid();
}

function toRecord(input, columns) {
  const record = {};
  columns.forEach((key) => {
    record[key] = input[key] !== undefined && input[key] !== null ? input[key] : '';
  });
  return record;
}

function resolveFamilyHead(record, fallbackRecord) {
  const sources = [record || {}, fallbackRecord || {}];
  const orderedKeys = ['family_head', 'familyHead', 'parent_name', 'parentName', 'name'];

  for (let sourceIndex = 0; sourceIndex < sources.length; sourceIndex += 1) {
    const source = sources[sourceIndex];
    for (let keyIndex = 0; keyIndex < orderedKeys.length; keyIndex += 1) {
      const value = source[orderedKeys[keyIndex]];
      if (value !== undefined && value !== null && String(value).trim()) {
        return String(value).trim();
      }
    }
  }

  return '';
}

function listPeople(spreadsheet, familyId) {
  const sheet = getOrCreateSheet(spreadsheet, PEOPLE_SHEET_NAME, PEOPLE_COLUMNS);
  const rows = sheetRowsToObjects(sheet)
    .filter((row) => String(row.family_id || '').trim() === familyId)
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .map((row) => {
      delete row.__row;
      return row;
    });

  return rows;
}

function getPerson(spreadsheet, familyId, id) {
  if (!id) return null;

  const sheet = getOrCreateSheet(spreadsheet, PEOPLE_SHEET_NAME, PEOPLE_COLUMNS);
  const row = sheetRowsToObjects(sheet)
    .find((entry) => String(entry.id || '') === id && String(entry.family_id || '') === familyId);

  if (!row) return null;
  delete row.__row;
  return row;
}

function addPerson(spreadsheet, familyId, incomingRecord) {
  const sheet = getOrCreateSheet(spreadsheet, PEOPLE_SHEET_NAME, PEOPLE_COLUMNS);
  const now = new Date().toISOString();

  const record = toRecord({
    ...incomingRecord,
    id: incomingRecord.id || generateId(),
    family_id: familyId,
    relation: incomingRecord.relation || 'Other',
    family_head: resolveFamilyHead(incomingRecord),
    created_at: incomingRecord.created_at || incomingRecord.createdAt || now,
    updated_at: incomingRecord.updated_at || incomingRecord.updatedAt || now,
    birth_place: incomingRecord.birth_place || incomingRecord.birthPlace || '',
    parent_name: incomingRecord.parent_name || incomingRecord.parentName || '',
    partner_name: incomingRecord.partner_name || incomingRecord.partnerName || '',
    image_url: incomingRecord.image_url || incomingRecord.imageUrl || ''
  }, PEOPLE_COLUMNS);

  sheet.appendRow(PEOPLE_COLUMNS.map((key) => record[key]));
  return record;
}

function updatePerson(spreadsheet, familyId, id, incomingRecord) {
  if (!id) {
    throw new Error('Missing person id.');
  }

  const sheet = getOrCreateSheet(spreadsheet, PEOPLE_SHEET_NAME, PEOPLE_COLUMNS);
  const rows = sheetRowsToObjects(sheet);
  const target = rows.find((row) => String(row.id || '') === id && String(row.family_id || '') === familyId);

  if (!target) {
    throw new Error('Person not found.');
  }

  const now = new Date().toISOString();
  const merged = {
    ...target,
    ...incomingRecord,
    id,
    family_id: familyId,
    birth_place: incomingRecord.birth_place || incomingRecord.birthPlace || target.birth_place || '',
    parent_name: incomingRecord.parent_name || incomingRecord.parentName || target.parent_name || '',
    partner_name: incomingRecord.partner_name || incomingRecord.partnerName || target.partner_name || '',
    family_head: resolveFamilyHead(incomingRecord, target),
    image_url: incomingRecord.image_url || incomingRecord.imageUrl || target.image_url || '',
    updated_at: incomingRecord.updated_at || incomingRecord.updatedAt || now
  };

  const record = toRecord(merged, PEOPLE_COLUMNS);
  sheet.getRange(target.__row, 1, 1, PEOPLE_COLUMNS.length).setValues([PEOPLE_COLUMNS.map((key) => record[key])]);

  return record;
}

function removePerson(spreadsheet, familyId, id) {
  if (!id) {
    throw new Error('Missing person id.');
  }

  const sheet = getOrCreateSheet(spreadsheet, PEOPLE_SHEET_NAME, PEOPLE_COLUMNS);
  const rows = sheetRowsToObjects(sheet);
  const target = rows.find((row) => String(row.id || '') === id && String(row.family_id || '') === familyId);

  if (!target) {
    throw new Error('Person not found.');
  }

  sheet.deleteRow(target.__row);
}

function listGalleryImages(spreadsheet, familyId, limit) {
  const sheet = getOrCreateSheet(spreadsheet, GALLERY_SHEET_NAME, GALLERY_COLUMNS);
  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 100;

  return sheetRowsToObjects(sheet)
    .filter((row) => String(row.family_id || '').trim() === familyId)
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .slice(0, safeLimit)
    .map((row) => {
      delete row.__row;
      return row;
    });
}

function addGalleryImage(spreadsheet, familyId, incomingRecord) {
  const sheet = getOrCreateSheet(spreadsheet, GALLERY_SHEET_NAME, GALLERY_COLUMNS);
  const record = toRecord({
    ...incomingRecord,
    id: incomingRecord.id || generateId(),
    family_id: familyId,
    event_name: incomingRecord.event_name || incomingRecord.eventName || 'General',
    image_url: incomingRecord.image_url || incomingRecord.imageUrl || '',
    created_at: incomingRecord.created_at || incomingRecord.createdAt || new Date().toISOString()
  }, GALLERY_COLUMNS);

  sheet.appendRow(GALLERY_COLUMNS.map((key) => record[key]));
  return record;
}

function uploadMedia(payload) {
  const folderId = String(payload.folderId || '').trim();
  const base64Data = String(payload.base64Data || '').trim();
  const fileName = String(payload.fileName || 'family-media');
  const mimeType = String(payload.mimeType || 'application/octet-stream');
  const makePublic = payload.makePublic === true;

  if (!folderId) {
    throw new Error('Missing Google Drive folder id.');
  }

  if (!base64Data) {
    throw new Error('Missing file content.');
  }

  const folder = DriveApp.getFolderById(folderId);
  const bytes = Utilities.base64Decode(base64Data);
  const blob = Utilities.newBlob(bytes, mimeType, fileName);
  const file = folder.createFile(blob);

  if (makePublic) {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }

  return {
    fileId: file.getId(),
    fileUrl: `https://drive.google.com/uc?export=view&id=${file.getId()}`
  };
}
