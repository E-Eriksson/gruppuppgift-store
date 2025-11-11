'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../store/auth";
import styles from "../products/ProductList.module.css";
import { API_URL } from "../../../../packages/api/src/fetchProducts";

export default function ProfilePage() {
  const { user, jwt, logout, login, register } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state för login/register
  const [form, setForm] = useState({ email: "", password: "", username: "" });
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!jwt || !user) return;
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
  }, [jwt, user]);

  // Hantera login/register
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await register(form.username, form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
    } catch (err: any) {
      setError(err?.message || "Login/Register failed");
    }
  };

  
  if (!isMounted) return null;

  
  if (!user) {
    return (
      <div className={styles.profileContainer}>
        <h2>{isRegister ? "Register" : "Login"}</h2>
        <form onSubmit={handleSubmit} className={styles.profileInfo}>
          {isRegister && (
            <div>
              <input
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
              />
            </div>
          )}
          <div>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit">{isRegister ? "Register" : "Login"}</button>
        </form>
        <button
          className={styles.logoutBtn}
          onClick={() => setIsRegister(r => !r)}
        >
          {isRegister ? "Already have an account? Login" : "No account? Register"}
        </button>
      </div>
    );
  }

  // Om inloggad: visa profil och ordrar
  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileIconRow}>
        <span className={styles.profileIconLarge} role="img" aria-label="profile">👤</span>
      </div>
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