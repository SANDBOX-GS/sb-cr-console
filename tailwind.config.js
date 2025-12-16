/** @type {import('tailwindcss').Config} */
const config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                ring: "#0ea5e9",
                destructive: "#f87171",
            },
            backgroundImage: {
                "primary-gradient": "linear-gradient(90deg, #4EDCF1 0%, #7FB7FB 100%)",
            },
        },
    },
    plugins: [],
};

export default config;