export type Product = {
  id: number;
  name: string; 
  slug: string; //======= SEO & CRO =======
  price: number;
  description?: string;
  imageUrl?: string;
  image?: { url: string }; 
  inStock?: boolean;
  category?: { name: string }; 
};