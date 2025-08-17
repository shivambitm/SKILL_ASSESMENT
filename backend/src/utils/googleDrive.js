const { google } = require('googleapis');
const fs = require('fs');

console.log('🔧 [GoogleDrive] Initializing Google Drive service...');

function getDriveService() {
  try {
    const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH;
    console.log('🔧 [GoogleDrive] Service account key path:', keyPath);
    
    if (!keyPath || !fs.existsSync(keyPath)) {
      console.error('❌ [GoogleDrive] Service account JSON file not found:', keyPath);
      throw new Error('Google service account JSON file not found');
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: ['https://www.googleapis.com/auth/drive']
    });
    
    const drive = google.drive({ version: 'v3', auth });
    console.log('✅ [GoogleDrive] Drive service initialized successfully');
    return drive;
  } catch (error) {
    console.error('❌ [GoogleDrive] Failed to initialize drive service:', error);
    throw error;
  }
}

async function uploadToDrive(localPath, name) {
  console.log('📤 [GoogleDrive] Starting upload:', { localPath, name });
  
  try {
    const drive = getDriveService();
    const folderId = process.env.DRIVE_RECORDINGS_FOLDER_ID;
    
    if (!folderId) {
      throw new Error('DRIVE_RECORDINGS_FOLDER_ID not configured');
    }
    
    console.log('📁 [GoogleDrive] Target folder ID:', folderId);
    
    const res = await drive.files.create({
      requestBody: { name, parents: [folderId] },
      media: { mimeType: 'video/mp4', body: fs.createReadStream(localPath) },
      fields: 'id, name, size, webViewLink, webContentLink'
    });
    
    const fileId = res.data.id;
    console.log('✅ [GoogleDrive] File uploaded with ID:', fileId);
    
    // Make link shareable (anyone with link)
    await drive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone' }
    });
    
    console.log('🔗 [GoogleDrive] File made publicly accessible');
    
    const get = await drive.files.get({ fileId, fields: 'id, webViewLink, webContentLink' });
    
    const result = { 
      fileId, 
      viewLink: get.data.webViewLink, 
      downloadLink: get.data.webContentLink 
    };
    
    console.log('✅ [GoogleDrive] Upload completed:', result);
    return result;
  } catch (error) {
    console.error('❌ [GoogleDrive] Upload failed:', error);
    throw error;
  }
}

async function deleteFromDrive(fileId) {
  console.log('🗑️ [GoogleDrive] Deleting file:', fileId);
  
  try {
    const drive = getDriveService();
    await drive.files.delete({ fileId });
    console.log('✅ [GoogleDrive] File deleted successfully:', fileId);
  } catch (error) {
    console.error('❌ [GoogleDrive] Delete failed:', error);
    throw error;
  }
}

module.exports = { uploadToDrive, deleteFromDrive };