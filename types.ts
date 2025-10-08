
export enum InputType {
    TEXT = 'text',
    IMAGE = 'image',
}
  
export interface UploadedImage {
    base64: string;
    type: string;
}
