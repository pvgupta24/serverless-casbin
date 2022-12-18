// const Stripe = require('stripe');
const AWS = require('aws-sdk');
const { _getConfig, _printDebug, _printFunctionStage, triggerNextFunction, sleep } = require('./utils');

// Example input: event = { "user_id": "123", "product_id": "456", "quantity": 1 }
module.exports.addProductToCart = async (event, context, callback) => {
  const currFunction = 'addProductToCart';
  const messageStr = JSON.stringify(event) //Object to string without adding extra quotes
  _printFunctionStage(currFunction, messageStr, 'START');

  // Get the product information from the event
  const product_id = event['product_id'];
  const quantity = event['quantity'];

  // Get the user's cart from the DynamoDB table
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  const table = 'Carts';
  const res = await dynamodb.get({ TableName: table, Key: { user_id: event['user_id'] } }).promise();
  const cart = res.Item ?? { user_id: event['user_id'] };

  // Add the product to the cart
  if (product_id in cart) {
    cart[product_id] += quantity;
  } else {
    cart[product_id] = quantity;
  }

  // Update the cart in the DynamoDB table
  await dynamodb.put({ TableName: table, Item: cart }).promise();

  const response = {
    statusCode: 200,
    body: 'Updated cart to ' + JSON.stringify(cart)
  }
  callback(null, response)
  _printFunctionStage(currFunction, messageStr, 'END');
  // Return the updated cart
  // return cart;
};

// module.exports.getCart = async (event) => {
//   // Get the user's cart from the DynamoDB table
//   const dynamodb = new AWS.DynamoDB.DocumentClient();
//   const table = 'Carts';
//   const response = await dynamodb.get({ TableName: table, Key: { user_id: event['user_id'] } }).promise();
//   const cart = response.Item;

//   // Return the cart
//   return cart;
// };

// module.exports.updateCart = async (event) => {
//   // Get the updated cart from the event
//   const cart = event['cart'];

//   // Update the cart in the DynamoDB table
//   const dynamodb = new AWS.DynamoDB.DocumentClient();
//   const table = 'Carts';
//   await dynamodb.put({ TableName: table, Item: cart }).promise();

//   // Return the updated cart
//   return cart;
// };

// Example input: event = { "user_id": "123", "payment_token": "tok_visa" , "order": {} }
module.exports.createOrder = async (event, context, callback) => {
  const currFunction = 'createOrder';
  const messageStr = JSON.stringify(event) //Object to string without adding extra quotes
  _printFunctionStage(currFunction, messageStr, 'START');

  // Get the order information from the event
  const order = event['order'];
  const user_id = event['user_id'];
  const payment_token = event['payment_token'];

  // Create the order in the DynamoDB table
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  const table = 'Orders';
  order['order_id'] = generateOrderId();
  order['user_id'] = user_id;
  order['order_date'] = new Date();
  await dynamodb.put({ TableName: table, Item: order }).promise();

  // Get the user's cart from the DynamoDB table to process order
  const res = await dynamodb.get({ TableName: table, Key: { user_id: event['user_id'] } }).promise();
  const cart = res.Item;

  // Simulating delay in payment processing in ms
  await sleep(3000);
  // Process the payment using the Stripe API
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // const charge = await stripe.charges.create({
  //   amount: order['total_cost'],
  //   currency: 'CAD',
  //   description: 'Order #' + order['order_id'],
  //   source: payment_token,
  // });

  // Clear the cart from the DynamoDB table
  await dynamodb.delete({ TableName: 'Carts', Key: { user_id: user_id } }).promise();

  const response = {
    statusCode: 200,
    body: 'Payment Completed for order ' + order['order_id']
  }
  callback(null, response)
  _printFunctionStage(currFunction, messageStr, 'END');
  // Return the order and the payment confirmation
  // return {
  //   order: order,
  //   payment: charge,
  // };
};

function generateOrderId() {
  // Generate a random order ID
  return Math.random().toString(36).substr(2, 9);
}
