import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Welcome to our store</h1>
      <Link href="/products">
        <button className={styles.button}>Start shopping</button>
      </Link>
    </div>
  );
}