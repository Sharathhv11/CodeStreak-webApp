import mongoose from "mongoose";
import Embedding from "../model/embeddingModel.js";

// ─── Upsert Embedding ───────────────────────────────────────────
// Creates or updates an embedding for a submission.
// Skips the write if the contentHash has not changed (no duplicate work).

export async function upsertEmbedding({
  userId,
  submissionId,
  embedding,
  contentHash,
  documentText,
}) {
  // Check if an identical embedding already exists (same content)
  const existing = await Embedding.findOne({ submission: submissionId });

  if (existing && existing.contentHash === contentHash) {
    // Content has not changed — skip re-embedding
    return existing;
  }

  if (existing) {
    // Content changed — update in place
    existing.embedding = embedding;
    existing.contentHash = contentHash;
    existing.documentText = documentText;
    await existing.save();
    return existing;
  }

  // First time — create new embedding document
  return await Embedding.create({
    submission: submissionId,
    user: userId,
    embedding,
    contentHash,
    documentText,
  });
}

// ─── Semantic Similarity Search ──────────────────────────────────
// Uses MongoDB Atlas $vectorSearch to find the most similar embeddings
// for a given user. Pre-filters by userId for strict user isolation.
//
// Fallback: If Atlas Vector Search index is not yet created, still building,
// or returns 0 results, it falls back to in-memory cosine similarity search
// so RAG works immediately without waiting for Atlas index provisioning.

const VECTOR_INDEX_NAME = "embedding_vector_index";

/**
 * Computes cosine similarity between two vectors.
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * In-memory fallback: fetches embeddings for the user and ranks by cosine similarity.
 */
async function searchSimilarFallback(userObjectId, queryEmbedding, topK) {
  console.log(
    `[RAG] 🔍 Running in-memory cosine similarity fallback for user: ${userObjectId}`
  );

  let docs = await Embedding.find({ user: userObjectId }).lean();

  if (docs.length === 0) {
    // Check if embeddings exist under any user (helps debug local development user mismatches)
    const totalInCollection = await Embedding.countDocuments();
    console.warn(
      `[RAG] ⚠️ User ${userObjectId} has 0 embeddings in the collection (total in DB: ${totalInCollection}).`
    );
    // If there's only one user's data in local dev, check if we should fall back to all embeddings
    if (totalInCollection > 0) {
      const sample = await Embedding.findOne({}, { user: 1 }).lean();
      console.warn(
        `[RAG] 💡 Hint: Existing embeddings belong to user ${sample?.user}. Are you logged in with a different account?`
      );
    }
    return [];
  }

  const scored = docs.map((doc) => ({
    _id: doc._id,
    submission: doc.submission,
    user: doc.user,
    documentText: doc.documentText,
    score: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  console.log(
    `[RAG] ✅ In-memory search ranked ${scored.length} embeddings. Top score: ${(
      (scored[0]?.score || 0) * 100
    ).toFixed(1)}%`
  );
  return scored.slice(0, topK);
}

export async function searchSimilar(userId, queryEmbedding, topK = 5) {
  const userObjectId =
    userId instanceof mongoose.Types.ObjectId
      ? userId
      : new mongoose.Types.ObjectId(userId);

  let results = [];

  // 1. Try MongoDB Atlas $vectorSearch
  try {
    const pipeline = [
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: topK * 10,
          limit: topK,
          filter: {
            user: userObjectId,
          },
        },
      },
      {
        $project: {
          _id: 1,
          submission: 1,
          user: 1,
          documentText: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ];

    results = await Embedding.aggregate(pipeline);
    if (results.length > 0) {
      console.log(
        `[RAG] ⚡ Atlas $vectorSearch returned ${results.length} results.`
      );
      return results;
    }
    console.log(
      `[RAG] ℹ️ Atlas $vectorSearch returned 0 results. Checking in-memory fallback...`
    );
  } catch (err) {
    console.warn(
      `[RAG] ⚠️ Atlas $vectorSearch unavailable (${err.message}). Using in-memory search.`
    );
  }

  // 2. Fallback to in-memory cosine similarity search
  return await searchSimilarFallback(userObjectId, queryEmbedding, topK);
}

// ─── Delete Embedding ────────────────────────────────────────────
// Removes the embedding for a submission (e.g. when a submission is deleted).

export async function deleteEmbedding(submissionId) {
  return await Embedding.deleteOne({ submission: submissionId });
}

// ─── Embedding Stats ─────────────────────────────────────────────
// Returns how many submissions have embeddings for a given user.

export async function getEmbeddingStats(userId) {
  const userObjectId =
    userId instanceof mongoose.Types.ObjectId
      ? userId
      : new mongoose.Types.ObjectId(userId);

  return await Embedding.countDocuments({ user: userObjectId });
}
