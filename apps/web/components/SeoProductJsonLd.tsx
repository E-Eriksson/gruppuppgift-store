export default function SeoProductJsonLd({ product }: { product: any }) {
    const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const data = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        image: product.imageUrl ? [product.imageUrl] : [`${SITE}/og-default.jpg`],
        description: product.description,
        offers: {
            "@type": "Offer",
            priceCurrency: "SEK",
            price: product.price,
            availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `${SITE}/products/${product.slug}`,
        },
    };
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
