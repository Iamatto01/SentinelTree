# Family Bubble Tree

This project uses a touch-friendly UI and now saves family records into **Google Sheets**, while uploaded photos/videos are saved into **Google Drive**.

## What changed

- Bigger cards and clearer labels for the family tree.
- Clear status text that tells people when saving is ready.
- A separate Add People page for creating new records.
- A recent additions panel that shows saved people from Google Sheets.
- CRUD support (create, read, update, delete) for people records via a Google Apps Script backend.

## Google setup (replace Supabase)

### 1) Configure frontend

Open `supabase-config.js` and set:

- `googleAppsScriptUrl`: your deployed Google Apps Script web app URL
- `googleSheetId`: `1OIc-werahd_lschkjQCIawH6kUb0lGvjJR_msysSaWY`
- `googleDriveFolderId`: `11IxCJ40ZjFZahJo3zx6Tk9WZ2W3HKSIX`
- `familyId`: keep as `jamal-awang-legacy` (or change if needed)

The Sheet and Drive IDs above are the current target resources requested for this project. Replace them if you want to use different resources.

### 2) Deploy the Google Apps Script backend

1. Create a Google Apps Script project.
2. Copy file `google-apps-script/Code.gs` into the project.
3. Deploy as **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone** (or Anyone with link)
4. Copy the Web app URL into `googleAppsScriptUrl` in config.

### 3) Google Sheet structure

The backend auto-creates/normalizes these sheets and columns:

- `family_members`:
  `id, family_id, name, relation, birthday, birth_place, occupation, phone, notes, parent_name, partner_name, family_head, image_url, created_at, updated_at`
- `gallery_images`:
  `id, family_id, event_name, image_url, created_at`

### 4) Use the app

1. Open `AddPeople.html` and fill in the form.
2. Upload a photo (it will be saved to Google Drive).
3. Save person (record + Drive link stored in Google Sheets).
4. Open `index.html` to view recent additions.
5. Edit/remove from profile modal (CRUD supported).

## Notes

- `Ketua keluarga` field is included on `AddPeople.html` for easier grouping in Google Sheets.
- If Drive upload is not configured, media fallback uses local Data URL behavior.
- Uploaded files are set to **Anyone with the link can view** in Google Drive by default (`Code.gs`), so avoid uploading sensitive media.
- The family tree visual still uses bundled tree data; recent additions and edit/remove come from saved records.
