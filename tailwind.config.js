/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                serif: ['Lora', 'Georgia', 'serif'],
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                cream: {
                    50: '#FDFBF7',
                    100: '#FAF6EE',
                    200: '#F5EDDB',
                },
                literary: {
                    50: '#f0f7f6',
                    100: '#d9ece9',
                    200: '#b5d9d4',
                    300: '#88c0b8',
                    400: '#5fa39b',
                    500: '#1B5E54',
                    600: '#174f47',
                    700: '#14423b',
                    800: '#103530',
                    900: '#0c2925',
                },
                warm: {
                    50: '#faf8f5',
                    100: '#f3efe8',
                    200: '#e8e0d4',
                    300: '#d5c8b5',
                    400: '#bfaa8f',
                    500: '#a68e6e',
                    600: '#8c7558',
                    700: '#735e47',
                    800: '#5c4a3a',
                    900: '#4a3d30',
                },
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
            boxShadow: {
                'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
                'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
                'warm': '0 4px 14px 0 rgba(166, 142, 110, 0.12)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
}
