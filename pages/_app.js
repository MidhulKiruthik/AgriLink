// pages/_app.js
import "../styles/Header.css";  // ✅ Import header styles
import "../styles/footer.css";  // ✅ Import footer styles
import "../styles/home.css";    // ✅ Import home page styles
import "../styles/products.css"; // ✅ Import products page styles
import "../styles/layout.css";


export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
