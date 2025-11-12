// /lib/events.ts
import { event } from './gtag'

// Använd samma typer som i din cart store
export interface Product {
  id: number  // Ändra från string till number
  name: string
  price: number
  category?: string
  imageUrl?: string
}

export interface CartItem {
  id: number  // Ändra från string till number
  name: string
  price: number
  quantity: number
  category?: string
  imageUrl?: string
}

// ============== PAGE VIEW & NAVIGATION ==============
export const trackPageView = (pageTitle: string, pageLocation: string) => {
  event({
    action: 'page_view',
    params: {
      page_title: pageTitle,
      page_location: pageLocation,
    },
  })
}

// ============== PRODUCT EVENTS ==============
export const trackProductView = (product: Product) => {
  event({
    action: 'view_item',
    params: {
      currency: 'SEK',
      value: product.price,
      items: [
        {
          item_id: product.id.toString(),  // Konvertera till string för GA
          item_name: product.name,
          price: product.price,
          item_category: product.category,
        },
      ],
    },
  })
}

export const trackProductClick = (product: Product, listName?: string) => {
  event({
    action: 'select_item',
    params: {
      item_list_name: listName || 'product_list',
      items: [
        {
          item_id: product.id.toString(),  // Konvertera till string för GA
          item_name: product.name,
          price: product.price,
          item_category: product.category,
        },
      ],
    },
  })
}

// ============== CART & CHECKOUT FUNNEL ==============
export const trackAddToCart = (product: Product) => {
  event({
    action: 'add_to_cart',
    params: {
      currency: 'SEK',
      value: product.price,
      items: [
        {
          item_id: product.id.toString(),  // Konvertera till string för GA
          item_name: product.name,
          price: product.price,
          item_category: product.category,
          quantity: 1,
        },
      ],
    },
  })
}

export const trackRemoveFromCart = (product: Product) => {
  event({
    action: 'remove_from_cart',
    params: {
      currency: 'SEK',
      value: product.price,
      items: [
        {
          item_id: product.id.toString(),  // Konvertera till string för GA
          item_name: product.name,
          price: product.price,
          item_category: product.category,
        },
      ],
    },
  })
}

export const trackViewCart = (cartItems: CartItem[], total: number) => {
  event({
    action: 'view_cart',
    params: {
      currency: 'SEK',
      value: total,
      items: cartItems.map(item => ({
        item_id: item.id.toString(),  // Konvertera till string för GA
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: item.category,
      })),
    },
  })
}

export const trackBeginCheckout = (cartItems: CartItem[], total: number) => {
  event({
    action: 'begin_checkout',
    params: {
      currency: 'SEK',
      value: total,
      items: cartItems.map(item => ({
        item_id: item.id.toString(),  // Konvertera till string för GA
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: item.category,
      })),
    },
  })
}

export const trackAddShippingInfo = (shippingTier: string) => {
  event({
    action: 'add_shipping_info',
    params: {
      shipping_tier: shippingTier,
      currency: 'SEK',
    },
  })
}

export const trackAddPaymentInfo = (paymentType: string) => {
  event({
    action: 'add_payment_info',
    params: { 
      payment_type: paymentType,
      currency: 'SEK',
    },
  })
}

export const trackPurchase = (orderId: string, total: number, items: CartItem[]) => {
  event({
    action: 'purchase',
    params: {
      transaction_id: orderId,
      value: total,
      currency: 'SEK',
      items: items.map(item => ({
        item_id: item.id.toString(),  // Konvertera till string för GA
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: item.category,
      })),
    },
  })
}

// ============== CTA & ENGAGEMENT EVENTS ==============
export const trackSearch = (searchTerm: string) => {
  event({
    action: 'search',
    params: {
      search_term: searchTerm,
    },
  })
}

export const trackCategoryView = (categoryName: string) => {
  event({
    action: 'view_item_list',
    params: {
      item_list_name: categoryName,
    },
  })
}