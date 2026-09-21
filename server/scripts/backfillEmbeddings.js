/**
 * Backfill Embeddings Script
 *
 * Generates embeddings for all existing submissions that don't have one yet.
 * Run once after initial setup:
 *
 *   node server/scripts/backfillEmbeddings.js
 *
 * Features:
 * - Skips submissions that already have embeddings
 * - Respects Gemini rate limits with configurable delays
 * - Reports progress to stdout
 * - Gracefully handles errors per-submission (continues on failure)
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/mongoDB.js";
import Submission from "../model/submissionModel.js";
import Embedding from "../model/embeddingModel.js";
import {
  prepareDocument,
  hashContent,
  generateEmbedding,
} from "../services/embeddingService.js";

// ─── Configuration ───────────────────────────────────────────────

const BATCH_DELAY_MS = 500; // Delay between API calls to respect rate limits
const LOG_EVERY = 10; // Print progress every N submissions

// ─── Main ────────────────────────────────────────────────────────

async function backfill() {
  console.log("🔗 Connecting to MongoDB...");
  await connectDB();

  // Find all submissions that don't have embeddings yet
  const existingEmbeddings = await Embedding.find({}, { submission: 1 }).lean();
  const embeddedIds = new Set(
    existingEmbeddings.map((e) => e.submission.toString())
  );

  const allSubmissions = await Submission.find({}).lean();
  const toEmbed = allSubmissions.filter(
    (s) => !embeddedIds.has(s._id.toString())
  );

  console.log(
    `📊 Found ${allSubmissions.length} total submissions, ${embeddedIds.size} already embedded.`
  );
  console.log(`📝 ${toEmbed.length} submissions need embeddings.\n`);

  if (toEmbed.length === 0) {
    console.log("✅ All submissions already have embeddings. Nothing to do.");
    await mongoose.disconnect();
    return;
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < toEmbed.length; i++) {
    const sub = toEmbed[i];

    try {
      const documentText = prepareDocument(sub);
      const contentHash = hashContent(documentText);
      const embedding = await generateEmbedding(documentText);

      await Embedding.create({
        submission: sub._id,
        user: sub.user,
        embedding,
        contentHash,
        documentText,
      });

      success++;
    } catch (err) {
      failed++;
      console.error(
        `  ❌ Failed to embed "${sub.title}" (${sub._id}): ${err.message}`
      );
    }

    // Progress logging
    if ((i + 1) % LOG_EVERY === 0 || i === toEmbed.length - 1) {
      console.log(
        `  Progress: ${i + 1}/${toEmbed.length} (✅ ${success} | ❌ ${failed})`
      );
    }

    // Rate limit delay (skip on last item)
    if (i < toEmbed.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  console.log(`\n🏁 Backfill complete!`);
  console.log(`   ✅ Successfully embedded: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total in collection: ${embeddedIds.size + success}`);

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB.");
}

backfill().catch((err) => {
  console.error("Fatal error during backfill:", err);
  process.exit(1);
});
