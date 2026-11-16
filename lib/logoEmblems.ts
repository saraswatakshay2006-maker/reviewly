export type LogoEmblemType =
  | "gym"
  | "dental"
  | "healthcare"
  | "legal"
  | "restaurant"
  | "cafe"
  | "bakery"
  | "salon"
  | "spa"
  | "tech"
  | "realestate"
  | "finance"
  | "automotive"
  | "hotel"
  | "retail"
  | "jewelry"
  | "pet"
  | "cleaning"
  | "photography"
  | "construction"
  | "education"
  | "travel"
  | "music"
  | "security"
  | "universal_crest"
  | "universal_shield"
  | "universal_hexagon"
  | "universal_star"
  | "crest"; // legacy alias

export interface EmblemCatalogItem {
  id: LogoEmblemType;
  label: string;
  category: "Popular" | "Wellness & Health" | "Food & Hospitality" | "Services & Retail" | "Universal Monograms";
  icon: string;
  desc: string;
}

export const ALL_LOGO_EMBLEMS: EmblemCatalogItem[] = [
  // Universal Monograms (Unique to ANY business)
  { id: "universal_crest", label: "Royal Laurel Crest", category: "Universal Monograms", icon: "👑", desc: "Laurel wreath monogram seal" },
  { id: "universal_shield", label: "Heraldic Shield", category: "Universal Monograms", icon: "🛡️", desc: "Modern faceted coat of arms" },
  { id: "universal_star", label: "5-Star Medallion", category: "Universal Monograms", icon: "⭐", desc: "Excellence star badge" },
  { id: "universal_hexagon", label: "Geometric Hexagon", category: "Universal Monograms", icon: "⬡", desc: "Contemporary tech monogram" },

  // Wellness & Health
  { id: "gym", label: "Gym & Fitness", category: "Wellness & Health", icon: "🏋️", desc: "Barbell & weight plates" },
  { id: "dental", label: "Dental & Ortho", category: "Wellness & Health", icon: "🦷", desc: "Crown tooth with sparkle" },
  { id: "healthcare", label: "Clinic & Hospital", category: "Wellness & Health", icon: "🩺", desc: "Heart cross & stethoscope" },
  { id: "salon", label: "Salon & Hair", category: "Wellness & Health", icon: "✂️", desc: "Styling shears & comb" },
  { id: "spa", label: "Spa & Wellness", category: "Wellness & Health", icon: "🪷", desc: "Lotus flower & zen stone" },

  // Food & Hospitality
  { id: "restaurant", label: "Restaurant & Dining", category: "Food & Hospitality", icon: "🍽️", desc: "Chef cloche & cutlery" },
  { id: "cafe", label: "Cafe & Coffee", category: "Food & Hospitality", icon: "☕", desc: "Steaming coffee mug" },
  { id: "bakery", label: "Bakery & Sweets", category: "Food & Hospitality", icon: "🥐", desc: "Artisan bread & wheat" },
  { id: "hotel", label: "Hotel & Luxury", category: "Food & Hospitality", icon: "🏰", desc: "Imperial royal crown" },

  // Professional & Local Services
  { id: "legal", label: "Law & Attorney", category: "Services & Retail", icon: "⚖️", desc: "Scales of justice" },
  { id: "realestate", label: "Real Estate & Homes", category: "Services & Retail", icon: "🏠", desc: "Skyline roof & gable" },
  { id: "finance", label: "Finance & Accounts", category: "Services & Retail", icon: "🏛️", desc: "Classical pillar & vault" },
  { id: "tech", label: "IT & Software", category: "Services & Retail", icon: "💻", desc: "Circuit cube matrix" },
  { id: "automotive", label: "Automotive & Car", category: "Services & Retail", icon: "🚗", desc: "Aerodynamic car silhouette" },
  { id: "retail", label: "Retail & Boutique", category: "Services & Retail", icon: "🛍️", desc: "Shopping bag & star tag" },
  { id: "jewelry", label: "Jewelry & Gems", category: "Services & Retail", icon: "💎", desc: "Faceted brilliant diamond" },
  { id: "pet", label: "Pet Care & Vet", category: "Services & Retail", icon: "🐾", desc: "Heart paw print" },
  { id: "cleaning", label: "Cleaning & Wash", category: "Services & Retail", icon: "✨", desc: "Sparkle shine & spray" },
  { id: "photography", label: "Photo & Studio", category: "Services & Retail", icon: "📷", desc: "Camera lens aperture" },
  { id: "construction", label: "Construction & Build", category: "Services & Retail", icon: "🏗️", desc: "Drafting compass & beam" },
  { id: "education", label: "Education & Coaching", category: "Services & Retail", icon: "🎓", desc: "Mortarboard & book" },
  { id: "travel", label: "Travel & Tours", category: "Services & Retail", icon: "✈️", desc: "Compass rose & airplane" },
  { id: "music", label: "Music & Audio", category: "Services & Retail", icon: "🎵", desc: "Treble clef & soundwave" },
  { id: "security", label: "Security & Guard", category: "Services & Retail", icon: "🔒", desc: "Security shield & padlock" },
];

/**
 * Extracts 1-2 clean uppercase initials from a business name
 */
export function getBusinessInitials(name?: string): string {
  if (!name || !name.trim()) return "HQ";
  const words = name
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1 && words[0].length >= 2) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0] || "HQ").toUpperCase();
}

/**
 * Deterministic hash for business name to select a unique universal emblem
 */
export function getBusinessHash(str: string = ""): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Matches text against industry categories using normalized tokens & boundaries
 */
function matchCategoryKeywords(text: string): LogoEmblemType | null {
  if (!text || !text.trim()) return null;

  // 1. Dental
  if (text.includes("dent") || text.includes("tooth") || text.includes("teeth") || text.includes("ortho")) {
    return "dental";
  }

  // 2. Cafe / Coffee
  if (
    text.includes("cafe") ||
    text.includes("coffee") ||
    text.includes("tea") ||
    text.includes("brew") ||
    text.includes("espresso") ||
    text.includes("roast")
  ) {
    return "cafe";
  }

  // 3. Bakery / Sweets
  if (
    text.includes("bakery") ||
    text.includes("bake") ||
    text.includes("cake") ||
    text.includes("pastry") ||
    text.includes("sweet") ||
    text.includes("bread") ||
    text.includes("dessert")
  ) {
    return "bakery";
  }

  // 4. Restaurant / Food / Dining
  if (
    text.includes("restaurant") ||
    text.includes("dining") ||
    text.includes("bistro") ||
    text.includes("kitchen") ||
    text.includes("pizza") ||
    text.includes("burger") ||
    text.includes("food") ||
    text.includes("dhaba") ||
    text.includes("cater")
  ) {
    return "restaurant";
  }

  // 5. Legal / Law
  if (
    /\blaw(s|yer|yers)?\b/i.test(text) ||
    text.includes("legal") ||
    text.includes("advocate") ||
    text.includes("attorney") ||
    text.includes("court") ||
    text.includes("justice") ||
    text.includes("jur")
  ) {
    return "legal";
  }

  // 6. Gym / Fitness / Sports
  if (
    text.includes("gym") ||
    text.includes("fit") ||
    text.includes("workout") ||
    text.includes("train") ||
    text.includes("crossfit") ||
    text.includes("sports") ||
    text.includes("muscle") ||
    text.includes("athletics") ||
    text.includes("bodybuilding")
  ) {
    return "gym";
  }

  // 7. Pet Care & Veterinary
  if (
    /\b(pet|pets|paw|paws|claw|claws|dog|dogs|cat|cats|puppy|puppies|kitten|kittens|vet|veterinary|animal|animals)\b/i.test(
      text
    )
  ) {
    return "pet";
  }

  // 8. Healthcare / Medical / Clinic / Hospital
  if (
    text.includes("clinic") ||
    text.includes("hospital") ||
    text.includes("doctor") ||
    text.includes("dr.") ||
    text.includes("med") ||
    text.includes("pharma") ||
    text.includes("physio") ||
    text.includes("patient") ||
    (text.includes("health") && !text.includes("fit") && !text.includes("gym"))
  ) {
    return "healthcare";
  }

  // 9. Spa & Wellness
  if (
    /\b(spa|spas)\b/i.test(text) ||
    text.includes("wellness") ||
    text.includes("massage") ||
    text.includes("yoga") ||
    text.includes("ayurveda") ||
    text.includes("therapy")
  ) {
    return "spa";
  }

  // 10. Salon & Beauty
  if (
    text.includes("salon") ||
    text.includes("hair") ||
    text.includes("beauty") ||
    text.includes("nail") ||
    text.includes("barber") ||
    text.includes("makeup") ||
    text.includes("parlour") ||
    text.includes("lash")
  ) {
    return "salon";
  }

  // 11. Real Estate & Property
  if (
    text.includes("real estate") ||
    text.includes("realt") ||
    text.includes("property") ||
    text.includes("builder") ||
    text.includes("home") ||
    text.includes("housing") ||
    text.includes("developer")
  ) {
    return "realestate";
  }

  // 12. Finance & Tax
  if (
    text.includes("finance") ||
    text.includes("tax") ||
    text.includes("account") ||
    text.includes("wealth") ||
    text.includes("audit") ||
    text.includes("bank") ||
    text.includes("invest") ||
    text.includes("c.a.") ||
    text.includes("ca ")
  ) {
    return "finance";
  }

  // 13. Tech & Software
  if (
    text.includes("tech") ||
    text.includes("soft") ||
    text.includes("code") ||
    text.includes("digital") ||
    text.includes("cloud") ||
    text.includes("cyber") ||
    text.includes("data") ||
    /\b(ai|it|saas|app)\b/i.test(text)
  ) {
    return "tech";
  }

  // 14. Automotive & Car Care
  if (
    text.includes("car") ||
    text.includes("auto") ||
    text.includes("motor") ||
    text.includes("garage") ||
    text.includes("repair") ||
    text.includes("wheel") ||
    text.includes("tyre") ||
    text.includes("mechanic")
  ) {
    return "automotive";
  }

  // 15. Jewelry & Gems
  if (
    text.includes("jewel") ||
    text.includes("gem") ||
    /\bgold(smith|smiths)?\b/i.test(text) ||
    text.includes("diamond") ||
    /\bsilver\b/i.test(text) ||
    text.includes("ornament")
  ) {
    return "jewelry";
  }

  // 16. Cleaning & Laundry
  if (
    text.includes("clean") ||
    text.includes("wash") ||
    text.includes("laundry") ||
    text.includes("maid") ||
    text.includes("janitor") ||
    text.includes("dryclean")
  ) {
    return "cleaning";
  }

  // 17. Photography & Video
  if (
    text.includes("photo") ||
    text.includes("cinema") ||
    text.includes("video") ||
    text.includes("film") ||
    text.includes("shoot") ||
    (text.includes("studio") &&
      !text.includes("music") &&
      !text.includes("audio") &&
      !text.includes("sound") &&
      !text.includes("dance"))
  ) {
    return "photography";
  }

  // 18. Construction & Architecture
  if (
    text.includes("construct") ||
    text.includes("build") ||
    text.includes("architect") ||
    text.includes("interior") ||
    text.includes("renovat")
  ) {
    return "construction";
  }

  // 19. Music & Sound
  if (
    text.includes("music") ||
    text.includes("dj") ||
    text.includes("dance") ||
    text.includes("sound") ||
    text.includes("band") ||
    text.includes("audio")
  ) {
    return "music";
  }

  // 20. Education & Coaching
  if (
    text.includes("school") ||
    text.includes("academy") ||
    text.includes("coach") ||
    text.includes("tuition") ||
    text.includes("class") ||
    text.includes("edu") ||
    text.includes("college") ||
    text.includes("institute")
  ) {
    return "education";
  }

  // 21. Hotel & Hospitality
  if (
    text.includes("hotel") ||
    text.includes("resort") ||
    text.includes("stay") ||
    /\binn(s)?\b/i.test(text) ||
    text.includes("suite") ||
    text.includes("lodge")
  ) {
    return "hotel";
  }

  // 22. Retail & Shopping
  if (
    text.includes("retail") ||
    text.includes("shop") ||
    text.includes("store") ||
    text.includes("mart") ||
    text.includes("boutique") ||
    text.includes("bazaar") ||
    text.includes("mall")
  ) {
    return "retail";
  }

  // 23. Travel & Tourism
  if (
    text.includes("travel") ||
    text.includes("tour") ||
    text.includes("trip") ||
    text.includes("holiday") ||
    text.includes("flight") ||
    text.includes("vacation")
  ) {
    return "travel";
  }

  // 24. Security
  if (
    text.includes("security") ||
    text.includes("guard") ||
    text.includes("safety") ||
    text.includes("protect") ||
    text.includes("alarm")
  ) {
    return "security";
  }

  return null;
}

/**
 * Intelligently infers the best vector emblem.
 * Evaluates business name first, then category/description.
 * If unmatched, returns a unique universal monogram badge based on business initials.
 * NEVER defaults to a gym dumbbell for non-gym businesses!
 */
export function inferEmblemType(
  category?: string,
  name?: string,
  description?: string
): LogoEmblemType {
  // 1. Check business name first (most specific brand identifier)
  const normName = (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const fromName = matchCategoryKeywords(normName);
  if (fromName) return fromName;

  // 2. Check category & description
  const normRest = `${category || ""} ${description || ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const fromRest = matchCategoryKeywords(normRest);
  if (fromRest) return fromRest;

  // 3. Fallback to unique universal monogram based on business name
  const hash = getBusinessHash(name || category || "business");
  const universalStyles: LogoEmblemType[] = [
    "universal_crest",
    "universal_shield",
    "universal_star",
    "universal_hexagon",
  ];
  return universalStyles[hash % universalStyles.length];
}
