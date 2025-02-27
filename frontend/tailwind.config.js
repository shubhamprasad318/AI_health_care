/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      logo: ["Tac One", "sans-serif"],
      text: ["Nunito"],
    },
    extend: {
      colors: {
        lightBackground: "#fffff4",
        darkBackground: "#344955",
        lightText: "#51829B",
        darkText: " #7ED7C1",
        btn2: "#93C6E7",
        btn1: "#EFBC9B",
      },
      backgroundImage: {
        img3: 'url("https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
        img2: 'url("https://plus.unsplash.com/premium_photo-1669920081568-478f50845db7?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
        img1: 'url("https://wallpapers.com/images/featured/healthcare-oco8w27tkw40cp90.jpg")',
        doc: 'url("https://images.unsplash.com/photo-1655313719493-16ebe4906441?q=80&w=1471&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dp")',
        bg1: 'url("https://images.unsplash.com/photo-1535378917042-10a22c95931a?q=80&w=1448&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
      },
    },
  },
  plugins: [],
};
