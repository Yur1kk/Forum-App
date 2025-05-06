import { Injectable } from '@nestjs/common';
import { Dropbox } from 'dropbox';

@Injectable()
export class DropboxService {
  private dbx: Dropbox;

  constructor() {
    this.dbx = new Dropbox({
      accessToken: process.env.DROPBOX_ACCESS,
    });
  }

  async uploadBuffer(fileBuffer: Buffer, fileName: string): Promise<string> {
    try {
      const filePath = `/${fileName}`;

      const response = await this.dbx.filesUpload({
        path: filePath,
        contents: fileBuffer,
        mode: { '.tag': 'overwrite' }, 
      });


      const fileLinkResponse = await this.dbx.filesGetTemporaryLink({
        path: response.result.path_display,
      });

      return fileLinkResponse.result.link;
    } catch (error) {
      throw new Error('Failed to upload file to Dropbox: ' + error.message);
    }
  }
}
