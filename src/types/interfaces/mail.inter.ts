export interface EmailOptions {
    to: string;
    subject: string;
    templateName: string;
    placeholders?: Record<string, string>;
  }
  