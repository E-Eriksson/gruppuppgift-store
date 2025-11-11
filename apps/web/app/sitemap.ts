export default async function sitemap() {
    const CMS = process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:1337";
    const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const res = await fetch(`${CMS}/api/products?fields[0]=slug&pagination[pageSize]=100`, { cache: "no-store" });
    const json = await res.json();
    const slugs: string[] = (json.data || []).map((p: any) => p.attributes.slug);

    return [
        { url: `${SITE}/`, changeFrequency: "daily", priority: 1.0 },
        { url: `${SITE}/products`, changeFrequency: "daily", priority: 0.9 },
        ...slugs.map((slug) => ({ url: `${SITE}/products/${slug}`, changeFrequency: "weekly", priority: 0.8 })),
    ];
}
