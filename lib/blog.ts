/**
 * ═══════════════════════════════════════════════════════════════
 *  CREDITLINKER BLOG — CONTENT MODEL
 * ═══════════════════════════════════════════════════════════════
 *
 *  This file is the single source of truth for all blog content.
 *  Right now it is static — all posts live here as structured data.
 *
 *  When you connect a CMS (Sanity, Contentful, Payload, etc.) you
 *  replace the POSTS array and the helper functions below with API
 *  calls to that CMS. The types stay the same — nothing else in the
 *  app needs to change.
 *
 *  URL structure
 *  ─────────────
 *  /blog               → index (this content model feeds that page)
 *  /blog/[slug]        → individual article
 *
 *  Category taxonomy
 *  ─────────────────
 *  product-updates     What's new on Creditlinker
 *  financial-education What is financial identity, how to improve your score
 *  capital-access      How different capital types work in practice
 *  sme-stories         Real business profiles and outcomes
 *  industry-insight    Fintech, lending, open banking in Africa
 *
 * ═══════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────

export type BlogCategory =
  | "product-updates"
  | "financial-education"
  | "capital-access"
  | "sme-stories"
  | "industry-insight";

export interface BlogAuthor {
  name: string;
  role: string;
  /** Initials shown as avatar — replace with image URL when available */
  initials: string;
  /** Avatar background colour (Tailwind-free hex) */
  color: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;          // 1–2 sentences — used in cards and meta description
  category: BlogCategory;
  author: BlogAuthor;
  published_at: string;     // ISO date string: "2025-01-15"
  reading_time_mins: number;
  featured: boolean;        // true → shown in the hero slot on /blog
  tags: string[];
  /**
   * Article body in a simple portable format.
   * Each block is either a paragraph, heading, list, or callout.
   * Replace with your CMS's rich-text format when you connect one.
   */
  body: ContentBlock[];
  /**
   * Related post slugs — shown at the bottom of the article.
   * The system will resolve these from the POSTS array.
   */
  related_slugs: string[];
}

export type ContentBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; variant: "info" | "warning" | "tip"; text: string }
  | { type: "quote"; text: string; attribution?: string };

// ─────────────────────────────────────────────────────────────
//  CATEGORY CONFIG
// ─────────────────────────────────────────────────────────────

export const CATEGORY_CONFIG: Record<BlogCategory, {
  label: string;
  description: string;
  color: string;
  bg: string;
}> = {
  "product-updates": {
    label: "Product Updates",
    description: "New features and improvements to Creditlinker",
    color: "#6366F1",
    bg: "#EEF2FF",
  },
  "financial-education": {
    label: "Financial Education",
    description: "Understanding financial identity, scores, and what they mean for your business",
    color: "#0891B2",
    bg: "#F0FDFF",
  },
  "capital-access": {
    label: "Capital Access",
    description: "How different types of financing work and how to access them",
    color: "#10B981",
    bg: "#ECFDF5",
  },
  "sme-stories": {
    label: "SME Stories",
    description: "Real businesses, real outcomes",
    color: "#F59E0B",
    bg: "#FFFBEB",
  },
  "industry-insight": {
    label: "Industry Insight",
    description: "Fintech, open banking, and the future of SME finance in Africa",
    color: "#EF4444",
    bg: "#FEF2F2",
  },
};

// ─────────────────────────────────────────────────────────────
//  AUTHORS
// ─────────────────────────────────────────────────────────────

const AUTHORS: Record<string, BlogAuthor> = {
  tunde: {
    name: "Tunde Adeyemi",
    role: "Co-founder, Creditlinker",
    initials: "TA",
    color: "#0A2540",
  },
  kemi: {
    name: "Kemi Obi",
    role: "Head of Product",
    initials: "KO",
    color: "#0891B2",
  },
  chidi: {
    name: "Chidi Eze",
    role: "Credit & Risk Analyst",
    initials: "CE",
    color: "#10B981",
  },
  fatima: {
    name: "Fatima Bello",
    role: "Financial Education Lead",
    initials: "FB",
    color: "#6366F1",
  },
};

// ─────────────────────────────────────────────────────────────
//  POSTS
// ─────────────────────────────────────────────────────────────

export const POSTS: BlogPost[] = [
  // ── FEATURED ──────────────────────────────────────────────
  {
    slug: "what-is-a-financial-identity",
    title: "What Is a Financial Identity — and Why Your Business Needs One",
    excerpt: "A credit score tells lenders one number. A financial identity tells them your whole story. Here's why the difference matters for African SMEs.",
    category: "financial-education",
    author: AUTHORS.tunde,
    published_at: "2025-01-10",
    reading_time_mins: 7,
    featured: true,
    tags: ["financial identity", "credit score", "SME finance", "explainer"],
    related_slugs: [
      "six-dimensions-explained",
      "why-smes-get-declined",
    ],
    body: [
      { type: "p", text: "When a bank evaluates your business for a loan, they're trying to answer one question: will you pay it back? Traditionally, they've answered that question with a credit score — a single number that compresses years of financial behavior into something a system can process in seconds." },
      { type: "p", text: "The problem is that for most African SMEs, that single number either doesn't exist or doesn't tell the right story. Your business might have had a strong two years, consistent revenue, tight expense control, and healthy cash reserves — but none of that shows up in a number derived from bank bureau data that covers only formal credit instruments." },
      { type: "h2", text: "What a financial identity actually is" },
      { type: "p", text: "A financial identity is a verified, multi-dimensional profile of how your business actually operates financially. It's built not from a credit bureau but from your real financial activity: bank transaction histories, accounting ledger data, and operational financial signals." },
      { type: "p", text: "Instead of one number, a financial identity gives capital providers six independent windows into your business:" },
      { type: "ul", items: [
        "Revenue Stability — how consistent and predictable your revenue inflows are",
        "Cashflow Predictability — how reliably you generate positive operating cashflow",
        "Expense Discipline — how well you control costs relative to revenue",
        "Liquidity Strength — your cash reserves and financial buffers",
        "Financial Consistency — the completeness and regularity of your financial activity",
        "Risk Profile — anomaly detection and irregular behavior signals",
      ]},
      { type: "callout", variant: "tip", text: "A business with a strong Revenue Stability score but a weak Liquidity score might be perfect for a revenue advance but not the right fit for a term loan. Financial identity lets capital providers match the right product to the right business." },
      { type: "h2", text: "Why this matters more in Africa" },
      { type: "p", text: "The majority of African SMEs operate in a largely informal financial environment. Many have never accessed formal credit. Many more were declined not because their business wasn't viable, but because the formal system couldn't see their story." },
      { type: "p", text: "Financial identity infrastructure — the ability to take real financial behavior and turn it into a verified, portable profile — is the foundational piece that unlocks capital access for businesses the existing system has always overlooked." },
      { type: "h2", text: "Portable and persistent" },
      { type: "p", text: "A key feature of a financial identity is that it persists over time and belongs to the business, not to any single financial institution. As your business grows, your identity grows with it. It can be presented to any capital provider on the platform, not just the ones you've previously worked with." },
      { type: "p", text: "This portability is what turns a one-time financing event into a long-term financial reputation that compounds in value." },
    ],
  },

  // ── FINANCIAL EDUCATION ───────────────────────────────────
  {
    slug: "six-dimensions-explained",
    title: "The Six Financial Dimensions: What Each One Measures and How to Improve It",
    excerpt: "Creditlinker scores your business across six independent financial dimensions. This is what each one looks at — and what you can do to strengthen your profile.",
    category: "financial-education",
    author: AUTHORS.chidi,
    published_at: "2025-01-18",
    reading_time_mins: 9,
    featured: false,
    tags: ["scoring", "dimensions", "financial health", "how-to"],
    related_slugs: ["what-is-a-financial-identity", "connecting-your-first-bank-account"],
    body: [
      { type: "p", text: "Your Creditlinker financial identity is scored across six dimensions, each independently scored 0–100. Understanding what each one measures — and what moves it — gives you actionable levers to strengthen your profile before approaching capital providers." },
      { type: "h2", text: "1. Revenue Stability (0–100)" },
      { type: "p", text: "This dimension measures how consistent and predictable your revenue inflows are over time. The model looks at growth trends, seasonal patterns, income regularity, and the concentration of revenue sources." },
      { type: "ul", items: ["Connect multiple bank accounts to capture all revenue streams", "Tag recurring revenue transactions to help the system recognize patterns", "Maintain consistent invoicing and payment cycles"] },
      { type: "h2", text: "2. Cashflow Predictability (0–100)" },
      { type: "p", text: "Tracks the month-over-month relationship between inflows and outflows. A high score means your cashflow is reliable and positive. Volatile patterns — even if your average balance is healthy — will lower this score." },
      { type: "callout", variant: "info", text: "Cashflow Predictability is one of the first signals capital providers look at. A business with volatile cashflow — even one with strong revenue — will be evaluated more carefully for any product that requires regular repayment." },
      { type: "h2", text: "3. Expense Discipline (0–100)" },
      { type: "p", text: "Measures how well your business controls operating costs relative to revenue. The model identifies runaway expense patterns, margin compression over time, and expense-to-revenue ratios across categories." },
      { type: "h2", text: "4. Liquidity Strength (0–100)" },
      { type: "p", text: "Your ability to absorb short-term financial obligations. This is your cash reserve ratio — how much available liquidity you maintain relative to your operating expenses." },
      { type: "h2", text: "5. Financial Consistency (0–100)" },
      { type: "p", text: "Rewards businesses with complete, well-structured, and regular financial data. The more data history you have — and the more consistent your activity patterns are — the higher this score will be." },
      { type: "h2", text: "6. Risk Profile (0–100)" },
      { type: "p", text: "Anomaly detection: irregular transaction patterns, unusual velocity, large uncharacteristic debit events, dormant periods followed by sudden activity. A high score means clean, predictable patterns." },
      { type: "callout", variant: "tip", text: "You also receive a separate data_quality_score that tells capital providers how reliable your underlying data is. More data sources = higher data quality = stronger credibility for all six dimensions." },
    ],
  },

  {
    slug: "why-smes-get-declined",
    title: "Why 80% of Nigerian SMEs Get Declined — and It's Not What You Think",
    excerpt: "Most SME loan rejections aren't because the business isn't viable. They're because the business is invisible. Here's what's really happening.",
    category: "financial-education",
    author: AUTHORS.fatima,
    published_at: "2025-01-25",
    reading_time_mins: 6,
    featured: false,
    tags: ["loan rejection", "SME challenges", "credit access", "Nigeria"],
    related_slugs: ["what-is-a-financial-identity", "capital-access-guide"],
    body: [
      { type: "p", text: "A survey by the Central Bank of Nigeria found that over 80% of SME loan applications are declined at the first assessment stage. Not because the businesses are failing — but because the assessment systems can't adequately evaluate them." },
      { type: "h2", text: "The visibility problem" },
      { type: "p", text: "Traditional credit assessment was designed for businesses that leave a formal paper trail: registered with a tax authority, maintaining audited accounts, with formal employment payroll, and previous formal credit history. Most Nigerian SMEs fit none of these criteria — not because they're badly run, but because they operate in a different ecosystem." },
      { type: "ul", items: [
        "Most SME transactions happen across mobile money and multiple bank accounts not linked to a single credit profile",
        "Accounting records are often informal or maintained in formats that don't map to formal reporting",
        "Bureau credit data covers only formal credit instruments — cash flow-based lending leaves no bureau footprint",
        "Seasonal businesses look volatile to systems built for steady-state evaluation",
      ]},
      { type: "h2", text: "The data is there. It just hasn't been read." },
      { type: "p", text: "The irony is that most of these businesses generate rich, readable financial signals every day. Bank transactions, mobile money histories, supplier payment patterns, payroll records — this data tells a complete story about how the business operates." },
      { type: "p", text: "The problem isn't the data. It's the infrastructure to collect, normalize, and present it in a form that capital providers can trust and act on." },
      { type: "quote", text: "We had three years of consistent revenue, two linked accounts, and a clean payment history with every supplier we've worked with. The bank still declined us because we didn't have audited accounts.", attribution: "Aduke O., Aduke Bakeries Ltd." },
    ],
  },

  // ── CAPITAL ACCESS ────────────────────────────────────────
  {
    slug: "capital-access-guide",
    title: "The SME Guide to Capital Access: 14 Types of Financing and When Each One Fits",
    excerpt: "Not all capital is the same. Working capital loans, equipment financing, invoice discounting, revenue advances — each serves a different need. Here's how to know which one fits your business.",
    category: "capital-access",
    author: AUTHORS.chidi,
    published_at: "2025-02-01",
    reading_time_mins: 11,
    featured: false,
    tags: ["financing types", "working capital", "equipment financing", "invoice financing"],
    related_slugs: ["what-is-a-financial-identity", "six-dimensions-explained"],
    body: [
      { type: "p", text: "One of the most common mistakes SMEs make when seeking capital is applying for the wrong product. A business with strong receivables might apply for a working capital loan when invoice financing would be faster, cheaper, and more likely to be approved. Understanding what each capital type is designed for is the first step to accessing the right one." },
      { type: "h2", text: "Debt capital" },
      { type: "h3", text: "Working Capital Loan" },
      { type: "p", text: "Short-term funding (typically 3–18 months) to cover day-to-day operating expenses — inventory, payroll, supplier payments. Best for businesses with consistent revenue that need to bridge timing gaps between expenses and income." },
      { type: "h3", text: "Term Loan" },
      { type: "p", text: "Longer-term debt (1–5 years) for a specific purpose — expansion, equipment, working capital at scale. Requires stronger financial history and is typically sized larger." },
      { type: "h3", text: "Overdraft Facility" },
      { type: "p", text: "A revolving line of credit against your bank account. Useful for very short-term gaps — days rather than weeks. Usually the most expensive form of debt but the most flexible." },
      { type: "h2", text: "Asset-based financing" },
      { type: "h3", text: "Equipment Financing" },
      { type: "p", text: "Funding specifically for acquiring equipment, machinery, or vehicles. The equipment itself acts as collateral. Available even to businesses without a strong credit profile if the asset has clear value." },
      { type: "h3", text: "Asset Leasing" },
      { type: "p", text: "Use equipment without owning it. Suitable when you need the productive capacity of an asset but not the balance sheet commitment of ownership." },
      { type: "h2", text: "Revenue-based financing" },
      { type: "h3", text: "Invoice Financing" },
      { type: "p", text: "Advance on your outstanding invoices. If your business issues invoices with 30–90 day payment terms, invoice financing lets you access that cash immediately — typically at 70–90% of face value." },
      { type: "callout", variant: "tip", text: "Invoice financing is one of the most underutilized forms of capital for Nigerian SMEs. If you have a consistent client base that pays on terms, your receivables are an asset you can monetize today." },
      { type: "h3", text: "Revenue Advance" },
      { type: "p", text: "Advance against future revenues. The repayment is typically a percentage of daily or weekly revenue — so it scales with your business. Good for businesses with variable but consistent revenue streams." },
      { type: "h2", text: "Trade-based financing" },
      { type: "h3", text: "Trade Credit" },
      { type: "p", text: "Your suppliers extend credit — you receive goods now and pay later. Building strong supplier relationships and a track record of on-time payment is the foundation for accessing trade credit at scale." },
    ],
  },

  // ── SME STORIES ───────────────────────────────────────────
  {
    slug: "aduke-bakeries-story",
    title: "From Declined to Funded: How Aduke Bakeries Built Their Financial Identity",
    excerpt: "Three bank rejections. 24 months of transaction data. One Creditlinker financial identity. This is how Aduke Bakeries accessed their first working capital facility.",
    category: "sme-stories",
    author: AUTHORS.kemi,
    published_at: "2025-02-08",
    reading_time_mins: 5,
    featured: false,
    tags: ["success story", "food & beverage", "working capital", "Lagos"],
    related_slugs: ["why-smes-get-declined", "capital-access-guide"],
    body: [
      { type: "p", text: "When Ada Okonkwo first applied for a working capital facility in early 2023, Aduke Bakeries had been operating for five years, serving three large catering contracts, and running ₦4M+ in monthly revenue across two bank accounts. Three banks declined her." },
      { type: "quote", text: "The last rejection letter said 'insufficient credit history'. I had five years of transactions. They just couldn't see them.", attribution: "Ada Okonkwo, Founder, Aduke Bakeries Ltd." },
      { type: "h2", text: "Building the identity" },
      { type: "p", text: "Ada joined Creditlinker and linked both business bank accounts. The pipeline processed 4,218 transactions across 24 months, generating 42 financial features including monthly revenue growth, cash reserve ratio, operating margin, and expense volatility." },
      { type: "p", text: "Her financial identity scored 742 out of 1000 — with particularly strong Revenue Stability (85) and Expense Discipline (81). Her Liquidity Strength (74) was good but not exceptional — which was reflected accurately in her profile." },
      { type: "h2", text: "Matching to the right capital" },
      { type: "p", text: "The readiness assessment identified working capital loans and invoice financing as her strongest-fit products. Two capital providers requested access to her full financial profile within three days of her identity being published." },
      { type: "p", text: "Within two weeks she had received and accepted a ₦10M working capital facility at 18% p.a. — the first formal credit her business had ever accessed." },
      { type: "callout", variant: "info", text: "Aduke Bakeries' financial identity now persists on Creditlinker as a 26-month record — and grows with every new transaction." },
    ],
  },

  // ── PRODUCT UPDATES ───────────────────────────────────────
  {
    slug: "mono-open-banking-integration",
    title: "Creditlinker Now Supports 30+ Banks via Mono Open Banking",
    excerpt: "We've expanded bank connectivity to cover the major Nigerian commercial banks, microfinance banks, and digital banks through our Mono integration.",
    category: "product-updates",
    author: AUTHORS.kemi,
    published_at: "2025-02-15",
    reading_time_mins: 3,
    featured: false,
    tags: ["product update", "Mono", "open banking", "bank connectivity"],
    related_slugs: ["connecting-your-first-bank-account", "what-is-a-financial-identity"],
    body: [
      { type: "p", text: "Today we're expanding Creditlinker's bank connectivity to cover 30+ Nigerian banks through our integration with Mono Open Banking. This means businesses banking with Access Bank, GTBank, UBA, Zenith, First Bank, Stanbic IBTC, and dozens more can now link their accounts and start building their financial identity in minutes." },
      { type: "h2", text: "What this means for your financial identity" },
      { type: "p", text: "The richer your data, the stronger your identity. Connecting multiple accounts — your primary operating account, your receivables account, your payroll account — gives the pipeline more signal to work with across all six financial dimensions." },
      { type: "ul", items: [
        "More accounts → higher data quality score",
        "More transaction history → stronger Revenue Stability and Cashflow Predictability scores",
        "More expense data → more accurate Expense Discipline scoring",
      ]},
      { type: "callout", variant: "tip", text: "If you have accounts at multiple banks — even if you consider one your 'main' account — link all of them. The pipeline is designed to reconcile across accounts and removes internal transfers from the analysis automatically." },
      { type: "h2", text: "Security note" },
      { type: "p", text: "Creditlinker never stores your banking credentials. Bank linking is handled entirely through the Mono secure open banking layer — we receive normalized, read-only transaction data. Your login credentials are never shared with us." },
    ],
  },

  // ── INDUSTRY INSIGHT ──────────────────────────────────────
  {
    slug: "open-banking-africa-opportunity",
    title: "Open Banking in Africa: Why the Next Decade Will Unlock SME Finance at Scale",
    excerpt: "Open banking infrastructure is maturing across Nigeria, Kenya, Ghana, and South Africa. Here's what it means for SME lending and why financial identity is the missing layer.",
    category: "industry-insight",
    author: AUTHORS.tunde,
    published_at: "2025-02-20",
    reading_time_mins: 8,
    featured: false,
    tags: ["open banking", "Africa", "fintech", "SME lending", "infrastructure"],
    related_slugs: ["what-is-a-financial-identity", "why-smes-get-declined"],
    body: [
      { type: "p", text: "The Central Bank of Nigeria's Open Banking Framework, published in 2023, established the regulatory foundation for banks to share customer financial data — with customer consent — with licensed third parties. Similar frameworks are taking shape in Kenya, Ghana, and South Africa." },
      { type: "p", text: "The implication for SME finance is significant. For the first time, it is possible to build a verified financial profile for a business from its real transaction history — not from credit bureau data that barely covers the SME segment." },
      { type: "h2", text: "The data layer was always there" },
      { type: "p", text: "African SMEs have been generating rich financial data for years — in their bank accounts, their mobile money wallets, their accounting software, and their operational records. The infrastructure to aggregate, normalize, and make that data legible to capital providers simply didn't exist." },
      { type: "p", text: "Open banking creates the pipe. Financial identity infrastructure — the normalization, enrichment, scoring, and consent management layer — is what makes that data actionable." },
      { type: "h2", text: "Why this moment matters" },
      { type: "p", text: "The IMF estimates the SME financing gap in sub-Saharan Africa at approximately $330 billion per year. A large portion of that gap exists not because capital isn't available, but because the evaluation infrastructure needed to deploy it responsibly doesn't reach the SME segment." },
      { type: "callout", variant: "info", text: "Open banking doesn't solve the SME financing gap on its own. It creates the raw material. Financial identity infrastructure is what transforms that raw material into something capital providers can act on." },
      { type: "p", text: "The next decade will see the gap narrow — not because banks become more generous, but because the infrastructure to evaluate SMEs on their actual financial behavior finally exists. Open banking is the pipe. Financial identity is the system." },
    ],
  },

  {
    slug: "connecting-your-first-bank-account",
    title: "How to Connect Your First Bank Account to Creditlinker",
    excerpt: "A step-by-step walkthrough of linking your first bank account via Mono — what happens to your data, how long it takes, and what to expect.",
    category: "product-updates",
    author: AUTHORS.kemi,
    published_at: "2025-01-05",
    reading_time_mins: 4,
    featured: false,
    tags: ["getting started", "bank linking", "Mono", "tutorial"],
    related_slugs: ["mono-open-banking-integration", "six-dimensions-explained"],
    body: [
      { type: "p", text: "Connecting your bank account is the single most important step in building your Creditlinker financial identity. The more transaction history you have, the richer your identity becomes." },
      { type: "h2", text: "Step 1: Navigate to Data Sources" },
      { type: "p", text: "From your business portal, go to Data Sources in the left sidebar. You'll see your currently linked accounts (empty on first login) and an 'Add account' button." },
      { type: "h2", text: "Step 2: Select your bank" },
      { type: "p", text: "Click 'Link bank account via Mono'. A secure Mono Open Banking window will open. Search for your bank — we support 30+ Nigerian banks including Access, GTBank, UBA, Zenith, First Bank, Stanbic IBTC, and most microfinance banks." },
      { type: "h2", text: "Step 3: Authenticate" },
      { type: "p", text: "Enter your internet banking credentials directly in the Mono secure window. Creditlinker never sees or stores your login credentials — Mono handles the authentication entirely." },
      { type: "callout", variant: "tip", text: "Link all your business bank accounts, not just your main one. Internal transfers between your accounts are automatically identified and excluded from analysis — they won't inflate or distort your metrics." },
      { type: "h2", text: "Step 4: Pipeline runs automatically" },
      { type: "p", text: "Once your account is linked, the Creditlinker pipeline runs automatically — usually within 5 minutes. It processes your full transaction history, normalizes the data, computes your financial features, and generates your initial six-dimension score." },
      { type: "p", text: "You'll receive a notification when your financial identity is ready. From that point, your identity updates automatically whenever your bank data syncs." },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
//  HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/** Get all published posts, sorted newest first */
export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

/** Get the single featured post */
export function getFeaturedPost(): BlogPost | undefined {
  return POSTS.find(p => p.featured);
}

/** Get posts by category */
export function getPostsByCategory(category: BlogCategory): BlogPost[] {
  return getAllPosts().filter(p => p.category === category);
}

/** Get a single post by slug */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find(p => p.slug === slug);
}

/** Get related posts from a list of slugs */
export function getRelatedPosts(slugs: string[]): BlogPost[] {
  return slugs
    .map(s => getPostBySlug(s))
    .filter((p): p is BlogPost => p !== undefined);
}

/** Format a date string for display */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Count posts per category */
export function getCategoryCounts(): Record<BlogCategory, number> {
  const counts = {} as Record<BlogCategory, number>;
  for (const post of POSTS) {
    counts[post.category] = (counts[post.category] ?? 0) + 1;
  }
  return counts;
}
