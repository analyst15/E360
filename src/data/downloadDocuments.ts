import { DownloadDocument } from '../types';

export const OFFICIAL_LEAVE_FORM_URL =
  'https://firebasestorage.googleapis.com/v0/b/keiyian-farm.firebasestorage.app/o/Elimisha%2FIT%20Ticketing%2FAdobe%20Scan%2002%20Oct%202026.pdf?alt=media&token=7fbf54e6-2107-4363-b0d8-aa9fc62b33d5';

export const DOWNLOAD_DOCUMENTS: DownloadDocument[] = [
  {
    id: 'leave-form',
    title: 'Employee Leave Form',
    downloadUrl: OFFICIAL_LEAVE_FORM_URL,
    fileName: 'Employee_Leave_Form.pdf',
    fileType: 'PDF',
  },
];
