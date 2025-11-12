import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import SeoProductJsonLd from "../../../components/SeoProductJsonLd";

const stripHtml = (s?: string) => (s ? s.replace(/<[^>]+>/g, "") : "");

async function getProduct(slug: string) {
    const CMS = process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:1337";
    const res = await fetch(`${CMS}/api/products?filters[slug][$eq]=${slug}&populate=deep`, { next: { revalidate: 60 } });
    const json = await res.json();
    const item = json.data?.[0];
    if (!item) return null;
    const a = item.attributes;
    return {
        name: a.name,
        slug: a.slug,
        price: a.price,
        description: a.description,
        image: a.image?.data?.attributes?.url
        ? (a.image.data.attributes.url.startsWith("http") ? a.image.data.attributes.url : `${CMS}${a.image.data.attributes.url}`)
        : null,
    };
}

function ProductJsonLd({ p }: { p: any }) {
    const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const data = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.name,
        image: p.image ? [p.image] : [`${SITE}/og-default.jpg`],
        description: stripHtml(p.description),
        offers: { "@type": "Offer", priceCurrency: "SEK", price: p.price, availability: "https://schema.org/InStock", url: `${SITE}/products/${p.slug}` },
    };
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
    }

    export default async function ProductPage({ params }: { params: { slug: string } }) {
    const product = await getProduct(params.slug);
    if (!product) return notFound();

    return (
        <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
        <SeoProductJsonLd product={product} />
        <ProductJsonLd p={product} />
        {product.image && (
            <Image src={product.image} alt={product.name} width={800} height={800} className="w-full max-w-md rounded-xl mb-6 h-auto" priority />
        )}
        <h2 className="text-lg text-neutral-600 mb-3">Product details</h2>
        <p className="mb-4">{stripHtml(product.description)}</p>
        <p className="text-xl font-semibold">{product.price} SEK</p>
        </main>
    );
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const CMS = process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:1337";
    const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const res = await fetch(`${CMS}/api/products?filters[slug][$eq]=${params.slug}&populate=deep`, { next: { revalidate: 60 } });
    const json = await res.json();
    const a = json.data?.[0]?.attributes;
    if (!a) return {};

    const title = `${a.name} | MyShop`;
    const description = stripHtml(a.description).slice(0, 155);
    const url = `${SITE}/products/${a.slug}`;
    const imgPath = a.image?.data?.attributes?.url;
    const imageUrl = imgPath?.startsWith("http") ? imgPath : (imgPath ? `${CMS}${imgPath}` : `${SITE}/og-default.jpg`);

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { title, description, url, type: "website", images: [{ url: imageUrl }] },
        twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
    };
}
