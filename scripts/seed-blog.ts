/**
 * Generates and seeds 5 blog posts using Claude.
 * Run: npx tsx scripts/seed-blog.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const TOPICS = [
  {
    topic: "Hoe verminder je no-shows in je kapsalon met slimme herinneringen",
    keywords: ["no-show kapsalon", "afspraak herinnering", "sms herinnering salon", "no-show beleid"],
  },
  {
    topic: "ROI van een AI-receptioniste: wat levert het jouw salon op?",
    keywords: ["AI receptioniste kapsalon", "ROI kapsalon automatisering", "kosten besparen salon"],
  },
  {
    topic: "WhatsApp Business voor kapsalons: zo gebruik je het professioneel",
    keywords: ["WhatsApp Business kapsalon", "WhatsApp afspraken salon", "klantcommunicatie kapper"],
  },
  {
    topic: "AI in de kappersbranche: kansen en vragen beantwoord",
    keywords: ["AI kapsalon", "kunstmatige intelligentie kapper", "toekomst kappersbranche"],
  },
  {
    topic: "Klantcommunicatie automatiseren als kapper zonder persoonlijkheid te verliezen",
    keywords: ["klantcommunicatie kapper automatiseren", "persoonlijke service salon", "kapper automatisering"],
  },
];

async function main() {
  const { db } = await import("../lib/db");
  const { blogPosts } = await import("../lib/db/schema");
  const { generateBlogPost } = await import("../lib/blog/generate");
  const { eq } = await import("drizzle-orm");

  console.log("Generating blog posts with Claude...\n");

  for (const { topic, keywords } of TOPICS) {
    console.log(`→ "${topic}"`);
    try {
      const post = await generateBlogPost(topic, keywords);

      // Check if slug already exists
      const existing = await db
        .select({ id: blogPosts.id })
        .from(blogPosts)
        .where(eq(blogPosts.slug, post.slug))
        .limit(1);

      if (existing[0]) {
        console.log(`  ⚠ Slug "${post.slug}" bestaat al — overgeslagen`);
        continue;
      }

      await db.insert(blogPosts).values({
        title: post.title,
        slug: post.slug,
        status: "published",
        excerpt: post.excerpt,
        bodyMdx: post.bodyMdx,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        keywords: post.keywords,
        jsonLd: post.jsonLd,
        seoScore: post.seoScore,
        publishedAt: new Date(),
      });

      console.log(`  ✓ Gepubliceerd: "${post.title}" (score: ${post.seoScore})`);
    } catch (err) {
      console.error(`  ✗ Fout:`, err);
    }
  }

  console.log("\nKlaar.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
