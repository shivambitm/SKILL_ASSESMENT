const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.auth = null;
    this.init();
  }

  async init() {
    try {
      // Service account credentials
      const credentials = {
        type: "service_account",
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
      };

      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });

      this.drive = google.drive({ version: 'v3', auth: this.auth });
      console.log('✅ Google Drive service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive:', error);
    }
  }

  async uploadRecording(filePath, fileName, roomId) {
    try {
      const fileMetadata = {
        name: fileName,
        parents: [await this.getOrCreateFolder('MeetingRecordings')]
      };

      const media = {
        mimeType: 'video/mp4',
        body: fs.createReadStream(filePath)
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,webViewLink,size'
      });

      // Make file publicly accessible
      await this.drive.permissions.create({
        fileId: response.data.id,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });

      // Get shareable link
      const file = await this.drive.files.get({
        fileId: response.data.id,
        fields: 'webViewLink,webContentLink'
      });

      return {
        fileId: response.data.id,
        webViewLink: file.data.webViewLink,
        downloadLink: file.data.webContentLink,
        fileSize: response.data.size
      };
    } catch (error) {
      console.error('❌ Failed to upload to Google Drive:', error);
      throw error;
    }
  }

  async getOrCreateFolder(folderName) {
    try {
      // Check if folder exists
      const response = await this.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id, name)'
      });

      if (response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // Create folder
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      return folder.data.id;
    } catch (error) {
      console.error('❌ Failed to create folder:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      await this.drive.files.delete({ fileId });
      console.log(`✅ Deleted file ${fileId} from Google Drive`);
    } catch (error) {
      console.error(`❌ Failed to delete file ${fileId}:`, error);
      throw error;
    }
  }
}

module.exports = new GoogleDriveService();