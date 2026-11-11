export type ReviewLength = "short" | "medium" | "detailed";

export interface ReviewGenerationContext {
  businessName: string;
  category?: string;
  address?: string;
  description?: string;
  rating?: number | null;
  highlights?: string[];
  length?: ReviewLength;
  avoidDrafts?: string[];
  avoidOpenings?: string[];
}

export interface GeneratedReviewResult {
  text: string;
  highlightsUsed: string[];
  openingKey: string;
  archetype: string;
}

type DomainKey =
  | "gym"
  | "cafe"
  | "restaurant"
  | "salon"
  | "clinic"
  | "hotel"
  | "coaching"
  | "retail"
  | "other";

interface DomainSpec {
  seoNouns: string[];
  unisexNouns?: string[];
  highlights: { label: string; clauses: string[] }[];
  visitMoments: string[];
  positiveClosers: string[];
  fourStarClosers: string[];
  threeStarLines: string[];
  lowStarLines: string[];
}

function randomInt(max: number): number {
  if (max <= 1) return 0;
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const arr = new Uint32Array(1);
    globalThis.crypto.getRandomValues(arr);
    return arr[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function pick<T>(items: T[], exclude?: Set<T>): T {
  const pool = exclude ? items.filter((item) => !exclude.has(item)) : items;
  const active = pool.length > 0 ? pool : items;
  return active[randomInt(active.length)];
}

function capFirst(text: string): string {
  const t = text.trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function titleCaseLoose(text: string): string {
  return text
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      if (/^[A-Z0-9-]{2,}$/.test(word)) return word;
      if (/[A-Z]/.test(word.slice(1))) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Cleanly extracts a readable neighborhood/area phrase from a street address
 * so local SEO mentions sound natural (e.g. "barula bypass" -> "Barula Bypass").
 */
export function formatLocality(address?: string): string {
  if (!address) return "";
  let cleaned = address
    .replace(/\b\d{5,6}\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";

  const parts = cleaned
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !/^(india|shop|flat|plot|floor|no\.?)\s*\d*[a-z]?$/i.test(p));

  if (parts.length === 0) {
    cleaned = cleaned.replace(/^\d+[a-zA-Z]?[\s,/-]+/, "").trim();
  } else {
    const first = parts[0].replace(/^(plot|shop|house|flat|no\.?)\s*\d+[a-zA-Z]?\s*/i, "").trim();
    const meaningful = [first, ...parts.slice(1)].filter((p) => p.length > 1 && !/^\d+[a-zA-Z]?$/.test(p));
    cleaned = meaningful.slice(-2).join(", ");
  }

  if (!cleaned) return "";
  return titleCaseLoose(cleaned.replace(/^[,\s-]+|[,\s-]+$/g, ""));
}

function buildLocationPhrases(locality: string): string[] {
  if (!locality) return [];
  const isLandmark = /(bypass|road|rd|marg|highway|street|st|lane|chowk|circle|crossing|square|sector|phase|nagar|colony)/i.test(
    locality
  );
  if (isLandmark) {
    return [
      `near ${locality}`,
      `around ${locality}`,
      `on ${locality}`,
    ];
  }
  return [
    `in ${locality}`,
    `around ${locality}`,
    `near ${locality}`,
  ];
}

export function parseSpecialties(description?: string): string[] {
  if (!description) return [];
  const parts = description
    .split(/[,;\n•|]+|\s+&\s+/)
    .map((s) => s.replace(/^[-*.\s]+|[-*.\s]+$/g, "").trim())
    .map((s) => s.replace(/^(we offer|offering|known for|specializing in|services:?|highlights:?)\s+/i, "").trim())
    .filter((s) => s.length >= 3 && s.length <= 52);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(part);
    }
  }
  return unique.slice(0, 6);
}

function resolveDomain(businessName: string, category?: string, description?: string): DomainKey {
  const cat = (category || "").trim().toLowerCase();
  const text = `${businessName} ${description || ""}`.toLowerCase();

  const nameSignals: [RegExp, DomainKey][] = [
    [/\b(café|cafe|coffee|espresso|roaster|bakery|bistro|tea house|chai)\b/i, "cafe"],
    [/\b(gym|fitness|crossfit|barbell|workout|iron|physique)\b/i, "gym"],
    [/\b(salon|parlour|parlor|barber|hair studio|nail|grooming|spa|unisex studio)\b/i, "salon"],
    [/\b(clinic|dental|dentist|hospital|physio|healthcare|medical|diagnostics|doctor)\b/i, "clinic"],
    [/\b(hotel|resort|inn|suites|homestay|lodge|residency)\b/i, "hotel"],
    [/\b(coaching|academy|institute|classes|tuition|tutorial|prep)\b/i, "coaching"],
    [/\b(restaurant|kitchen|dhaba|diner|eatery|biryani|tandoor|grill|pizzeria|canteen)\b/i, "restaurant"],
  ];

  // If category matches a strong explicit option, respect it unless the business name clearly belongs to a different domain (e.g., default "Gym" left selected on a Cafe)
  let explicitDomain: DomainKey | null = null;
  if (cat.includes("gym") || cat.includes("fitness")) explicitDomain = "gym";
  else if (cat.includes("café") || cat.includes("cafe") || cat.includes("coffee")) explicitDomain = "cafe";
  else if (cat.includes("restaurant") || cat.includes("food") || cat.includes("dining")) explicitDomain = "restaurant";
  else if (cat.includes("salon") || cat.includes("spa") || cat.includes("beauty")) explicitDomain = "salon";
  else if (cat.includes("clinic") || cat.includes("health") || cat.includes("medical")) explicitDomain = "clinic";
  else if (cat.includes("hotel") || cat.includes("stay")) explicitDomain = "hotel";
  else if (cat.includes("coaching") || cat.includes("institute") || cat.includes("education")) explicitDomain = "coaching";
  else if (cat.includes("retail") || cat.includes("store") || cat.includes("shop")) explicitDomain = "retail";

  const matchedFromName = nameSignals.find(([re]) => re.test(businessName.toLowerCase()))?.[1] ?? null;
  if (matchedFromName && (!explicitDomain || explicitDomain !== matchedFromName)) {
    return matchedFromName;
  }
  if (explicitDomain) return explicitDomain;

  for (const [re, domain] of nameSignals) {
    if (re.test(text)) return domain;
  }
  return "other";
}

const DOMAINS: Record<DomainKey, DomainSpec> = {
  gym: {
    seoNouns: ["gym", "fitness studio", "workout space", "fitness center"],
    unisexNouns: ["unisex gym", "unisex fitness center", "gym", "workout studio"],
    highlights: [
      {
        label: "Well-kept equipment",
        clauses: [
          "the machines and free weights are well maintained and ready to use",
          "equipment is kept in good working order without broken pins or worn cables",
          "there is a solid mix of strength racks, dumbbells, and cardio machines",
          "weights stay racked neatly and the equipment feels sturdy during heavy sets",
        ],
      },
      {
        label: "Helpful trainers",
        clauses: [
          "the trainers actually pay attention to form instead of just standing around",
          "coaches on the floor are approachable and helpful whenever you need a quick spot or pointer",
          "staff guide beginners patiently without pushing expensive extras",
          "trainers keep the energy positive and check in naturally on your workout",
        ],
      },
      {
        label: "Clean & hygienic floor",
        clauses: [
          "the workout floor, mats, and washrooms are kept noticeably clean",
          "ventilation and hygiene across the floor make a big difference during peak hours",
          "mats and benches stay wiped down and the space smells fresh",
          "cleanliness stands out right when you walk onto the training floor",
        ],
      },
      {
        label: "Balanced crowd",
        clauses: [
          "you do not end up waiting forever just to get a bench or squat rack",
          "the floor layout gives you enough breathing room even during busy evening batches",
          "the crowd is respectful and focused, which makes daily sessions smooth",
          "everyone shares equipment smoothly and the atmosphere stays welcoming",
        ],
      },
      {
        label: "Great value",
        clauses: [
          "membership pricing feels fair for the quality of setup you get",
          "for the equipment and coaching access, the fees are very reasonable",
          "consistent upkeep makes every rupee of the membership worth it",
          "it hits a really practical balance between facilities and affordability",
        ],
      },
    ],
    visitMoments: [
      "after a few workout sessions",
      "stopping in for regular training",
      "trying out a session here",
      "working out here over the past few weeks",
      "dropping by during the evening batch",
    ],
    positiveClosers: [
      "Easy spot to stay consistent with fitness goals.",
      "Glad to have a dependable place like this to train.",
      "Definitely worth checking out if you want a serious yet comfortable workout vibe.",
      "Makes showing up for workouts feel effortless.",
      "One of the better places around to get a solid session in.",
    ],
    fourStarClosers: [
      "A solid everyday gym overall — happy with how smooth my workouts have been.",
      "A couple of busy moments during rush hour, yet the overall setup easily earns four stars.",
      "Very dependable for regular strength and cardio sessions.",
    ],
    threeStarLines: [
      "Equipment covers the essentials and staff are polite, though peak-hour waiting can slow things down a bit.",
      "Decent place for a regular workout; a bit more attention to maintenance and floor organization would make it even better.",
      "Overall an okay experience — basic training needs are covered cleanly, with room to elevate the vibe.",
    ],
    lowStarLines: [
      "Equipment availability and floor upkeep felt inconsistent during my visit, so my workout did not go as smoothly as hoped.",
      "Felt there is room to improve trainer responsiveness and facility upkeep during busy hours.",
      "Not the smoothest session this time — hoping the management tightens up maintenance and crowd flow.",
    ],
  },
  cafe: {
    seoNouns: ["café", "coffee spot", "coffee shop", "hangout café"],
    highlights: [
      {
        label: "Fresh coffee & taste",
        clauses: [
          "the coffee tastes freshly brewed with balanced flavor rather than overly sugary syrups",
          "drinks and snacks arrive fresh, hot, and consistently well made",
          "every cup has real aroma and care behind it, not rushed counter coffee",
          "the menu hits the mark on both coffee and quick bites",
        ],
      },
      {
        label: "Cozy seating",
        clauses: [
          "the seating is comfortable enough whether you stop for twenty minutes or catch up with friends",
          "lighting, music volume, and table spacing make it genuinely relaxing",
          "it has the kind of calm vibe where you can talk easily or get some reading done",
          "the interior feels thoughtfully put together without trying too hard",
        ],
      },
      {
        label: "Warm hospitality",
        clauses: [
          "the team behind the counter is warm, unhurried, and happy to suggest drinks",
          "service feels welcoming right from when you step up to order",
          "staff remember regular preferences and check in nicely without hovering",
          "everyone working there brings an easy, friendly energy",
        ],
      },
      {
        label: "Quick service",
        clauses: [
          "orders come out promptly even when several tables fill up at once",
          "wait times are short and takeaway packaging stays neat",
          "counter turnaround is crisp without compromising drink quality",
          "getting a quick coffee before heading out works smoothly here",
        ],
      },
      {
        label: "Clean & fresh vibe",
        clauses: [
          "tables are cleared quickly and the whole space feels spotless",
          "you notice the attention to cleanliness across the counter and seating area",
          "the café stays neat, airy, and pleasant throughout the day",
        ],
      },
    ],
    visitMoments: [
      "stopping by for an afternoon coffee",
      "dropping in for a quick catch-up",
      "grabbing a cup and a bite",
      "visiting over the weekend",
      "swinging by on my way through",
    ],
    positiveClosers: [
      "Easily a spot I'd come back to whenever I'm craving good coffee.",
      "Nice neighborhood find when you want quality drinks and zero rush.",
      "Feels genuine from the first sip to the last.",
      "Happy to recommend this spot to anyone who appreciates good coffee.",
    ],
    fourStarClosers: [
      "Really enjoyable coffee and vibe — would happily visit again.",
      "Took a few extra minutes on a busy table, though the flavor made up for it.",
      "Reliable spot to unwind with a solid brew.",
    ],
    threeStarLines: [
      "Cozy space and friendly counter staff, though our drinks were just okay taste-wise.",
      "Nice ambiance to sit for a while; a bit more consistency on prep speed and flavor would lift it.",
      "Decent neighborhood café overall, even if nothing on this visit stood out strongly.",
    ],
    lowStarLines: [
      "Wait time and order accuracy missed the mark during this stop, leaving the visit frustrating.",
      "The drinks did not taste quite fresh this time and service felt slow for a quiet hour.",
      "Hoping they tighten up service speed and drink consistency on busy shifts.",
    ],
  },
  restaurant: {
    seoNouns: ["restaurant", "dining spot", "food place", "eatery"],
    highlights: [
      {
        label: "Fresh & flavorful food",
        clauses: [
          "dishes arrive hot with balanced spices and fresh ingredients rather than heavy oil",
          "flavors feel authentic and freshly cooked to order",
          "portions are generous and every item on the table had real taste",
          "food consistency makes it easy to order confidently for a group or family",
        ],
      },
      {
        label: "Attentive table service",
        clauses: [
          "staff are polite, observant, and handle requests without needing reminders",
          "service pacing feels just right between starters and mains",
          "the team makes guests feel looked after from seating to the bill",
          "recommendations from the server turned out spot on",
        ],
      },
      {
        label: "Hygienic & welcoming",
        clauses: [
          "tableware, seating, and the dining area feel visibly clean and organized",
          "it works smoothly for family dinners as well as casual outings",
          "noise levels stay comfortable so you can actually enjoy conversation",
          "cleanliness in both presentation and seating gives real peace of mind",
        ],
      },
      {
        label: "Value for money",
        clauses: [
          "pricing stays reasonable considering both portion size and food quality",
          "you walk out satisfied without feeling overcharged",
          "great balance of taste, serving size, and fair billing",
        ],
      },
      {
        label: "Quick kitchen turnaround",
        clauses: [
          "food came out fresh and on time without long awkward waits",
          "even during dinner rush, dishes stayed warm and well timed",
          "kitchen timing kept the whole meal smooth from start to finish",
        ],
      },
    ],
    visitMoments: [
      "stopping in for a meal",
      "having dinner here with family",
      "grabbing lunch earlier today",
      "eating here after hearing good things",
      "trying out a few dishes here",
    ],
    positiveClosers: [
      "Already planning what to try on our next meal here.",
      "Simple, satisfying dining without unnecessary fuss.",
      "Definitely earns a spot on our regular dinner list.",
      "Worth visiting if you care about fresh food and calm hospitality.",
    ],
    fourStarClosers: [
      "Very good food and pleasant service — small wait at peak hour, otherwise great.",
      "Left full and happy; a dependable dining option whenever we're nearby.",
      "Tasty dishes and decent value for a relaxed meal out.",
    ],
    threeStarLines: [
      "Food quality was decent and portions were fair, though service felt stretched during the rush.",
      "A couple of dishes hit the mark while others felt average for the price.",
      "Clean seating and polite staff, with a little room to sharpen seasoning and pacing.",
    ],
    lowStarLines: [
      "Long wait times and lukewarm dishes took away from the meal this visit.",
      "Service coordination and food consistency fell short of expectations today.",
      "Hope the kitchen and floor team address pacing and freshness going forward.",
    ],
  },
  salon: {
    seoNouns: ["salon", "hair & grooming studio", "beauty salon", "styling studio"],
    highlights: [
      {
        label: "Skilled stylists",
        clauses: [
          "the stylist actually listened carefully before picking up the scissors instead of rushing",
          "finishing details and blending looked clean right away and settled nicely afterward",
          "work feels confident, unhurried, and tailored to what suits you",
          "technical skill and attention to detail show in the final look",
        ],
      },
      {
        label: "Clean & sanitized tools",
        clauses: [
          "stations, towels, and tools are sanitized neatly between clients",
          "hygiene around chairs, brushes, and wash stations feels reassuring",
          "everything looks tidy, organized, and fresh the moment you sit down",
        ],
      },
      {
        label: "No pushy upselling",
        clauses: [
          "you get honest advice without constant pressure to add extra treatments",
          "pricing is clear upfront with zero surprise add-ons at checkout",
          "consultations focus on what you actually want rather than selling packages",
        ],
      },
      {
        label: "Relaxed experience",
        clauses: [
          "appointments stay on schedule so you are not stuck waiting forever",
          "the atmosphere is calm, polite, and easy to settle into",
          "friendly staff make the whole grooming session feel effortless",
        ],
      },
    ],
    visitMoments: [
      "coming in for a haircut and grooming session",
      "booking an appointment here",
      "visiting for a styling refresh",
      "trying this place out for the first time",
    ],
    positiveClosers: [
      "Walking out feeling confident makes all the difference — I'll be back.",
      "Easy choice when you want neat work and respectful service.",
      "Reliable studio where you know you're in capable hands.",
    ],
    fourStarClosers: [
      "Clean finish and courteous staff — ran slightly behind schedule, otherwise awesome.",
      "Very satisfied with the result and transparent pricing.",
    ],
    threeStarLines: [
      "Tidy salon and polite staff, though the final styling felt a bit different from what I pictured.",
      "Okay grooming session overall; clearer consultation up front would help.",
    ],
    lowStarLines: [
      "Wait time ran long and the styling result did not match what we discussed at the start.",
      "Felt rushed in the chair this time, so the finish lacked attention to detail.",
    ],
  },
  clinic: {
    seoNouns: ["clinic", "healthcare clinic", "care center", "medical clinic"],
    highlights: [
      {
        label: "Attentive doctor",
        clauses: [
          "the doctor took time to listen patiently without rushing through symptoms",
          "consultation felt thorough, calm, and focused on addressing the root issue",
          "you never feel hurried out of the room before asking your questions",
        ],
      },
      {
        label: "Clear explanation",
        clauses: [
          "every step of the diagnosis and next steps was explained in plain language",
          "transparent guidance on treatment options built real trust",
          "questions were answered clearly without confusing jargon",
        ],
      },
      {
        label: "Minimal wait time",
        clauses: [
          "appointments moved smoothly so waiting room time stayed minimal",
          "front-desk coordination kept check-in and billing quick and organized",
          "scheduling ran close to time without crowded confusion",
        ],
      },
      {
        label: "Clean & reassuring space",
        clauses: [
          "the waiting area and consultation rooms are spotless and calm",
          "hygiene standards and staff courtesy put patients at ease right away",
          "nursing and reception staff handle visits gently and respectfully",
        ],
      },
    ],
    visitMoments: [
      "visiting for a consultation",
      "coming in for a check-up",
      "bringing family here for an appointment",
      "scheduling a follow-up visit",
    ],
    positiveClosers: [
      "Reassuring to have a well-run clinic nearby that treats patients with patience.",
      "Grateful for clear communication and smooth care.",
      "Easy to recommend when someone asks for trustworthy care locally.",
    ],
    fourStarClosers: [
      "Doctor and staff were thoughtful and clear; reception took a couple extra minutes, otherwise great.",
      "Clean clinic and genuine care — comfortable experience overall.",
    ],
    threeStarLines: [
      "Doctor was knowledgeable and polite, though the wait time ran longer than expected.",
      "Clean facility overall; clearer reception updates on queue timing would improve the visit.",
    ],
    lowStarLines: [
      "Long delays at reception and a brief consultation left several questions unanswered.",
      "Coordination and follow-up communication need improvement based on today's visit.",
    ],
  },
  hotel: {
    seoNouns: ["hotel", "stay", "hospitality property", "place to stay"],
    highlights: [
      {
        label: "Clean comfortable rooms",
        clauses: [
          "rooms were spotless with crisp linen, steady hot water, and quiet AC",
          "housekeeping kept everything fresh and well stocked throughout the stay",
          "bed comfort and quiet surroundings made sleeping effortless",
        ],
      },
      {
        label: "Courteous staff",
        clauses: [
          "front desk and room staff stayed polite, prompt, and helpful with local tips",
          "check-in and check-out took barely two minutes with zero friction",
          "every request was handled smoothly with genuine hospitality",
        ],
      },
      {
        label: "Convenient location",
        clauses: [
          "access to main roads and nearby essentials made getting around simple",
          "parking and commute connectivity saved plenty of travel time",
          "great base whether you're traveling for work or visiting with family",
        ],
      },
      {
        label: "Good value",
        clauses: [
          "rates match the comfort and upkeep well compared to nearby options",
          "breakfast and room quality felt thoughtfully priced",
        ],
      },
    ],
    visitMoments: [
      "staying here for a couple of nights",
      "booking a short work trip stay",
      "checking in over the weekend",
      "staying here with family",
    ],
    positiveClosers: [
      "Would gladly stay here again on my next trip through.",
      "Comfortable, peaceful rest without any hassle.",
      "Solid choice if cleanliness and quiet rooms matter most to you.",
    ],
    fourStarClosers: [
      "Pleasant stay overall with clean rooms and helpful staff.",
      "One minor housekeeping delay, quickly sorted — would stay again.",
    ],
    threeStarLines: [
      "Location and staff were polite, though room upkeep felt fairly basic.",
      "Okay overnight stay; slightly fresher amenities would raise the experience.",
    ],
    lowStarLines: [
      "Room cleanliness and response time from the front desk fell below expectations during this stay.",
      "Noise and maintenance issues kept the night from feeling restful.",
    ],
  },
  coaching: {
    seoNouns: ["coaching institute", "study center", "learning institute", "academy"],
    highlights: [
      {
        label: "Clear concept teaching",
        clauses: [
          "faculty break down tough topics step by step instead of rushing through slides",
          "classes focus on real conceptual understanding rather than rote memorization",
          "examples and practice sets make difficult chapters click faster",
        ],
      },
      {
        label: "Supportive mentors",
        clauses: [
          "teachers take time after class for one-on-one doubt clearing",
          "mentors keep track of student progress and give honest feedback",
          "staff stay approachable whenever students feel stuck on a topic",
        ],
      },
      {
        label: "Disciplined batches",
        clauses: [
          "batch sizes stay manageable so individual attention does not get lost",
          "timetables, tests, and study notes run consistently on schedule",
          "classrooms feel focused, clean, and conducive to serious study",
        ],
      },
      {
        label: "Regular practice & tests",
        clauses: [
          "periodic mock tests and review discussions build steady exam confidence",
          "practice material stays updated and genuinely helpful for revision",
        ],
      },
    ],
    visitMoments: [
      "attending regular batches here",
      "preparing here over the past few months",
      "joining classes and doubt sessions",
      "evaluating this institute after attending sessions",
    ],
    positiveClosers: [
      "Focused environment for students who want steady guidance and clarity.",
      "Really builds confidence when fundamentals are taught properly.",
      "Worth visiting for anyone looking for structured preparation nearby.",
    ],
    fourStarClosers: [
      "Good teaching quality and consistent schedule — helped sharpen fundamentals.",
      "Solid academic guidance overall with approachable faculty.",
    ],
    threeStarLines: [
      "Teaching is decent and material is helpful, though doubt-session timing can get crowded.",
      "Okay learning environment overall; stronger batch pacing would help.",
    ],
    lowStarLines: [
      "Schedule changes and limited personal attention made it harder to keep pace.",
      "Communication around batches and test feedback needs better structure.",
    ],
  },
  retail: {
    seoNouns: ["store", "shop", "outlet", "retail store"],
    highlights: [
      {
        label: "Quality products",
        clauses: [
          "stock quality feels genuine with fresh options across price ranges",
          "products match what's promised without misleading markup",
          "you can inspect items properly and find reliable choices easily",
        ],
      },
      {
        label: "Helpful staff",
        clauses: [
          "staff help you compare options honestly instead of pushing the priciest item",
          "quick assistance at the counter makes picking things up effortless",
          "team stays patient even when you want to check multiple items",
        ],
      },
      {
        label: "Fair pricing & quick billing",
        clauses: [
          "pricing is transparent and checkout moves fast without hassles",
          "neatly organized shelves save you from hunting around",
          "good variety alongside reasonable everyday pricing",
        ],
      },
    ],
    visitMoments: [
      "picking up a few items here",
      "shopping here earlier today",
      "stopping by to check out their stock",
      "buying from here recently",
    ],
    positiveClosers: [
      "Straightforward shopping experience — I'll definitely drop by again.",
      "Easy store to rely on when you want decent quality without overpaying.",
      "Saved me time and had exactly what I needed.",
    ],
    fourStarClosers: [
      "Good selection and polite staff — smooth checkout overall.",
      "Reliable neighborhood shop with sensible pricing.",
    ],
    threeStarLines: [
      "Decent basic variety, though some sizes or stock were limited today.",
      "Fair pricing overall; faster counter help during busy hours would improve it.",
    ],
    lowStarLines: [
      "Stock availability and counter support fell short during this visit.",
      "Billing took too long and assistance on the floor was hard to find.",
    ],
  },
  other: {
    seoNouns: ["local business", "service center", "place", "team"],
    highlights: [
      {
        label: "Helpful team",
        clauses: [
          "the team is polite, clear in communication, and genuinely easy to deal with",
          "staff take ownership and follow through instead of bouncing you around",
          "you feel welcomed and heard from the first interaction",
        ],
      },
      {
        label: "Smooth service",
        clauses: [
          "everything ran cleanly on time without unnecessary back-and-forth",
          "getting things sorted took minimal effort and zero stress",
          "the process feels well organized from start to finish",
        ],
      },
      {
        label: "Clean space & fair value",
        clauses: [
          "the space is neat, well maintained, and pricing stays upfront and fair",
          "work quality and clarity make the service feel completely worth it",
          "consistent standards show they care about repeat local trust",
        ],
      },
    ],
    visitMoments: [
      "visiting here earlier",
      "dealing with this team recently",
      "stopping by for the first time",
      "working with them over a couple of visits",
    ],
    positiveClosers: [
      "Refreshing to see straightforward service done properly.",
      "Gladly recommend them to others looking around the area.",
      "Smooth experience from start to finish — would visit again.",
    ],
    fourStarClosers: [
      "Good overall experience and courteous service.",
      "Solid work and clear communication — would use them again.",
    ],
    threeStarLines: [
      "Polite team and fair basics, though turnaround felt slower than hoped.",
      "Okay experience overall with some room for cleaner follow-through.",
    ],
    lowStarLines: [
      "Communication and follow-through missed expectations during this visit.",
      "Hoping they improve timeliness and clarity for future customers.",
    ],
  },
};

export function getHighlightOptions(context: {
  businessName: string;
  category?: string;
  description?: string;
}): string[] {
  const domain = resolveDomain(context.businessName, context.category, context.description);
  const spec = DOMAINS[domain];
  const baseLabels = spec.highlights.map((h) => h.label);
  const customSpecs = parseSpecialties(context.description)
    .filter((s) => s.length <= 26)
    .slice(0, 2)
    .map((s) => capFirst(s));

  const merged = [...customSpecs, ...baseLabels];
  const seen = new Set<string>();
  return merged.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
}

export function extractOpeningKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(" ");
}

function bigrams(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const set = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) {
    set.add(`${words[i]} ${words[i + 1]}`);
  }
  return set;
}

function maxBigramOverlap(candidate: string, previous: string[]): number {
  if (previous.length === 0) return 0;
  const candSet = bigrams(candidate);
  if (candSet.size === 0) return 0;
  let worst = 0;
  for (const prev of previous) {
    const prevSet = bigrams(prev);
    let intersection = 0;
    for (const bg of candSet) {
      if (prevSet.has(bg)) intersection++;
    }
    const union = candSet.size + prevSet.size - intersection;
    const score = union > 0 ? intersection / union : 0;
    if (score > worst) worst = score;
  }
  return worst;
}

function buildSpecialtySentence(specialty: string): string {
  const lower = specialty.toLowerCase();
  const cap = capFirst(specialty);
  const patterns = [
    `${cap} definitely stood out and added to the experience.`,
    `Really appreciated having ${lower} available during my visit.`,
    `Their ${lower} made a noticeable difference right away.`,
    `Having ${lower} so well handled makes coming back an easy choice.`,
  ];
  return pick(patterns);
}

function pickFreshLine(items: string[], avoidLowerDrafts: string[]): string {
  if (avoidLowerDrafts.length === 0) return pick(items);
  const fresh = items.filter(
    (item) => !avoidLowerDrafts.some((d) => d.includes(item.toLowerCase()))
  );
  return pick(fresh.length > 0 ? fresh : items);
}

function selectHighlightClauses(
  spec: DomainSpec,
  selectedHighlights: string[],
  customSpecs: string[],
  count: number,
  avoidLowerDrafts: string[]
): { clauses: string[]; labelsUsed: string[] } {
  const pickedClauses: string[] = [];
  const usedLabels: string[] = [];
  const customLowerMap = new Map(customSpecs.map((c) => [c.toLowerCase(), c]));
  const specByLabel = new Map(spec.highlights.map((h) => [h.label.toLowerCase(), h]));

  const requested = selectedHighlights.filter(Boolean);
  for (const req of requested) {
    if (pickedClauses.length >= count) break;
    const key = req.toLowerCase();
    const matchedDomain = specByLabel.get(key);
    if (matchedDomain) {
      pickedClauses.push(pickFreshLine(matchedDomain.clauses, avoidLowerDrafts));
      usedLabels.push(matchedDomain.label);
    } else if (customLowerMap.has(key) || req.length <= 32) {
      pickedClauses.push(`having ${key} handled so well made a real difference`);
      usedLabels.push(req);
    }
  }

  // Fill remaining slots with fresh domain highlights without repeating the same bucket
  const unusedBuckets = spec.highlights.filter(
    (h) => !usedLabels.some((u) => u.toLowerCase() === h.label.toLowerCase())
  );
  while (pickedClauses.length < count && unusedBuckets.length > 0) {
    const idx = randomInt(unusedBuckets.length);
    const chosen = unusedBuckets.splice(idx, 1)[0];
    pickedClauses.push(pickFreshLine(chosen.clauses, avoidLowerDrafts));
    usedLabels.push(chosen.label);
  }

  return { clauses: pickedClauses, labelsUsed: usedLabels };
}

function composePositiveCandidate(params: {
  bizName: string;
  domain: DomainKey;
  spec: DomainSpec;
  seoNoun: string;
  locPhrase: string;
  rating: number;
  length: ReviewLength;
  selectedHighlights: string[];
  customSpecs: string[];
  avoidLowerDrafts: string[];
  archetypeIdx: number;
}): { text: string; archetype: string; highlightsUsed: string[] } {
  const {
    bizName,
    spec,
    seoNoun,
    locPhrase,
    rating,
    length,
    selectedHighlights,
    customSpecs,
    avoidLowerDrafts,
    archetypeIdx,
  } = params;

  const isFourStar = rating === 4;
  const targetClauses =
    length === "short"
      ? 1
      : length === "detailed"
      ? Math.max(3, Math.min(3, selectedHighlights.length))
      : Math.max(2, Math.min(3, selectedHighlights.length));
  const { clauses, labelsUsed } = selectHighlightClauses(
    spec,
    selectedHighlights,
    customSpecs,
    targetClauses,
    avoidLowerDrafts
  );

  const clauseA = clauses[0] || "the experience felt smooth and welcoming";
  const clauseB = clauses[1] || "the team stays attentive without being pushy";
  const clauseC = clauses[2] || "the overall upkeep and vibe make you want to return";
  const hasThirdClause = clauses.length >= 3;
  const showExtra = length === "detailed" || hasThirdClause;

  const visitMoment = pick(spec.visitMoments);
  const specialty =
    customSpecs.length > 0 &&
    !labelsUsed.some((l) => l.toLowerCase() === customSpecs[0].toLowerCase())
      ? pick(customSpecs)
      : customSpecs.length > 1
      ? customSpecs[1]
      : "";
  const specialtyLine = specialty ? buildSpecialtySentence(specialty) : "";
  const closer = isFourStar
    ? pickFreshLine(spec.fourStarClosers, avoidLowerDrafts)
    : pickFreshLine(spec.positiveClosers, avoidLowerDrafts);
  const bizWithLoc = locPhrase ? `${bizName} ${locPhrase}` : bizName;
  const nounWithLoc = locPhrase ? `a ${seoNoun} ${locPhrase}` : `a dependable ${seoNoun}`;
  const midExtra = specialtyLine && randomInt(2) === 0 ? ` ${specialtyLine}` : "";

  let text = "";
  let archetype = `pos_${archetypeIdx}`;

  if (length === "short") {
    const shortTemplates = [
      () =>
        `${bizName}${locPhrase ? ` ${locPhrase}` : ""} is great — ${clauseA}. ${closer}`,
      () =>
        `${isFourStar ? "Solid experience" : "Really glad I visited"} ${bizWithLoc}; ${clauseA}.`,
      () =>
        `Quick note after ${visitMoment} at ${bizName}: ${clauseA}.${locPhrase ? ` Easy ${seoNoun} pick ${locPhrase}.` : ""}`,
      () =>
        `If you need ${nounWithLoc}, ${bizName} delivers — ${clauseA}.`,
      () =>
        `${capFirst(clauseA)} at ${bizName}. ${isFourStar ? "Good overall visit." : "Definitely coming back."}`,
      () =>
        `${isFourStar ? "Really decent" : "Great"} ${seoNoun} experience at ${bizWithLoc} — ${clauseA}.`,
    ];
    const idx = archetypeIdx % shortTemplates.length;
    archetype = `short_${idx}`;
    text = shortTemplates[idx]();
    return { text, archetype, highlightsUsed: labelsUsed };
  }

  const midAndDetailedTemplates: (() => string)[] = [
    // 0: Drop-in natural story
    () => {
      const s1 = `Visited ${bizWithLoc} recently and ${isFourStar ? "had a really solid experience" : "walked away genuinely impressed"}.`;
      const s2 = `${capFirst(clauseA)}, and ${clauseB}.`;
      const extra = showExtra ? ` ${specialtyLine || `${capFirst(clauseC)}.`} ${closer}` : `${midExtra} ${closer}`;
      return `${s1} ${s2}${extra}`;
    },
    // 1: Value/strength-first lead
    () => {
      const s1 = `${capFirst(clauseA)} — that's what stood out most at ${bizName}${locPhrase ? ` (${locPhrase})` : ""}.`;
      const s2 = `Plus, ${clauseB}.`;
      const extra =
        showExtra
          ? ` ${specialtyLine || `After ${visitMoment}, ${clauseC}.`} Easy recommendation if you're looking for ${nounWithLoc}.`
          : `${midExtra} ${isFourStar ? closer : `Great ${seoNoun} pick${locPhrase ? ` ${locPhrase}` : ""}.`}`;
      return `${s1} ${s2}${extra}`;
    },
    // 2: Local search / neighbor recommendation voice
    () => {
      const s1 = `Finding ${nounWithLoc} that stays consistent isn't always easy, so ${bizName} was a welcome change.`;
      const s2 = `From what I noticed, ${clauseA} and ${clauseB}.`;
      const extra = showExtra ? ` ${specialtyLine || `${capFirst(clauseC)}.`} ${closer}` : `${midExtra} ${closer}`;
      return `${s1} ${s2}${extra}`;
    },
    // 3: Regular / repeat visitor voice
    () => {
      const s1 = `After ${visitMoment} at ${bizWithLoc}, ${isFourStar ? "things have been consistently good" : "it's easy to see why regulars speak well of this place"}.`;
      const s2 = `${capFirst(clauseA)}, while ${clauseB}.`;
      const extra = showExtra ? ` ${specialtyLine || `${capFirst(clauseC)}.`} ${closer}` : `${midExtra} ${closer}`;
      return `${s1} ${s2}${extra}`;
    },
    // 4: Straightforward & practical voice
    () => {
      const s1 = `Honest ${isFourStar ? "4-star" : ""} experience at ${bizName}${locPhrase ? ` ${locPhrase}` : ""}.`.replace("  ", " ");
      const s2 = `${capFirst(clauseA)} and ${clauseB}.`;
      const extra =
        showExtra
          ? ` ${specialtyLine || `${capFirst(clauseC)}.`} Happy to suggest this ${seoNoun} to folks nearby.`
          : `${midExtra} ${closer}`;
      return `${s1} ${s2}${extra}`;
    },
    // 5: People & comfort voice
    () => {
      const s1 = `You feel comfortable right away at ${bizWithLoc} without any awkward rush.`;
      const s2 = `${capFirst(clauseA)}, and ${clauseB}.`;
      const extra = showExtra ? ` ${specialtyLine || `${capFirst(clauseC)}.`} ${closer}` : `${midExtra} ${closer}`;
      return `${s1} ${s2}${extra}`;
    },
    // 6: First-timer surprised voice
    () => {
      const s1 = `Tried ${bizName} for the first time${locPhrase ? ` ${locPhrase}` : ""} and had a much smoother visit than expected.`;
      const s2 = `${capFirst(clauseA)}, plus ${clauseB}.`;
      const extra =
        showExtra
          ? ` ${specialtyLine || `${capFirst(clauseC)}.`} Solid ${seoNoun} overall — ${closer.charAt(0).toLowerCase() + closer.slice(1)}`
          : `${midExtra} ${closer}`;
      return `${s1} ${s2}${extra}`;
    },
    // 7: Crisp modern summary
    () => {
      const s1 = `${bizName} keeps things simple and gets the fundamentals right${locPhrase ? ` ${locPhrase}` : ""}.`;
      const s2 = `Two things I appreciated immediately: ${clauseA}, and ${clauseB}.`;
      const extra = showExtra ? ` ${specialtyLine || `${capFirst(clauseC)}.`} ${closer}` : `${midExtra} ${closer}`;
      return `${s1} ${s2}${extra}`;
    },
  ];

  const idx = archetypeIdx % midAndDetailedTemplates.length;
  archetype = `pos_${idx}`;
  text = midAndDetailedTemplates[idx]().replace(/\s+/g, " ").trim();
  return { text, archetype, highlightsUsed: labelsUsed };
}

function composeNeutralOrConstructiveCandidate(params: {
  bizName: string;
  spec: DomainSpec;
  seoNoun: string;
  locPhrase: string;
  rating: number;
  length: ReviewLength;
  archetypeIdx: number;
}): { text: string; archetype: string } {
  const { bizName, spec, seoNoun, locPhrase, rating, length, archetypeIdx } = params;
  const bizWithLoc = locPhrase ? `${bizName} ${locPhrase}` : bizName;

  if (rating === 3) {
    const core = pick(spec.threeStarLines);
    const shortOpts = [
      `Average experience at ${bizWithLoc} — ${core.charAt(0).toLowerCase() + core.slice(1)}`,
      `Visited ${bizName}${locPhrase ? ` ${locPhrase}` : ""}: ${core}`,
      `Mixed visit at ${bizName}. ${core}`,
    ];
    if (length === "short") {
      return { text: shortOpts[archetypeIdx % shortOpts.length], archetype: `neu_s_${archetypeIdx % shortOpts.length}` };
    }
    const templates = [
      () => `Stopped by ${bizWithLoc} recently. ${core}`,
      () => `Mixed experience at ${bizName} — ${core.charAt(0).toLowerCase() + core.slice(1)} Hoping to see small improvements next time.`,
      () => `${bizName} works fine as a nearby ${seoNoun}${locPhrase ? ` ${locPhrase}` : ""}, though there's clear room to tighten consistency. ${core}`,
      () => `Sharing balanced feedback after my visit to ${bizWithLoc}: ${core.charAt(0).toLowerCase() + core.slice(1)}`,
    ];
    const idx = archetypeIdx % templates.length;
    return { text: templates[idx](), archetype: `neu_${idx}` };
  }

  const lowLine = pick(spec.lowStarLines);
  const lowTemplates = [
    () => `Visited ${bizWithLoc} recently, and unfortunately the experience felt below expectations. ${lowLine}`,
    () => `Sharing honest feedback for ${bizName}: ${lowLine.charAt(0).toLowerCase() + lowLine.slice(1)}`,
    () => `Had a disappointing visit at ${bizName}${locPhrase ? ` ${locPhrase}` : ""}. ${lowLine}`,
    () => `${bizName} has potential as a local ${seoNoun}, but based on this visit there are basics that need attention. ${lowLine}`,
  ];
  const idx = archetypeIdx % lowTemplates.length;
  return { text: lowTemplates[idx](), archetype: `low_${idx}` };
}

export function generateUniqueBusinessReview(
  context: ReviewGenerationContext
): GeneratedReviewResult {
  const bizName = context.businessName.trim() || "this business";
  const domain = resolveDomain(bizName, context.category, context.description);
  const spec = DOMAINS[domain];
  const locality = formatLocality(context.address);
  const locPhrases = buildLocationPhrases(locality);
  const customSpecs = parseSpecialties(context.description);

  const isUnisex = /\bunisex\b/i.test(bizName) && spec.unisexNouns;
  const seoPool = isUnisex && spec.unisexNouns ? spec.unisexNouns : spec.seoNouns;
  const rating = context.rating ?? 5;
  const length: ReviewLength = context.length ?? "medium";
  const selectedHighlights = context.highlights ?? [];

  const avoidLowerDrafts = (context.avoidDrafts ?? []).map((d) =>
    d.trim().toLowerCase()
  );
  const avoidDraftSet = new Set(avoidLowerDrafts);
  const avoidOpeningSet = new Set(
    (context.avoidOpenings ?? []).map((o) => o.trim().toLowerCase())
  );

  let bestCandidate: GeneratedReviewResult | null = null;
  let bestScore = Infinity;

  const startOffset = randomInt(8);
  for (let attempt = 0; attempt < 24; attempt++) {
    const archetypeIdx = startOffset + attempt;
    // Rotate whether location is woven in (roughly 75% of drafts when address exists so not 100% identical pattern)
    const includeLocation = locPhrases.length > 0 && (attempt % 4 !== 3);
    const locPhrase = includeLocation ? pick(locPhrases) : "";
    const seoNoun = pick(seoPool);

    let candidateText = "";
    let archetype = "";
    let highlightsUsed: string[] = [];

    if (rating >= 4) {
      const built = composePositiveCandidate({
        bizName,
        domain,
        spec,
        seoNoun,
        locPhrase,
        rating,
        length,
        selectedHighlights,
        customSpecs,
        avoidLowerDrafts,
        archetypeIdx,
      });
      candidateText = built.text;
      archetype = built.archetype;
      highlightsUsed = built.highlightsUsed;
    } else {
      const built = composeNeutralOrConstructiveCandidate({
        bizName,
        spec,
        seoNoun,
        locPhrase,
        rating,
        length,
        archetypeIdx,
      });
      candidateText = built.text;
      archetype = built.archetype;
    }

    const openingKey = extractOpeningKey(candidateText);
    const exactDup = avoidDraftSet.has(candidateText.trim().toLowerCase());
    const openingDup = avoidOpeningSet.has(openingKey);
    const overlap = maxBigramOverlap(candidateText, context.avoidDrafts ?? []);

    const penalty =
      (exactDup ? 100 : 0) + (openingDup ? 10 : 0) + overlap;

    if (penalty < bestScore) {
      bestScore = penalty;
      bestCandidate = {
        text: candidateText,
        highlightsUsed,
        openingKey,
        archetype,
      };
    }

    if (!exactDup && !openingDup && overlap < 0.32) {
      break;
    }
  }

  return (
    bestCandidate ?? {
      text: `Visited ${bizName}${locality ? ` near ${locality}` : ""} recently and had a solid experience.`,
      highlightsUsed: [],
      openingKey: extractOpeningKey(bizName),
      archetype: "fallback",
    }
  );
}
