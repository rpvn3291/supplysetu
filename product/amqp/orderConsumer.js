// filename: amqp/orderConsumer.js
const amqp = require('amqplib');
const Product = require('../models/productModel'); // We need our Mongoose model

const connectAndConsume = async () => {
  try {
    const connection = await amqp.connect(process.env.AMQP_URL);
    const channel = await connection.createChannel();

    // The queue name MUST match the one used by the order service
    const queueName = 'order.created';
    await channel.assertQueue(queueName, { durable: true });
    
    console.log(`[*] Waiting for messages in ${queueName}. To exit press CTRL+C`);

    // This is the core listener function
    channel.consume(queueName, async (msg) => {
      if (msg !== null) {
        try {
          // 1. Parse the incoming message
          const eventPayload = JSON.parse(msg.content.toString());
          console.log('[x] Received order.created event:', eventPayload);

          // 2. Process the event: Update stock for each item in the order
          for (const item of eventPayload.items) {
            await Product.findByIdAndUpdate(item.productId, {
              // Use MongoDB's $inc operator to decrement the stock
              $inc: { stock: -item.quantity },
            });
            console.log(`[+] Updated stock for product ${item.productId}`);
          }

          // 3. Acknowledge the message
          // This tells RabbitMQ that we have successfully processed the message
          // and it can be safely removed from the queue.
          channel.ack(msg);

        } catch (error) {
          console.error('Failed to process message:', error);
          // In a real production app, you might want to requeue the message
          // or move it to a "dead-letter" queue for inspection.
          // For now, we'll just reject it without requeueing.
          channel.nack(msg, false, false);
        }
      }
    });
  } catch (error) {
    console.error('Failed to connect to RabbitMQ consumer:', error);
  }
};

module.exports = { connectAndConsume };
