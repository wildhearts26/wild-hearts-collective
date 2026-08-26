export const siteConfig = {
  name: "Wild Hearts Collective",
  tagline: "Inclusive aerial & pole studio · Community hub",
  bookingNote:
    "All classes need to be booked in advance. The full class fee is paid online when you book.",
  levelNote:
    "We have classes for all abilities. If you are unsure which level is right for you, please contact us and we can advise you.",
  arrivalNote:
    "Please arrive 5–10 minutes before the start of your class.",
  /** Shown on the booking page until a session states otherwise. */
  durationNote: "All classes are 1 hour unless stated otherwise.",
};

export const contact = {
  name: "Wild Hearts Collective",
  phone: "0115 871 8090",
  email: "hello@wildheartscollective.org",
  website: "www.wildheartscollective.org",
  addressLines: [
    "Unit 25,",
    "Block 7 Hallam Way",
    "Old Mill Lane Industrial Estate",
    "Mansfield",
    "NG19 9BG",
  ],
  address:
    "Unit 25, Block 7 Hallam Way, Old Mill Lane Industrial Estate, Mansfield, NG19 9BG",
  mapsQuery:
    "Unit 25, Block 7 Hallam Way, Old Mill Lane Industrial Estate, Mansfield NG19 9BG",
  /**
   * Studio pin — Unit 25, Block 7 Hallam Way (west side of Farmway, Hallam Way row).
   * NG19 9BG centroid ≈ 53.15634, -1.18827; prior pin (53.15668, -1.1879) sat on the
   * Farmway junction. Client markers + ///books.shops.flats confirm this building.
   * Do not use the bare business name in Apple/Google queries — Apple’s POI listing
   * is still wrong (Block 6) and steals the pin.
   */
  latitude: 53.15648,
  longitude: -1.18832,
  /**
   * Official Google Business Profile listing (Place ID).
   * Share link from the client: https://share.google/pKCNS8RJoPN6Z3aiR
   */
  googlePlaceId: "ChIJnUo26Vq9eUgRPdyFssMZa_c",
  googleCid: "17828371878180674621",
  googleBusinessUrl: "https://share.google/pKCNS8RJoPN6Z3aiR",
  /** Google Maps — opens the claimed business profile, not a nameless coordinate pin. */
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Wild+Hearts+Collective&query_place_id=ChIJnUo26Vq9eUgRPdyFssMZa_c",
  /** Google Maps embed — coordinate pin so geocoding cannot drift. */
  mapsEmbedUrl:
    "https://www.google.com/maps?q=53.15648,-1.18832+(Wild%20Hearts%20Collective%2C%20Unit%2025%20Block%207%20Hallam%20Way)&z=18&output=embed",
  /**
   * Apple Maps — pin by coordinates with an explicit Block 7 label.
   * Searching the full estate address (or the business name alone) makes Apple
   * rewrite the place to its outdated “Block 6, Old Mill Lane Industrial Estate”
   * record, so Details still shows Block 6 even when the title says Block 7.
   */
  appleMapsUrl:
    "https://maps.apple.com/place?coordinate=53.15648%2C-1.18832&name=Wild%20Hearts%20Collective%20%E2%80%94%20Unit%2025%2C%20Block%207%20Hallam%20Way",
  wazeUrl:
    "https://waze.com/ul?ll=53.15648%2C-1.18832&navigate=yes&q=Wild%20Hearts%20Collective%20Unit%2025%20Block%207",
  /** Client-confirmed studio what3words (estate approach): ///books.shops.flats */
  what3wordsUrl: "https://what3words.com/books.shops.flats",
};

/** Company trading / registered-office notice for footers and legal pages. */
export const companyDisclaimer =
  "Wild Hearts Collective is a trading name of Wild Hearts Collective Limited, registered in England and Wales with company number 17309934. Registered office: The Old Coach House, 25 Noel Street, Nottingham NG7 6AQ.";

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/classes", label: "Classes" },
  { href: "/community", label: "Community" },
  { href: "/parties", label: "Parties" },
  { href: "/hire", label: "Hire" },
  { href: "/shop", label: "Shop" },
  { href: "/reviews", label: "Reviews" },
  { href: "/contact", label: "Contact" },
  { href: "/book", label: "Book" },
];

/** Top-level links shown after the About and Classes dropdowns. */
export const mainNavLinks = [
  { href: "/", label: "Home" },
  { href: "/community", label: "Community" },
  { href: "/parties", label: "Parties" },
  { href: "/hire", label: "Hire" },
  { href: "/shop", label: "Shop" },
  { href: "/reviews", label: "Reviews" },
  { href: "/contact", label: "Contact" },
];

export const aboutMenuLinks = [
  { href: "/about", label: "About Us" },
  { href: "/about/team", label: "Our Team" },
] as const;

export type ClassMenuIcon =
  | "pole"
  | "hoop"
  | "silks"
  | "grid"
  | "arts"
  | "family"
  | "teens"
  | "children"
  | "workshop"
  | "course";

export const classMenuLinks: {
  href: string;
  label: string;
  icon: ClassMenuIcon;
  section:
    | "Studio classes"
    | "Wild Hearts Juniors"
    | "Workshops"
    | "Courses"
    | "Browse";
}[] = [
  { href: "/classes/pole", label: "Pole Dancing", icon: "pole", section: "Studio classes" },
  { href: "/classes/aerial-hoop", label: "Aerial Hoop", icon: "hoop", section: "Studio classes" },
  { href: "/classes/aerial-silks", label: "Aerial Silks", icon: "silks", section: "Studio classes" },
  { href: "/classes/family", label: "Family Classes", icon: "family", section: "Wild Hearts Juniors" },
  { href: "/classes/teens", label: "Teen Classes", icon: "teens", section: "Wild Hearts Juniors" },
  { href: "/classes/children", label: "Children's Classes", icon: "children", section: "Wild Hearts Juniors" },
  { href: "/classes/aerial-workshops", label: "Aerial Workshops", icon: "workshop", section: "Workshops" },
  { href: "/classes/pole-workshops", label: "Pole Workshops", icon: "workshop", section: "Workshops" },
  {
    href: "/classes/creative-arts-workshops",
    label: "Creative Arts Workshops",
    icon: "arts",
    section: "Workshops",
  },
  {
    href: "/classes/beginner-courses",
    label: "4-Week Beginner Courses",
    icon: "course",
    section: "Courses",
  },
  { href: "/classes", label: "All Classes", icon: "grid", section: "Browse" },
];

export const footerLinks = [
  ...navLinks,
  { href: "/faqs", label: "FAQs" },
  { href: "/terms", label: "Terms & Conditions" },
];

export const footerDescription =
  "Inclusive aerial and pole classes in Mansfield — community, confidence, and creativity for every body.";

export const footerServiceLinks = [
  { href: "/classes/pole", label: "Pole Dancing" },
  { href: "/classes/aerial-hoop", label: "Aerial Hoop" },
  { href: "/classes/aerial-silks", label: "Aerial Silks" },
  { href: "/classes/family", label: "Family Classes" },
  { href: "/classes/teens", label: "Teen Classes" },
  { href: "/classes/children", label: "Children's Classes" },
  { href: "/classes/aerial-workshops", label: "Aerial Workshops" },
  { href: "/classes/pole-workshops", label: "Pole Workshops" },
  { href: "/classes/creative-arts-workshops", label: "Creative Arts Workshops" },
  { href: "/classes/beginner-courses", label: "4-Week Beginner Courses" },
  { href: "/parties", label: "Parties & Events" },
  { href: "/hire", label: "Studio Hire" },
];

export const memberAccessLinks = [
  { href: "/membership", label: "Membership" },
  { href: "/register", label: "Sign up" },
  { href: "/login", label: "Login" },
] as const;

export const footerQuickLinks = [
  { href: "/about", label: "About Us" },
  { href: "/about/team", label: "Our Team" },
  { href: "/classes", label: "Our Classes" },
  { href: "/#timetable", label: "Timetable" },
  { href: "/book", label: "Book a Class" },
  { href: "/membership", label: "Membership" },
  { href: "/shop", label: "Shop" },
  { href: "/reviews", label: "Reviews" },
  { href: "/community", label: "Community Hub" },
  { href: "/faqs", label: "FAQs" },
  { href: "/search", label: "Search" },
  { href: "/contact", label: "Contact" },
];

export const footerLegalLinks = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/privacy", label: "Data Privacy" },
];

export const homeStats = [
  {
    value: "3",
    label: "Co-founders",
  },
  {
    value: "4",
    label: "Disciplines — pole, hoop, silks & workshops",
  },
  {
    value: "5",
    label: "Qualified instructors",
  },
  {
    value: "36+",
    label: "Years combined teaching experience",
  },
  {
    value: "100%",
    label: "Inclusive, body-positive teaching",
  },
  {
    value: "All",
    label: "Levels, ages & abilities welcome",
  },
];

export const whyChooseUs = {
  title: "Why Choose Us",
  intro:
    "Wild Hearts Collective is more than a studio — it is a place to feel seen, supported, and inspired. Here is what makes us different.",
  reasons: [
    {
      title: "Inclusive for every body",
      description:
        "All shapes, sizes, ages, and abilities are welcome. We celebrate what your body can do — never what it looks like.",
    },
    {
      title: "Qualified and experienced instructors",
      description:
        "All instructors are certified aerial instructors with DBS checks and first aid training — passionate about safe, supportive teaching.",
    },
    {
      title: "Progress at your pace",
      description:
        "No pressure, no comparison. Beginner-friendly classes with clear progressions so you build strength and confidence step by step.",
    },
    {
      title: "A true community hub",
      description:
        "Beyond pole and aerial, we host creative workshops, parties, and events — a space to move, create, and find your people.",
    },
    {
      title: "Safety comes first",
      description:
        "Proper warm-ups, spotting, and equipment care are built into every session so you can explore movement with confidence.",
    },
    {
      title: "Something for everyone",
      description:
        "From your first spin to advanced combinations, private lessons to open training — we help you find the right class for you.",
    },
  ],
};

/**
 * Social and review destinations.
 */
export const socialLinks = [
  {
    href: "https://www.instagram.com/wildheartscollective_mansfield?utm_source=q",
    label: "Instagram",
    cta: "Follow us on Instagram",
  },
  {
    href: "https://www.facebook.com/share/1GyS3vvdXn/?mibextid=wwXIfr",
    label: "Facebook",
    cta: "Find us on Facebook",
  },
] as const;

/** Google Business “Write a review” — Place ID from the client listing. */
export const googleReviewLink = {
  href: "https://search.google.com/local/writereview?placeid=ChIJnUo26Vq9eUgRPdyFssMZa_c",
  profileHref: "https://share.google/pKCNS8RJoPN6Z3aiR",
  label: "Leave a Google review",
  cta: "Share your experience on Google",
  description:
    "Help others discover Wild Hearts Collective by leaving an honest Google review of your class or visit.",
} as const;

export const founders = [
  {
    name: "Rosie",
    role: "Co-founder & Instructor",
    bio: "Qualified and experienced aerial instructor passionate about creating an inclusive space where every body feels welcome to move.",
    imageSrc: "/team/rosie.jpeg",
  },
  {
    name: "Jacqui",
    role: "Co-founder & Instructor",
    bio: "Dedicated to safe, supportive teaching that helps students build confidence at their own pace.",
    imageSrc: "/team/jacqui.jpeg",
  },
  {
    name: "Sarah",
    role: "Co-founder & Instructor",
    bio: "Committed to community, creativity, and high-quality instruction across pole and aerial arts.",
    imageSrc: "/team/sarah.jpeg",
  },
];

export const values = [
  "Inclusivity",
  "Safety",
  "Community",
  "Creativity",
];

export const classes = [
  {
    slug: "pole",
    title: "Pole Dancing",
    shortDescription:
      "Build strength, flow, and confidence in a supportive studio environment for all levels.",
    intro:
      "Pole is a full-body workout disguised as pure fun. Whether you are stepping up to the pole for the first time or refining advanced combinations, our classes celebrate progress over perfection.",
    description:
      "Our pole programme blends technique, strength, and artistry in a clean, inclusive studio. Our fully qualified and experienced instructors guide you through safe progressions — from foundational grips and spins to dynamic flow and choreography — always at a pace that respects your body and your goals with our levelled classes.",
    levels: "Beginner to advanced",
    href: "/classes/pole",
    gradient: "from-pink-light via-pink-soft to-background",
    imageKey: "pole" as const,
    photoOverlay: "with our fully qualified and experienced instructors",
    whatToExpect: [
      "A thorough warm-up and mobility focus before any pole work",
      "Clear, step-by-step teaching with spotting when needed",
      "Strength-building drills alongside spins, climbs, and combos",
      "A supportive, body-positive environment with no pressure to perform",
    ],
    highlights: [
      {
        title: "Build real strength",
        description:
          "Develop grip strength, core control, and upper-body power while having fun — many students are amazed by what they achieve in their first few weeks.",
      },
      {
        title: "Find your flow",
        description:
          "Learn to link moves with musicality and expression, whether you prefer athletic pole or softer, dance-inspired movement.",
      },
      {
        title: "Progress with confidence",
        description:
          "Mixed-level and ability-specific sessions mean you are always challenged appropriately, with instructors who know when to push and when to support.",
      },
      {
        title: "A welcoming studio",
        description:
          "No experience needed. No judgment. Just qualified and experienced teaching, clean equipment, and a community that cheers you on.",
      },
    ],
    whatToWear:
      "Comfortable clothing that allows free movement. For pole, wear shorts or fitted leggings and a vest or sports top — skin contact helps with grip. Bring water, avoid lotion on class day, and layers for warm-up and cool-down.",
    whoFor:
      "Open to adults of all shapes, sizes, and abilities. Complete beginners are warmly welcome. If you have injuries or health concerns, let your instructor know so we can adapt exercises safely.",
  },
  {
    slug: "aerial-hoop",
    title: "Aerial Hoop",
    shortDescription:
      "Learn beautiful poses, spins, and transitions on the hoop with our fully qualified and experienced instructors.",
    intro:
      "Aerial hoop — also called lyra — combines strength, grace, and playfulness as you move through mounts, shapes, and spins suspended in the air.",
    description:
      "Discover aerial hoop in our welcoming studio, where our fully qualified and experienced instructors break down each skill into manageable steps. From your first seat on the hoop to flowing sequences and dynamic movement, every class prioritises safe technique, spotting, and building confidence at height.",
    levels: "All levels",
    href: "/classes/aerial-hoop",
    gradient: "from-pink-soft via-pink-light to-background",
    imageKey: "aerial-hoop" as const,
    photoOverlay: "with our fully qualified and experienced instructors",
    whatToExpect: [
      "Warm-up focused on shoulders, core, and grip strength",
      "Foundation mounts and balanced shapes before dynamic work",
      "Spotting and crash-mat safety built into every session",
      "Creative transitions tailored to your current level",
    ],
    highlights: [
      {
        title: "Sculpt and strengthen",
        description:
          "Hoop training builds functional strength through pulls, holds, and controlled movement — you'll feel the difference on and off the apparatus.",
      },
      {
        title: "Create stunning shapes",
        description:
          "Learn elegant poses and lines that look impressive from day one, with progressions that help you feel secure and supported.",
      },
      {
        title: "Patient, expert teaching",
        description:
          "Our instructors specialise in making aerial accessible, explaining terminology clearly and celebrating every small win.",
      },
      {
        title: "Perfect for beginners",
        description:
          "Intro sessions are designed for first-timers — no prior aerial or gymnastics experience required.",
      },
    ],
    whatToWear:
      "Comfortable clothing that allows free movement. For aerial, wear fitted leggings and a close-fitting top that covers the backs of knees and torso. Remove jewellery and avoid zips that could catch on the hoop.",
    whoFor:
      "Suitable for teens and adults of all abilities. Beginners and improvers alike will find a class level that fits. Contact us if you are unsure which session to book.",
  },
  {
    slug: "aerial-silks",
    title: "Aerial Silks",
    shortDescription:
      "Climb, wrap, and create stunning lines with step-by-step instruction from our fully qualified and experienced teachers.",
    intro:
      "Aerial silks invite you to climb, wrap, and descend through the air — a breathtaking discipline that builds strength, flexibility, and creative expression.",
    description:
      "Our silks classes focus on safe wraps, controlled descents, and progressive strength work. Our fully qualified and experienced instructors guide you from foundational foot locks and climbs to beautiful sequences, always emphasising technique, spotting, and listening to your body.",
    levels: "All levels",
    href: "/classes/aerial-silks",
    gradient: "from-background via-pink-light to-pink-soft",
    imageKey: "aerial-silks" as const,
    photoOverlay: "with our fully qualified and experienced instructors",
    whatToExpect: [
      "Conditioning exercises to prepare wrists, shoulders, and core",
      "Step-by-step wrap breakdowns before attempting full sequences",
      "Low-height progressions for beginners building confidence",
      "Creative freedom as you advance, with safety always first",
    ],
    highlights: [
      {
        title: "Full-body conditioning",
        description:
          "Silks training develops grip endurance, core stability, and flexibility — a rewarding challenge for mind and body.",
      },
      {
        title: "Express yourself in the air",
        description:
          "Combine wraps, drops, and poses into flowing sequences that feel uniquely yours, guided by experienced teachers.",
      },
      {
        title: "Structured progressions",
        description:
          "We never rush skills. Each level builds on the last so you develop solid foundations before moving to advanced work.",
      },
      {
        title: "Inclusive teaching",
        description:
          "Adaptations and alternatives are always available — our priority is that you feel capable, safe, and inspired.",
      },
    ],
    whatToWear:
      "Comfortable clothing that allows free movement. For aerial, wear fitted leggings that cover the legs fully and a fitted top — avoid loose fabric that can get caught in wraps. No jewellery or lotions. Bring water and a layer for warm-up.",
    whoFor:
      "All levels welcome, from complete beginners to experienced aerialists. Silks require patience and persistence — perfect for anyone who enjoys a challenge in a supportive setting.",
  },
  {
    slug: "family",
    title: "Family Classes",
    shortDescription: "Fun For All The Family",
    intro:
      "Family classes at Wild Hearts Collective bring parents, carers, and children together for shared movement, creativity, and quality time.",
    description:
      "Our family classes create fun, inclusive experiences that encourage confidence, fitness, creativity and quality time together in a safe and supportive environment. Led by our fully qualified, experienced, and DBS-checked instructors, sessions are designed so everyone can join in at their own pace — celebrating every small win together.",
    levels: "Families welcome",
    href: "/classes/family",
    gradient: "from-pink-soft via-background to-pink-light",
    imageKey: "classes" as const,
    photoOverlay:
      "with our fully qualified, experienced and DBS-checked instructors",
    whatToExpect: [
      "Age-appropriate activities designed for mixed-age family groups",
      "A welcoming, play-led atmosphere with clear safety guidance",
      "Time to move, laugh, and encourage one another",
      "Fully supervised sessions with our DBS-checked team",
    ],
    highlights: [
      {
        title: "Quality time together",
        description:
          "Step away from everyday routines and share an experience that builds confidence and connection as a family.",
      },
      {
        title: "Inclusive for every body",
        description:
          "Activities are adapted so younger children, teens, and adults can take part comfortably side by side.",
      },
      {
        title: "Safe, professional teaching",
        description:
          "Our DBS-checked instructors keep sessions supportive, structured, and focused on fun without pressure.",
      },
      {
        title: "A studio that feels like home",
        description:
          "Join a community hub where families are welcomed, celebrated, and encouraged to grow together.",
      },
    ],
    whatToWear:
      "Comfortable clothes you can move in — fitted layers work well for aerial-inspired play. Bring water and avoid jewellery that could catch on equipment.",
    whoFor:
      "Families looking for a shared, active experience. Contact us for age guidance on specific sessions so we can help you choose the best fit.",
  },
  {
    slug: "teens",
    title: "Teen Classes",
    shortDescription:
      "Confidence-building aerial classes for teens in a safe, encouraging space.",
    intro:
      "Our Teen Aerial Classes are designed for young people who want to challenge themselves, build confidence, and discover what they’re capable of in a welcoming and supportive environment.",
    description: [
      "Whether you’re completely new to aerial or already have experience, our classes help you develop strength, flexibility, coordination, and technique while learning exciting skills on a variety of aerial equipment, including aerial hoop, silks, trapeze and sling.",
      "We believe every teenager deserves a space where they can be themselves. Our instructors encourage each student to progress at their own pace, celebrating every achievement—big or small. Classes focus not only on physical skills but also on resilience, creativity, teamwork, and self-belief.",
      "Expect plenty of laughs, new friendships, and the opportunity to express yourself through movement in a safe, inclusive community where everyone belongs.",
      "Whether the goal is to improve fitness, learn impressive aerial tricks, perform, or simply have fun trying something different, our Teen Aerial Classes are the perfect place to spread your wings and fly.",
    ],
    levels: "Teens",
    href: "/classes/teens",
    gradient: "from-background via-pink-soft to-pink-light",
    imageKey: "teens" as const,
    photoOverlay:
      "with our fully qualified, experienced and DBS-checked instructors",
    whatToExpect: [
      "Beginner-friendly progressions with clear coaching",
      "A peer-positive environment that celebrates effort",
      "Strength, coordination, and creative expression",
      "Fully supervised sessions with our DBS-checked team",
    ],
    highlights: [
      {
        title: "Grow confidence",
        description:
          "Learn new skills in a space designed for teens — supportive, respectful, and free from intimidation.",
      },
      {
        title: "Build real strength",
        description:
          "Develop fitness and body awareness through pole and aerial movement that feels rewarding from week one.",
      },
      {
        title: "Make friends",
        description:
          "Train alongside peers who cheer each other on, creating friendships on and off the apparatus.",
      },
      {
        title: "Professional, DBS-checked teaching",
        description:
          "Every session is led by qualified and experienced instructors who prioritise safety and wellbeing.",
      },
    ],
    whatToWear:
      "Comfortable clothing that allows free movement. For pole, wear shorts or fitted leggings; for aerial, wear fitted leggings. Bring water, remove jewellery, and avoid lotion on class day.",
    whoFor:
      "Suitable for ages 11–17. Beginners and experienced aerialists are welcome.",
  },
  {
    slug: "children",
    title: "Children's Classes",
    shortDescription:
      "Playful, confidence-building aerial experiences for children with our DBS-checked instructors.",
    intro:
      "Our Junior Aerial Classes are the perfect introduction to the exciting world of aerial arts for children. Through fun, engaging sessions, young aerialists will build confidence, develop strength, improve coordination, and learn new skills in a safe and encouraging environment.",
    description: [
      "Children will have the opportunity to explore a variety of aerial equipment, including aerial hoop, silks, trapeze, sling, and more. Every class is carefully planned to be age-appropriate, allowing each child to learn at their own pace while celebrating every achievement along the way.",
      "At Wild Hearts Collective, we believe movement should be fun, inspiring, and inclusive. Our classes encourage creativity, resilience, teamwork, and self-expression while helping children develop body awareness and a love of being active.",
      "Most importantly, our Junior Aerial Classes are about making friends, trying new things, and discovering just how much is possible when you believe in yourself. Whether your child dreams of soaring through the air or simply wants to have fun and build confidence, they’ll be welcomed into our supportive Wild Hearts community.",
    ],
    levels: "Children",
    href: "/classes/children",
    gradient: "from-pink-light via-pink-soft to-background",
    imageKey: "children" as const,
    photoOverlay:
      "with our fully qualified, experienced and DBS-checked instructors",
    whatToExpect: [
      "Age-appropriate games, shapes, and movement skills",
      "Clear safety routines and close supervision",
      "Encouragement-focused coaching that builds self-belief",
      "Sessions led by our DBS-checked teaching team",
    ],
    highlights: [
      {
        title: "Learn through play",
        description:
          "Children explore movement in a joyful, imaginative way that keeps them engaged and eager to return.",
      },
      {
        title: "Build confidence early",
        description:
          "Small achievements are celebrated, helping children feel capable, proud, and motivated.",
      },
      {
        title: "Safety first",
        description:
          "Equipment, spotting, and class ratios are managed carefully by our DBS-checked instructors.",
      },
      {
        title: "A welcoming community",
        description:
          "Families join a studio culture that values kindness, inclusion, and every child's progress.",
      },
    ],
    whatToWear:
      "Comfortable, fitted clothes children can move freely in. Soft shoes for arrival; classes are often barefoot. Bring water and leave jewellery at home.",
    whoFor:
      "Suitable for children aged 5–10. No previous experience is needed—just a sense of adventure and a willingness to have fun!",
  },
  {
    slug: "aerial-workshops",
    title: "Aerial Workshops",
    shortDescription:
      "Specialist aerial workshops with in-house and guest instructors to deepen your practice.",
    intro:
      "Aerial workshops offer focused time to explore new skills, refine technique, and try something beyond the weekly timetable.",
    description:
      "We host both in-house and guest instructors, offering a range of additional workshops carefully selected to complement our existing timetable. Sessions are led with our fully qualified and experienced teaching standards — ideal whether you want to deepen a favourite discipline or try a fresh challenge.",
    levels: "Workshop levels vary",
    href: "/classes/aerial-workshops",
    gradient: "from-pink-soft via-pink-light to-background",
    imageKey: "aerial-workshops" as const,
    photoOverlay: "with our fully qualified and experienced instructors",
    whatToExpect: [
      "Focused themes that go beyond a standard weekly class",
      "A mix of in-house expertise and carefully chosen guest teachers",
      "Clear level guidance on each workshop listing",
      "The same welcoming, safety-first studio environment",
    ],
    highlights: [
      {
        title: "Go deeper",
        description:
          "Spend dedicated time on skills, combinations, or apparatus themes you want to develop further.",
      },
      {
        title: "Learn from specialists",
        description:
          "Benefit from in-house and guest instructors selected to complement our regular programme.",
      },
      {
        title: "Complement your timetable",
        description:
          "Workshops sit alongside weekly classes — a flexible way to keep progressing and stay inspired.",
      },
      {
        title: "Inclusive by design",
        description:
          "Whether you are newer to aerial or more experienced, workshop notes help you choose the right fit.",
      },
    ],
    whatToWear:
      "Comfortable clothing that allows free movement. For aerial, wear fitted leggings covering the backs of knees and torso. Remove jewellery, avoid lotions, and bring water plus a warm layer.",
    whoFor:
      "Students looking to enrich their aerial journey. Check each workshop listing for level guidance, or contact us if you are unsure what to book.",
  },
  {
    slug: "pole-workshops",
    title: "Pole Workshops",
    shortDescription:
      "Specialist pole workshops with in-house and guest instructors to complement your training.",
    intro:
      "Pole workshops give you space to explore technique, flow, heels, tricks, or creative themes beyond the weekly class schedule.",
    description:
      "We host both in-house and guest instructors, offering a range of additional workshops carefully selected to complement our existing timetable. Expect the same high standard of fully qualified and experienced teaching — with focused themes that help you progress with confidence.",
    levels: "Workshop levels vary",
    href: "/classes/pole-workshops",
    gradient: "from-pink-light via-background to-pink-soft",
    imageKey: "pole-workshops" as const,
    photoOverlay: "with our fully qualified and experienced instructors",
    whatToExpect: [
      "Theme-led sessions that expand on weekly class content",
      "In-house and guest instructors chosen with care",
      "Clear level information on each workshop booking",
      "Supportive coaching in our inclusive studio environment",
    ],
    highlights: [
      {
        title: "Specialist focus",
        description:
          "Dive into specific skills, styles, or combinations with time to practise and ask questions.",
      },
      {
        title: "Fresh inspiration",
        description:
          "Guest and in-house workshops keep your training varied, motivating, and creatively alive.",
      },
      {
        title: "Built around our timetable",
        description:
          "Workshops are curated to complement regular classes rather than replace them.",
      },
      {
        title: "Qualified, experienced teaching",
        description:
          "Every workshop upholds our studio standards for safety, progression, and inclusive coaching.",
      },
    ],
    whatToWear:
      "Comfortable clothing that allows free movement. For pole, wear shorts or fitted leggings and a vest or sports top — skin contact helps with grip. Bring water, avoid lotion on the day, and remove jewellery.",
    whoFor:
      "Pole students who want to deepen or diversify their practice. Review level notes on each workshop, or contact us for advice.",
  },
  {
    slug: "creative-arts-workshops",
    title: "Creative Arts Workshops",
    shortDescription:
      "Arts and crafts sessions for creative expression, wellbeing, and connection.",
    intro:
      "Not every visit to Wild Hearts has to be about aerial or pole. Our creative arts workshops will offer a calm, inclusive space to make, explore, and connect — open to all ages and abilities.",
    description:
      "From seasonal crafts and mindful making to collaborative community projects, our workshop programme is designed to complement our movement classes. Whether you want to unwind, try something new, or meet like-minded people, there is a session for you. Working with local crafters we aim to host and deliver a variety of craft related workshops.",
    levels: "Workshops for all ages",
    href: "/classes/creative-arts-workshops",
    gradient: "from-pink-light via-background to-pink-soft",
    imageKey: "creative-arts" as const,
    whatToExpect: [
      "Guided, beginner-friendly sessions — no artistic experience needed",
      "Materials guidance provided on each booking — bring your own apron if you have one",
      "A relaxed, social atmosphere with plenty of encouragement",
      "Rotating themes throughout the year — check our timetable for upcoming dates",
    ],
    highlights: [
      {
        title: "Creativity for wellbeing",
        description:
          "Making with your hands is a powerful way to de-stress, express yourself, and take a break from the everyday.",
      },
      {
        title: "All ages welcome",
        description:
          "Family-friendly sessions sit alongside adult-only workshops — something for everyone in the community.",
      },
      {
        title: "Community connection",
        description:
          "Meet new people, share ideas, and be part of a hub that celebrates creativity as much as movement.",
      },
      {
        title: "Local collaborations",
        description:
          "We partner with local makers and small businesses to bring fresh, inspiring workshop themes to the studio.",
      },
    ],
    whatToWear:
      "Comfortable clothes you do not mind getting a little paint, glue or glitter on. Aprons are not provided, feel free to bring your own along with a willingness to try something new. Our branded aprons are available to purchase on our website.",
    whoFor:
      "Open to all ages and abilities — perfect for families, friends, or anyone looking for a creative outlet. No movement or fitness background required. Contact us for age guidance on specific sessions.",
  },
  {
    slug: "beginner-courses",
    title: "4-Week Beginner Courses",
    shortDescription:
      "Fixed-term beginner courses booked and paid in full for the complete four-week block.",
    intro:
      "Our beginner courses give you a clear starting point — a structured four-week block so you can learn the foundations with the same group and build confidence week by week.",
    description:
      "4-week beginner courses are booked and paid for as a full block rather than single drop-in classes. They are designed for newcomers who want a supportive introduction to pole or aerial, with progressive teaching across the course. Spaces are limited, so book early — and look out for course-only gift vouchers in the shop if you are treating someone special.",
    levels: "Beginner courses",
    href: "/classes/beginner-courses",
    gradient: "from-pink-soft via-pink-light to-background",
    imageKey: "classes" as const,
    photoOverlay: "with our fully qualified and experienced instructors",
    whatToExpect: [
      "A complete four-week block booked and paid in full",
      "Progressive beginner teaching from week one to week four",
      "A consistent group so you can settle in and make friends",
      "Clear course dates listed on each booking",
    ],
    highlights: [
      {
        title: "A proper start",
        description:
          "Learn foundations in a structured sequence instead of piecing things together across random drop-ins.",
      },
      {
        title: "Book the full block",
        description:
          "Course places are reserved for the whole four weeks, so you can commit to your progress with confidence.",
      },
      {
        title: "Beginner-focused coaching",
        description:
          "Sessions are paced for newcomers, with safety, technique, and encouragement at the heart of every class.",
      },
      {
        title: "Gift-friendly",
        description:
          "Course-only gift vouchers are available in the shop — ideal for birthdays and first-class treats.",
      },
    ],
    whatToWear:
      "Comfortable clothing that allows free movement. For pole, wear shorts or fitted leggings; for aerial, wear fitted leggings. Remove jewellery, avoid lotion on class days, and bring water plus a warm layer.",
    whoFor:
      "Complete beginners (and returning beginners) who want a structured four-week introduction. Check each course listing for apparatus and dates, or contact us if you need help choosing.",
  },
];

export type TimetableClass = {
  time: string;
  title: string;
  /** Optional note under the class title */
  note?: string;
  /**
   * Booking class filter slug (matches CLASS_TYPE_OPTIONS / `/book?class=`).
   * Omit for open/general slots that should open the full booking schedule.
   */
  bookClassSlug?: string;
};

export type TimetableDay = {
  day: string;
  classes: TimetableClass[];
};

/**
 * Weekly marketing timetable defaults (homepage /#timetable).
 * Runtime source of truth is StudioSetting `marketing_timetable`
 * (Admin → Timetable). Live bookable sessions are Admin → Schedule.
 * Links open `/book` filtered by class type when `bookClassSlug` is set.
 */
export const timetable: TimetableDay[] = [
  {
    day: "Monday",
    classes: [
      { time: "5:00 – 6:00", title: "Open Training" },
      {
        time: "6:05 – 7:05",
        title: "Improver/Intermediate Pole",
        bookClassSlug: "pole",
      },
      {
        time: "7:10 – 8:10",
        title: "Flow & Heels Tech",
        bookClassSlug: "pole",
      },
      {
        time: "8:15 – 9:00",
        title: "Beginner Pole",
        bookClassSlug: "pole",
      },
    ],
  },
  {
    day: "Tuesday",
    classes: [
      { time: "5:00 – 6:00", title: "Open Training" },
      {
        time: "6:05 – 7:05",
        title: "Advanced Pole",
        bookClassSlug: "pole",
      },
      {
        time: "7:10 – 8:10",
        title: "Spin Pole Tech",
        bookClassSlug: "pole",
      },
      {
        time: "8:20 – 9:20",
        title: "Intermediate Pole",
        bookClassSlug: "pole",
      },
    ],
  },
  {
    day: "Wednesday",
    classes: [
      { time: "5:00 – 6:00", title: "Open Training" },
      {
        time: "6:00 – 7:00",
        title: "Aerial Hoop Intermediate",
        bookClassSlug: "aerial-hoop",
      },
      {
        time: "7:10 – 8:10",
        title: "Advanced",
        bookClassSlug: "aerial-hoop",
      },
      {
        time: "8:20 – 9:05",
        title: "Beginners",
        bookClassSlug: "aerial-hoop",
      },
    ],
  },
  {
    day: "Thursday",
    classes: [
      {
        time: "6:00 – 7:00",
        title: "Aerial Silks Beginner",
        bookClassSlug: "aerial-silks",
      },
      {
        time: "7:05 – 8:05",
        title: "Aerial Silks Intermediate",
        bookClassSlug: "aerial-silks",
      },
      {
        time: "8:10 – 8:55",
        title: "Intro Classes",
        bookClassSlug: "beginner-courses",
      },
    ],
  },
  {
    day: "Friday",
    classes: [
      {
        time: "5:30 – 6:30",
        title: "Open Training",
        bookClassSlug: "pole",
      },
      {
        time: "6:30 – 8:00",
        title: "Themed Flow Friday",
        bookClassSlug: "pole",
        note: "Equipment and theme change weekly — check our booking system.",
      },
    ],
  },
  {
    day: "Saturday",
    classes: [
      {
        time: "",
        title: "Privates and Workshops",
        bookClassSlug: "pole-workshops",
        note: "Please check our booking system.",
      },
    ],
  },
  {
    day: "Sunday",
    classes: [
      {
        time: "",
        title: "Mixed Ability / Privates / Workshops",
        note: "Please check our booking system.",
      },
    ],
  },
];

export const faqs = [
  {
    question: "What is Wild Hearts Collective?",
    answer:
      "Wild Hearts Collective is an inclusive aerial and pole studio in Mansfield offering pole, aerial hoop, silks, and creative arts for all ages, abilities, and backgrounds.",
  },
  {
    question: "Do I need to book in advance?",
    answer:
      "Yes. All classes must be booked in advance through this website. The full class fee is paid online when you book.",
  },
  {
    question: "What should I wear?",
    answer:
      "Comfortable clothing that allows free movement. For aerial, wear fitted leggings. For pole, wear shorts or fitted leggings. Avoid lotion on the day of class. All jewellery must be removed, belly button piercings protected. No buckles, chains or rhinestones.",
  },
  {
    question: "I'm a complete beginner — is that okay?",
    answer:
      "Absolutely. We welcome all abilities and have classes specifically designed for beginners. Contact us if you need help choosing the right class.",
  },
  {
    question: "Are your instructors qualified and experienced?",
    answer:
      "Yes. Our team are qualified and experienced aerial instructors with DBS checks and first aid training.",
  },
  {
    question: "Where is the studio?",
    answer:
      "Wild Hearts Collective is at Unit 25, Block 7 Hallam Way, Old Mill Lane Industrial Estate, Mansfield, NG19 9BG.",
  },
  {
    question: "Can children attend?",
    answer:
      "We offer classes and party packages for young people. Contact us to discuss age-appropriate options.",
  },
  {
    question: "How long are classes?",
    answer:
      "All classes are 1 hour unless a session states otherwise. Please arrive 5–10 minutes before the start of your class.",
  },
];
