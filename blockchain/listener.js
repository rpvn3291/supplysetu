// filename: listener.js
import 'dotenv/config';
import amqp from 'amqplib';
import { ethers } from 'ethers';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Helper to get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load BOTH smart contract artifacts ---
const reviewsArtifactPath = path.join(__dirname, './artifacts/contracts/Reviews.sol/Reviews.json');
const traceabilityArtifactPath = path.join(__dirname, './artifacts/contracts/Traceability.sol/Traceability.json');

const ReviewsArtifact = JSON.parse(fs.readFileSync(reviewsArtifactPath, 'utf8'));
const TraceabilityArtifact = JSON.parse(fs.readFileSync(traceabilityArtifactPath, 'utf8'));

// --- Get BOTH contract addresses from .env ---
const REVIEWS_CONTRACT_ADDRESS = process.env.REVIEWS_CONTRACT_ADDRESS;
const TRACEABILITY_CONTRACT_ADDRESS = process.env.TRACEABILITY_CONTRACT_ADDRESS;

async function main() {
  console.log('Blockchain listener service starting...');

  // --- Connect to the Blockchain ---
  const provider = new ethers.JsonRpcProvider(process.env.HARDHAT_NODE_URL);
  const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  
  // Create contract instances for BOTH contracts
  const reviewsContract = new ethers.Contract(REVIEWS_CONTRACT_ADDRESS, ReviewsArtifact.abi, wallet);
  const traceabilityContract = new ethers.Contract(TRACEABILITY_CONTRACT_ADDRESS, TraceabilityArtifact.abi, wallet);
  
  console.log(`Connected to Reviews contract at ${REVIEWS_CONTRACT_ADDRESS}`);
  console.log(`Connected to Traceability contract at ${TRACEABILITY_CONTRACT_ADDRESS}`);


  // --- Connect to RabbitMQ and consume from MULTIPLE queues ---
  try {
    const connection = await amqp.connect(process.env.AMQP_URL);
    const channel = await connection.createChannel();
    
    // --- Set up listener for Review events ---
    const reviewQueue = 'review.created';
    await channel.assertQueue(reviewQueue, { durable: true });
    console.log(`[*] Waiting for messages in queue: ${reviewQueue}`);
    channel.consume(reviewQueue, async (msg) => {
      if (msg !== null) {
        try {
          const review = JSON.parse(msg.content.toString());
          console.log('[x] Received review.created event:', review);

          const tx = await reviewsContract.addReview(
            review.targetUserId,
            review.reviewerId,
            review.orderId,
            review.rating,
            review.comment || ''
          );
          await tx.wait(); 
          console.log(`[✔] Review transaction successful! Hash: ${tx.hash}`);
          channel.ack(msg);
        } catch (error) {
          console.error('Failed to process review message:', error);
          channel.nack(msg, false, false);
        }
      }
    });

    // --- NEW: Set up listener for Product events ---
    const productQueue = 'product.created';
    await channel.assertQueue(productQueue, { durable: true });
    console.log(`[*] Waiting for messages in queue: ${productQueue}`);
    channel.consume(productQueue, async (msg) => {
        if (msg !== null) {
            try {
                const product = JSON.parse(msg.content.toString());
                console.log('[x] Received product.created event:', product);

                const tx = await traceabilityContract.createProductBatch(
                    product.batchId,
                    product.productName,
                    product.supplierId,
                    product.supplierName
                );
                await tx.wait();
                console.log(`[✔] Product batch transaction successful! Hash: ${tx.hash}`);
                channel.ack(msg);
            } catch (error) {
                console.error('Failed to process product message:', error);
                channel.nack(msg, false, false);
            }
        }
    });

  } catch (error) {
    console.error('Failed to connect to RabbitMQ consumer:', error);
  }
}

main();

