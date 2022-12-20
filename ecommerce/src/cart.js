// const Stripe = require('stripe');
const { newEnforcer } = require('casbin');
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const { _getConfig, _printDebug, _printFunctionStage, triggerNextFunction, sleep } = require('./utils');

// serverless invoke -f addProductToCart -d '{"product_id":"test", "quantity":1, "user_id":"alice", "useMonitor":true}' -l
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
  let cart = {};
  if (event['useMonitor'] === true) {
    const params = {
      FunctionName: 'ecommerce-dev-dbMonitor', /* required */
      Payload: JSON.stringify({
        user: event['user_id'], table: table, key: event['user_id'], action: 'get'
      }),
    };
    _printDebug(params);
    const response = await lambda.invoke(params).promise();
    _printDebug(response);
    if (response.Payload !== null && response.StatusCode == 200) {
      _printDebug(response.Payload);
      cart = JSON.parse(response.Payload) ?? { user_id: event['user_id'] };
    }
    else {
      console.log('Access Denied to request');
      return null;
    }
  }
  else {
    const res = await dynamodb.get({ TableName: table, Key: { user_id: event['user_id'] } }).promise();
    _printDebug(res);
    cart = res.Item ?? { user_id: event['user_id'] };
  }

  cart['user_id'] = event['user_id'];

  _printDebug(cart);
  // Add the product to the cart
  if (product_id in cart) {
    cart[product_id] += quantity;
  } else {
    cart[product_id] = quantity;
  }

  if (event['useMonitor'] === true) {
    const params = {
      FunctionName: 'ecommerce-dev-dbMonitor', /* required */
      Payload: JSON.stringify({
        user: event['user_id'], table: table, key: event['user_id'], action: 'put', item: cart
      }),
    };
    _printDebug(params);
    const response = await lambda.invoke(params).promise();
    _printDebug(response);
    if (!response.Payload) {
      console.log('Access Denied to request or error in request');
      return null;
    }
  }
  else {
    // Update the cart in the DynamoDB table
    await dynamodb.put({ TableName: table, Item: cart }).promise();
  }
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

// serverless invoke -f createOrder -d '{ "user_id": "alice", "payment_token": "tok_visa" , "order": {}, "useMonitor":true }' -l
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
  if (event['useMonitor'] === true) {
    const params = {
      FunctionName: 'ecommerce-dev-dbMonitor', /* required */
      Payload: JSON.stringify({
        user: event['user_id'], table: table, key: event['user_id'], action: 'put', item: order
      }),
    };
    _printDebug(params);
    const response = await lambda.invoke(params).promise();
    _printDebug(response);
    if (!response.Payload) {
      console.log('Access Denied to request or error in request');
      return null;
    }
  }
  else {
    await dynamodb.put({ TableName: table, Item: order }).promise();
  }

  const cartsTable = 'Carts';
  let cart = {};
  if (event['useMonitor'] === true) {
    const params = {
      FunctionName: 'ecommerce-dev-dbMonitor', /* required */
      Payload: JSON.stringify({
        user: event['user_id'], table: cartsTable, key: event['user_id'], action: 'get'
      }),
    };
    _printDebug(params);
    const response = await lambda.invoke(params).promise();
    _printDebug(response);
    if (response.Payload !== null && response.StatusCode == 200) {
      _printDebug(response.Payload);
      cart = JSON.parse(response.Payload);
    }
    else {
      console.log('Access Denied to request');
      return null;
    }
  }
  else {
    const res = await dynamodb.get({ TableName: table, Key: { user_id: event['user_id'] } }).promise();
    _printDebug(res);
    cart = res.Item ?? { user_id: event['user_id'] };
  }

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

  if (event['useMonitor'] === true) {
    const params = {
      FunctionName: 'ecommerce-dev-dbMonitor', /* required */
      Payload: JSON.stringify({
        user: event['user_id'], table: cartsTable, key: event['user_id'], action: 'delete'
      }),
    };
    _printDebug(params);
    const response = await lambda.invoke(params).promise();
    _printDebug(response);
    if (!response.Payload) {
      console.log('Access Denied to request or error in request');
      return null;
    }
    
  }
  else {
    // Clear the cart from the DynamoDB table
    await dynamodb.delete({ TableName: 'Carts', Key: { user_id: user_id } }).promise();
  }

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

// ================================================================== //
// Monitor function that verifies the request and forwards it to the consumer
// Triggered by producer function using process.env['monitorSnsTopicArn']
module.exports.dbMonitor = async (event, context, callback) => {
  const currFunction = 'dbMonitor';
  let messageStr = JSON.stringify(event);
  _printFunctionStage(currFunction, messageStr, 'START');
  const message = event;
  _printDebug(message);

  const enforcer = await newEnforcer(_getConfig('model.conf'), _getConfig('policy.csv'));
  const { user, table, key, action, item } = message;
  const actionAllowed = await enforcer.enforce(user, table, key, action);

  if (actionAllowed) {
    console.log('Action is allowed for', JSON.stringify(message))
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    switch (action) {
      case 'get':
        const res = await dynamodb.get({ TableName: table, Key: { user_id: user } }).promise();
        return res?.Item;
      case 'put':
        await dynamodb.put({ TableName: table, Item: item }).promise();
        return true;
      case 'delete':
        await dynamodb.delete({ TableName: table, Key: { user_id: user } }).promise();
        return true;
    }
  } else {
    // const response = {
    //   statusCode: 403,
    //   body: 'Forbidden Request ' + JSON.stringify(message)
    // }
    console.log('Forbidden Request ', JSON.stringify(message))
    // callback(null, response)
    return null;
  }
  _printFunctionStage(currFunction, messageStr, 'END');
}