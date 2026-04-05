/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    fontFamily: {
      logo: ["Tac One", "sans-serif"],
      text: ["Nunito"],
    },
    extend: {
      colors: {
        lightBackground: "#FAFAFA",
        darkBackground: "#1E293B",
        lightText: "#0F172A",
        darkText: "#475569",
        btn2: "#2563EB",
        btn1: "#0891B2",
        accent: "#0D9488",
        primary: "#1E40AF",
        secondary: "#64748B",
        dark: {
          surface: "#1e293b",
          card: "#1e293b",
          border: "#334155",
          hover: "#334155",
          muted: "#94a3b8",
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "300ms",
        slow: "500ms",
      },
      backgroundImage: {
        img3: 'url("https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
        img2: 'url("https://plus.unsplash.com/premium_photo-1669920081568-478f50845db7?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
        img1: 'url("https://wallpapers.com/images/featured/healthcare-oco8w27tkw40cp90.jpg")',
        doc: 'url("https://images.unsplash.com/photo-1655313719493-16ebe4906441?q=80&w=1471&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dp")',
        bg1: 'url("https://images.unsplash.com/photo-1535378917042-10a22c95931a?q=80&w=1448&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
      },
      // ✅ NEW ANIMATIONS
      animation: {
        'blob': 'blob 7s infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slideUp': 'slideUp 0.5s ease-out',
        'slideDown': 'slideDown 0.5s ease-out',
        'slideLeft': 'slideLeft 0.5s ease-out',
        'slideRight': 'slideRight 0.5s ease-out',
        'fadeIn': 'fadeIn 0.6s ease-in',
        'scaleIn': 'scaleIn 0.5s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
      },
      // ✅ KEYFRAMES FOR ANIMATIONS
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
            opacity: '0.5',
          },
          '50%': {
            transform: 'translateY(-20px)',
            opacity: '1',
          },
        },
        slideUp: {
          '0%': {
            transform: 'translateY(100px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        slideDown: {
          '0%': {
            transform: 'translateY(-100px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        slideLeft: {
          '0%': {
            transform: 'translateX(100px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        slideRight: {
          '0%': {
            transform: 'translateX(-100px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        fadeIn: {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
        },
        scaleIn: {
          '0%': {
            transform: 'scale(0.9)',
            opacity: '0',
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
        },
        glow: {
          '0%': {
            boxShadow: '0 0 5px rgba(37, 99, 235, 0.2), 0 0 20px rgba(37, 99, 235, 0.1)',
          },
          '100%': {
            boxShadow: '0 0 10px rgba(37, 99, 235, 0.4), 0 0 40px rgba(37, 99, 235, 0.2)',
          },
        },
      },
      // ✅ ANIMATION DELAYS
      transitionDelay: {
        '0': '0ms',
        '200': '200ms',
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '1000': '1000ms',
        '2000': '2000ms',
        '4000': '4000ms',
      },
      // ✅ BOX SHADOWS
      boxShadow: {
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
        'inner-lg': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'glow-sm': '0 0 10px rgba(37, 99, 235, 0.15)',
        'glow-md': '0 0 20px rgba(37, 99, 235, 0.2)',
        'glow-lg': '0 0 30px rgba(37, 99, 235, 0.25)',
        'dark-lg': '0 10px 25px rgba(0, 0, 0, 0.5)',
        'dark-xl': '0 20px 40px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
};
