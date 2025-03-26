import Link from "next/link";

export default function Header() {
  return (
    <nav>
      <ul>
        <li><Link href="/">Home</Link></li>
        <li><Link href="/products">Products</Link></li>
        <li><Link href="/cart">Cart</Link></li>
        <li><Link href="/orders">Orders</Link></li>  {/* ✅ Added Orders Link */}
        <li><Link href="/profile">Profile</Link></li>
        <a href="/login" style={{ marginRight: "10px" }}>Login</a>
      </ul>
    </nav>
  );
}
