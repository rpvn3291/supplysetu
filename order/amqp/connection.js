// filename: amqp/connection.js
const amqp = require('amqplib');

let channel = null;

const connectToRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.AMQP_URL);
    channel = await connection.createChannel();
    // Assert a queue to make sure it exists. 'durable: true' means the queue will survive broker restarts.
    await channel.assertQueue('order.created', { durable: true });
    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
  }
};

const publishToQueue = (queueName, data) => {
  if (channel) {
    // We send the data as a Buffer, so we need to stringify it first.
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
      persistent: true, // This ensures the message is stored on disk
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
