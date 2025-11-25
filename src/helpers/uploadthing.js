const fs = require('fs');
const path = require('path');

let utapiInstance = null;
let UTFileCtor = null;

async function getUploadThingClient() {
  if (!utapiInstance) {
    const utModule = await import('uploadthing/server');
    const { UTApi, UTFile } = utModule;

    utapiInstance = new UTApi();

    UTFileCtor = UTFile;
  }

  return { utapi: utapiInstance, UTFile: UTFileCtor };
}

async function uploadFileToUploadThing(filePath, options = {}) {
  const { utapi, UTFile } = await getUploadThingClient();

  const fileBuffer = fs.readFileSync(filePath);
  const fileName = options.fileName || path.basename(filePath);
  const mimetype = options.mimetype || 'application/octet-stream';

  if (!UTFile) {
    throw new Error('UploadThing UTFile helper not available');
  }

  const file = new UTFile([fileBuffer], fileName, { type: mimetype });

  const result = await utapi.uploadFiles(file);
  const response = Array.isArray(result) ? result[0] : result;

  if (!response || !response.data || response.error) {
    const errorMessage = response && response.error ? response.error.message : 'Unknown UploadThing error';
    throw new Error(`UploadThing upload failed: ${errorMessage}`);
  }

  return response.data.url;
}

module.exports = {
  uploadFileToUploadThing
};
