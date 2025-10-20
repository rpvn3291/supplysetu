// filename: listener.js
import 'dotenv/config';
import amqp from 'amqplib';
import { ethers } from 'ethers';

// --- THIS IS THE FIX ---
// We will manually read and parse the JSON file instead of using import assertions.
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Helper to get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Construct the path and load the artifact
const artifactPath = path.join(__dirname, './artifacts/contracts/Reviews.sol/Reviews.json');
const artifactFile = fs.readFileSync(artifactPath, 'utf8');
const ReviewsArtifact = JSON.parse(artifactFile);
// --- END OF FIX ---


const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const ABI = ReviewsArtifact.abi;

async function main() {
  console.log('Blockchain listener service starting...');

  // --- Connect to the Blockchain ---
  const provider = new ethers.JsonRpcProvider(process.env.HARDHAT_NODE_URL);
  const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  const reviewsContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
  console.log(`Connected to smart contract at ${CONTRACT_ADDRESS}`);


  // --- Connect to RabbitMQ ---
  try {
    const connection = await amqp.connect(process.env.AMQP_URL);
    const channel = await connection.createChannel();
    const queueName = 'review.created';
    await channel.assertQueue(queueName, { durable: true });
    
    console.log(`[*] Waiting for review.created messages in queue: ${queueName}`);

    channel.consume(queueName, async (msg) => {
      if (msg !== null) {
        try {
          const review = JSON.parse(msg.content.toString());
          console.log('[x] Received review:', review);

          // --- Execute the Smart Contract Transaction ---
          console.log('--> Sending transaction to add review to the blockchain...');
          const tx = await reviewsContract.addReview(
            review.targetUserId,
            review.reviewerId,
            review.orderId,
            review.rating,
            review.comment || '' // Pass an empty string if comment is null
          );
          
          // Wait for the transaction to be mined
          await tx.wait(); 
          console.log(`[✔] Transaction successful! Hash: ${tx.hash}`);

          // Acknowledge the message so RabbitMQ removes it from the queue
          channel.ack(msg);

        } catch (error) {
          console.error('Failed to process message or send transaction:', error);
          // In a real app, you would handle this failure (e.g., move to a dead-letter queue)
          channel.nack(msg, false, false); // Reject the message without requeueing
        }
      }
    });
  } catch (error) {
    console.error('Failed to connect to RabbitMQ consumer:', error);
  }
}

main();

