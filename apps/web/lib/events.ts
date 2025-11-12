// /lib/events.ts

export interface Product {
  id: number
  name: string
  price: number
  category?: string
}

export interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  category?: string
}

// Hjälpfunktion för att skicka events
const sendEvent = (eventName: string, parameters: any) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, parameters);
  }
}

// ============== PAGE VIEW & NAVIGATION ==============
export const trackPageView = (pageTitle: string, pageLocation: string) => {
  sendEvent('page_view', {
    page_title: pageTitle,
    page_location: pageLocation,
  });
}

// ============== PRODUCT EVENTS ==============
export const trackProductView = (product: Product) => {
  sendEvent('view_item', {
    currency: 'SEK',
    value: product.price,
    items: [
      {
        item_id: product.id.toString(),
        item_name: product.name,
        price: product.price,
        item_category: product.category,
      },
    ],
  });
}

export const trackProductClick = (product: Product, listName?: string) => {
  sendEvent('select_item', {
    item_list_name: listName || 'product_list',
    items: [
      {
        item_id: product.id.toString(),
        item_name: product.name,
        price: product.price,
        item_category: product.category,
      },
    ],
  });
}

// ============== CART & CHECKOUT FUNNEL ==============
export const trackAddToCart = (product: Product) => {
  sendEvent('add_to_cart', {
    currency: 'SEK',
    value: product.price,
    items: [
      {
        item_id: product.id.toString(),
        item_name: product.name,
        price: product.price,
        item_category: product.category,
        quantity: 1,
      },
    ],
  });
}

export const trackRemoveFromCart = (product: Product) => {
  sendEvent('remove_from_cart', {
    currency: 'SEK',
    value: product.price,
    items: [
      {
        item_id: product.id.toString(),
        item_name: product.name,
        price: product.price,
        item_category: product.category,
      },
    ],
  });
}

export const trackViewCart = (cartItems: CartItem[], total: number) => {
  sendEvent('view_cart', {
    currency: 'SEK',
    value: total,
    items: cartItems.map(item => ({
      item_id: item.id.toString(),
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
      item_category: item.category,
    })),
  });
}

export const trackBeginCheckout = (cartItems: CartItem[], total: number) => {
  sendEvent('begin_checkout', {
    currency: 'SEK',
    value: total,
    items: cartItems.map(item => ({
      item_id: item.id.toString(),
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
      item_category: item.category,
    })),
  });
}

export const trackAddShippingInfo = (shippingTier: string) => {
  sendEvent('add_shipping_info', {
    shipping_tier: shippingTier,
    currency: 'SEK',
  });
}

export const trackAddPaymentInfo = (paymentType: string) => {
  sendEvent('add_payment_info', { 
    payment_type: paymentType,
    currency: 'SEK',
  });
}

export const trackPurchase = (orderId: string, total: number, items: CartItem[]) => {
  sendEvent('purchase', {
    transaction_id: orderId,
    value: total,
    currency: 'SEK',
    items: items.map(item => ({
      item_id: item.id.toString(),
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
      item_category: item.category,
    })),
  });
}

// ============== CTA & ENGAGEMENT EVENTS ==============
export const trackSearch = (searchTerm: string) => {
  sendEvent('search', {
    search_term: searchTerm,
  });
}

export const trackCategoryView = (categoryName: string) => {
  sendEvent('view_item_list', {
    item_list_name: categoryName,
  });
}