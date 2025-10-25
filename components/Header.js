import Link from "next/link";

export default function Header() {
  return (
    <header>
      <div className="logo">AgriLink</div>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/products">Products</Link>
        <Link href="/cart">Cart</Link>
        <Link href="/orders">My Orders</Link>
        <Link href="/farmer-dashboard">Sell</Link>
        <Link href="/profile">Profile</Link>
        <Link href="/admin-dashboard">Admin</Link>
    
    
      </nav>
    
    </header>
  );
}
