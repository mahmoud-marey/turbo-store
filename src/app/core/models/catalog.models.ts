export interface ProductImage {
  thumb: string;
  medium: string;
  large: string;
}

export interface ProductSpec {
  group: string;
  label: string;
  value: string;
}

export interface ProductReview {
  author: string;
  rating: number;
  comment: string;
  date: string;
  demo: boolean;
}

export interface ProductListItem {
  id: number;
  slug: string;
  name: string;
  model: string;
  brand: string;
  brandSlug: string;
  categorySlugs: string[];
  price: number;
  oldPrice: number | null;
  currency: 'EGP';
  stock: number;
  inStock: boolean;
  image: string;
  labels: string[];
  tags: string[];
  shortDescription: string;
  rating: number;
  reviewCount: number;
  specs: ProductSpec[];
}

export interface ProductDetail extends ProductListItem {
  images: ProductImage[];
  descriptionHtml: string;
  reviews: ProductReview[];
}

export interface Category {
  slug: string;
  name: string;
  nameAr: string;
  parentSlug: string | null;
  productCount?: number;
  image?: string;
}

export interface Brand {
  slug: string;
  name: string;
  logo?: string;
}

export interface HomeSlide {
  image: string;
  title: string;
  subtitle?: string;
  href: string;
}

export interface HomeTile {
  slug: string;
  name: string;
  fromLabel?: string;
  image?: string;
}

export interface HomeRail {
  id: string;
  title: string;
  productSlugs: string[];
}

export interface TrustItem {
  id: string;
  title: string;
  titleAr: string;
  text: string;
  textAr: string;
}

export interface HomeData {
  hero: HomeSlide[];
  categoryTiles: HomeTile[];
  rails: HomeRail[];
  trust: TrustItem[];
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    facebook: string;
  };
  slogans: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  html: string;
  date: string;
}

export interface ContentPage {
  title: string;
  html: string;
}

export interface FacetValue {
  value: string;
  count: number;
}

export interface FilterMeta {
  brands: FacetValue[];
  cpu: FacetValue[];
  gpu: FacetValue[];
  ram: FacetValue[];
  storage: FacetValue[];
  refresh: FacetValue[];
  priceBuckets: { id: string; min: number; max: number | null; label: string }[];
}

export interface BuilderPart {
  slug: string;
  name: string;
  price: number;
  image: string;
  brand: string;
  socket?: string | null;
  ramType?: string | null;
  form?: string | null;
  wattage?: number | null;
  tdp?: number | null;
}

export interface BuilderCatalog {
  cpu: BuilderPart[];
  motherboard: BuilderPart[];
  ram: BuilderPart[];
  gpu: BuilderPart[];
  storage: BuilderPart[];
  psu: BuilderPart[];
  case: BuilderPart[];
  cooler: BuilderPart[];
}

export type BuilderSlot = keyof BuilderCatalog;

export interface CatalogQuery {
  category?: string;
  brand?: string | string[];
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  cpu?: string | string[];
  gpu?: string | string[];
  ram?: string | string[];
  storage?: string | string[];
  refresh?: string | string[];
  inStock?: boolean;
  sort?: 'default' | 'name' | 'price' | 'model' | 'rating';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  facets: Record<string, FacetValue[]>;
}

export interface CartLine {
  slug: string;
  qty: number;
}
