declare module 'marked' {
  export const marked: any;
}

declare module 'turndown' {
  export default class TurndownService {
    constructor(options?: any);
    turndown(html: string): string;
  }
}
