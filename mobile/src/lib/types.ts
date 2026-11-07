export type RetreatStatus = 'Registration Open' | 'Waitlist' | 'Closed';

export type Retreat = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  speaker: string;
  conductor: string;
  description: string;
  dateRange: string;
  timeRange: string;
  location: string;
  availability: { total: number; male: number; female: number };
  status: RetreatStatus;
  imageSrc: string;
  category: string;
  categoryLabel: string;
  price?: number;
  isPaid?: boolean;
  startDate: string | null;
  endDate: string | null;
  ended: boolean;
};

export type Publication = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  author: string;
  category: string;
  format: string;
  coverImage: string;
  price: number;
  originalPrice?: number;
  rating: number;
  totalReviews: number;
  publishedOn: string;
  badge?: string;
  inStock?: boolean;
  soldCount?: number;
};

export type Catalogue = { items: Publication[]; deliveryFee: number; maxQuantity: number; currency: string };

export type ArticleSection = { heading?: string; paragraphs: string[] };

export type Article = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  heroImage: string;
  tag?: string;
  publishedOn?: string;
  readingTime?: string;
  author?: string;
  sections?: ArticleSection[];
  featuredQuote?: string;
  featuredScripture?: string;
  gallery?: string[];
};

export type GalleryMedia = {
  id: string;
  mediaType: 'image' | 'video' | 'audio' | 'cd';
  src: string;
  title: string;
  description?: string;
  orientation: 'portrait' | 'landscape' | 'square';
  caption?: string;
  date?: string;
  poster?: string;
  youtubeId?: string;
  duration?: string;
  artist?: string;
  album?: string;
  coverArt?: string;
};

export type Gallery = { photos: GalleryMedia[]; videos: GalleryMedia[]; audio: GalleryMedia[]; cds: GalleryMedia[] };

export type Ministry = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  overview: string;
  heroImage: string;
  highlightScripture?: string;
  focusAreas?: { title: string; description: string }[];
  gatherings?: { day: string; time: string; description: string }[];
  contact?: { coordinator: string; email: string; phone?: string };
  activities?: { id: string; title: string; description: string; image: string; date?: string }[];
};

export type SiteInfo = {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  contact: {
    phone: string;
    phoneHref: string;
    email: string;
    secondaryPhone: string;
    address: string;
    postal: string;
    officeHours: string[];
    mapsHref: string;
  };
  social: { label: string; href: string; icon: string }[];
};

export type Home = {
  site: SiteInfo;
  heroSlides: { id: string; imageUrl: string; title?: string | null; subtitle?: string | null }[];
  retreats: Retreat[];
  news: Article[];
  publications: Publication[];
  gallery: { id: string; src: string; title: string }[];
  testimonials: { id: string; name: string; role: string; imageUrl: string; quote: string }[];
};

export type Booking = {
  id: string;
  retreatId: string;
  retreatTitle: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'cancelled' | 'rescheduled' | string;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'waived' | string;
  attended: boolean;
  checkedInAt?: string;
  ticketCode?: string;
  familyMembers?: { name?: string; relationship?: string; age?: string | number }[];
  createdAt: string;
  cancelledAt?: string;
  rescheduledAt?: string;
};
