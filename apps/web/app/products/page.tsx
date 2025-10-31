'use client';
import { useQuery } from '@tanstack/react-query';
import styles from './ProductList.module.css';

async function fetchProducts() {
  const res = await fetch('http://localhost:1337/api/products?populate=image');
  const data = await res.json();
  return data.data;
}

export default function ProductListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occured</div>;

  return (
    <div>
      <h1 className={styles.heading}>Check out our latest products</h1>
      <div className={styles.grid}>
        {data?.map((product: any) => (
          <div key={product.id} className={styles.card}>
            <h2 className={styles.title}>{product.name}</h2>
            <p className={styles.description}>{product.description}</p>
            <img
              src={`http://localhost:1337${product.image?.url}`}
              alt={product.name}
              width={300}
              className={styles.image}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
