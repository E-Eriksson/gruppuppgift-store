'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./store/auth";
import styles from "./products/ProductList.module.css";
import { API_URL } from "../../../packages/api/src/fetchProducts";

export default function ProfilePage() {
  const { user, jwt, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jwt || !user) {
      router.replace("/login-register");
      return;
    }
    const fetchOrders = async () => {
      try {
        
        const res = await fetch(
          `${API_URL}/api/orders?filters[user]=${user.id}&populate=*`,
          {
            headers: { Authorization: `Bearer ${jwt}` },
          }
        );
        const data = await res.json();
        setOrders(data.data || []);
      } catch (err) {
        setOrders([]);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [jwt, user, router]);

  if (!user) {
    return null; 
  }

  return (
    <div className={styles.profileContainer}>
      <h2>Profile</h2>
      <div className={styles.profileInfo}>
        <div>
          <b>Username:</b> {user.username}
        </div>
        <div>
          <b>Email:</b> {user.email}
        </div>
        <button className={styles.logoutBtn} onClick={logout}>
          Logout
        </button>
      </div>
      <h3>Your Orders</h3>
      {loading ? (
        <div>Loading...</div>
      ) : orders.length === 0 ? (
        <div>No orders found.</div>
      ) : (
        <ul>
          {orders.map((order: any) => (
            <li key={order.id}>
              <b>Order #{order.id}</b> – Total: {order.attributes.total} SEK
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}