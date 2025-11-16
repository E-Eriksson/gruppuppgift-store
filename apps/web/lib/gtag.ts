// lib/gtag.ts

// Add this type declaration at the top of the file
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: Record<string, any>[];
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

// GA4 event tracking - using recommended ecommerce events
export const gtagEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, parameters);
  }
};

// E-commerce events using GA4 recommended event names
export const ecommerceEvent = {
  // Product views
  viewItem: (product: { id: number; name: string; price: number; category?: string }) => {
    gtagEvent('view_item', {
      currency: 'SEK',
      value: product.price,
      items: [{
        item_id: product.id.toString(),
        item_name: product.name,
        price: product.price,
        category: product.category,
      }]
    });
  },

  viewItemList: (category: string) => {
    gtagEvent('view_item_list', {
      item_list_name: category,
    });
  },

  // Add to cart
  addToCart: (product: { id: number; name: string; price: number; category?: string }) => {
    gtagEvent('add_to_cart', {
      currency: 'SEK',
      value: product.price,
      items: [{
        item_id: product.id.toString(),
        item_name: product.name,
        price: product.price,
        category: product.category,
      }]
    });
  },

  // Remove from cart
  removeFromCart: (product: { id: number; name: string; price: number }) => {
    gtagEvent('remove_from_cart', {
      currency: 'SEK',
      value: product.price,
      items: [{
        item_id: product.id.toString(),
        item_name: product.name,
        price: product.price,
      }]
    });
  },

  // Begin checkout
  beginCheckout: (items: any[], total: number) => {
    gtagEvent('begin_checkout', {
      currency: 'SEK',
      value: total,
      items: items.map(item => ({
        item_id: item.id.toString(),
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      }))
    });
  },

  // Purchase
  purchase: (transactionId: string, total: number, items: any[]) => {
    gtagEvent('purchase', {
      transaction_id: transactionId,
      currency: 'SEK',
      value: total,
      items: items.map(item => ({
        item_id: item.id.toString(),
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      }))
    });
  },

  // Select item (for navigation/selection)
  selectItem: (product: { id: number; name: string; category?: string }) => {
    gtagEvent('select_item', {
      item_list_name: 'product_detail',
      items: [{
        item_id: product.id.toString(),
        item_name: product.name,
        category: product.category,
      }]
    });
  },

  // Navigation events
  pageView: (pageTitle: string, pageLocation: string) => {
    gtagEvent('page_view', {
      page_title: pageTitle,
      page_location: pageLocation,
    });
  }
};