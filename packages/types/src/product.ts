export type Product = {
  id: number;
  name: string; 
  price: number;
  description?: string;
  imageUrl?: string;
  image?: { url: string }; 
  inStock?: boolean;
  category?: { name: string }; 
};