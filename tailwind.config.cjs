/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#2563EB', // KRDS Standard Blue (Action)
                    50: '#eff6ff',
                    100: '#dbeafe',
                    500: '#3b82f6',
                    600: '#2563EB',
                    700: '#1d4ed8',
                },
                trust: {
                    DEFAULT: '#16325A', // KRDS / Government Navy (Brand)
                    light: '#2a4365',
                    dark: '#0f223d',
                },
                surface: {
                    DEFAULT: '#ffffff',
                    bg: '#F8FAFC', // Eye-comfort background
                    input: '#F1F5F9',
                }
            },
            fontFamily: {
                sans: ['Pretendard', 'sans-serif'],
                serif: ['Noto Serif KR', 'serif'],
                mono: ['JetBrains Mono', 'monospace'],
                // Specialized Blog Fonts
                'pretendard': ['Pretendard', 'sans-serif'],
                'wanted': ['"Wanted Sans"', 'Pretendard', 'sans-serif'],
                'nanum-square-neo': ['"NanumSquare Neo"', 'Pretendard', 'sans-serif'],
                'noto-serif': ['"Noto Serif KR"', 'serif'],
                'gmarket': ['"GmarketSans"', 'Pretendard', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
