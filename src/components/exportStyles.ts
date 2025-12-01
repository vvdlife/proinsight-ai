
export const TABLE_STYLES = {
    table: "border-collapse: collapse; width: 100%; margin: 30px 0; font-size: 15px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);",
    th: "background-color: #f1f5f9; border-bottom: 2px solid #e2e8f0; padding: 14px; font-weight: bold; text-align: left; color: #1e293b; text-transform: uppercase; font-size: 14px;",
    td: "border-bottom: 1px solid #f1f5f9; padding: 14px; color: #334155; line-height: 1.6;",
};

export const PLATFORM_STYLES: Record<string, any> = {
    NAVER: {
        container: "font-family: 'Pretendard', 'Malgun Gothic', sans-serif; color: #374151;",
        h1: 'font-size: 34px; font-weight: 800; margin-bottom: 30px; color: #111; letter-spacing: -0.02em;',
        h2: 'font-size: 26px; font-weight: bold; margin-top: 40px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #f1f5f9; color: #111;',
        h3: 'font-size: 20px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; color: #333; border-left: 4px solid #03C75A; padding-left: 12px;',
        p: 'font-size: 17px; line-height: 1.8; color: #374151; margin-bottom: 20px;',
        blockquote: 'background-color: #f8fafc; border-left: 4px solid #03C75A; padding: 24px; margin: 30px 0; font-style: italic; color: #475569; font-family: "Noto Serif KR", serif; font-size: 18px;',
        link: 'color: #03C75A; text-decoration: underline; font-weight: bold;',
        bold: 'background-color: #fef9c3; padding: 0 4px; border-radius: 2px; color: #000;'
    },
    TISTORY: {
        container: "font-family: 'Pretendard', sans-serif; color: #333;",
        h1: 'font-size: 32px; font-weight: bold; margin-bottom: 24px; color: #222;',
        h2: 'font-size: 24px; font-weight: bold; margin-top: 40px; margin-bottom: 16px; color: #F44F05;',
        h3: 'font-size: 19px; font-weight: bold; margin-top: 24px; margin-bottom: 12px; color: #333;',
        p: 'font-size: 17px; line-height: 1.75; color: #444; margin-bottom: 18px;',
        blockquote: 'border-left: 4px solid #F44F05; padding-left: 18px; margin: 24px 0; color: #666; font-style: italic;',
        link: 'color: #F44F05; text-decoration: underline;',
        bold: 'font-weight: bold; color: #000;'
    },
    MEDIUM: {
        container: "font-family: 'Times New Roman', serif; color: #242424;",
        h1: 'font-size: 42px; font-weight: 400; margin-bottom: 10px; color: #242424;',
        h2: 'font-family: sans-serif; font-size: 24px; font-weight: 700; margin-top: 40px; margin-bottom: 14px; color: #242424;',
        h3: 'font-family: sans-serif; font-size: 20px; font-weight: 700; margin-top: 30px; margin-bottom: 10px; color: #242424;',
        p: 'font-size: 20px; line-height: 1.58; color: #242424; margin-bottom: 24px;',
        blockquote: 'border-left: 3px solid #242424; padding-left: 20px; font-style: italic; font-size: 24px;',
        link: 'color: #1a8917; text-decoration: underline;',
        bold: 'font-weight: 700;'
    },
    WORDPRESS: {
        container: "", h1: "", h2: "", h3: "", p: "", blockquote: "", link: "", bold: ""
    },
    SUBSTACK: {
        container: "font-family: sans-serif; color: #363636;",
        h1: 'font-size: 28px; font-weight: 800; margin-bottom: 16px; color: #1a1a1a;',
        h2: 'font-size: 20px; font-weight: 700; margin-top: 24px; margin-bottom: 12px; color: #1a1a1a;',
        h3: 'font-size: 18px; font-weight: 600; margin-top: 20px; margin-bottom: 8px;',
        p: 'font-size: 17px; line-height: 1.6; color: #363636; margin-bottom: 16px;',
        blockquote: 'padding-left: 16px; border-left: 3px solid #FF6719; font-style: italic;',
        link: 'color: #FF6719; text-decoration: underline;',
        bold: 'font-weight: bold;'
    }
};
