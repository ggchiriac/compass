import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './utils/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
      spacing: {
        '0.5vh': '0.5vh',
        '1vh': '1vh',
        '0.5vw': '0.5vw',
        '1vw': '1vw',
      },
      colors: {
        // Darker Day Theme
        'day-primary': '#B26400', // Darkened Princeton Orange
        'day-secondary': '#333333', // Softened Black
        'day-accent': '#093E70', // Darkened Princeton Blue
        'day-text': '#D9D9D9', // Light Gray for text

        // Night Theme
        'night-primary': '#121212', // Near Black
        'night-secondary': '#1E1E1E', // Dark Gray
        'night-accent': '#324A5E', // Soft Blue
        'night-text': '#E0E0E0', // Soft White for text
      },
      textColor: {
        'hoagieplan-blue': '#0F1E2F',
        'hoagieplan-gray': '#F6F6F6',
        'hoagieplan-black': '#2C2C2C',
        'hoagieplan-purple': '#663399',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      backgroundColor: {
        'dnd-gray': 'rgba(0, 0, 0, 0.05)', // Background "on hover" color dnd uses
      },
    },
  },
  plugins: [require('evergreen-ui'), require('@tailwindcss/forms')],
};

export default config;
