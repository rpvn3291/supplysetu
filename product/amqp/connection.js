// filename: amqp/connection.js
const amqp = require('amqplib');

let channel = null;

const connectToRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.AMQP_URL);
    channel = await connection.createChannel();
    // Assert queues for both order and product events
    await channel.assertQueue('order.created', { durable: true });
    await channel.assertQueue('product.created', { durable: true }); // NEW
    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
  }
};

const publishToQueue = (queueName, data) => {
  if (channel) {
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
      persistent: true,
    });
    console.log(`Message sent to queue: ${queueName}`);
  } else {
    console.error('RabbitMQ channel is not available.');
  }
};

module.exports = {
  connectToRabbitMQ,
  publishToQueue,
};
