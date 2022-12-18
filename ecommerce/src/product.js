const AWS = require('aws-sdk');
const { _getConfig, _printDebug, _printFunctionStage } = require('./utils');

module.exports.createProduct = async (event, context, callback)  => {
  const currFunction = 'createProduct';
  const messageStr = JSON.stringify(event) //Object to string without adding extra quotes
  _printFunctionStage(currFunction, messageStr, 'START');

  // Get the product information from the event
  const product = event['product'];

  // Create the product in the DynamoDB table
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  const table = 'Products';
  product['product_id'] = generateProductId();
  await dynamodb.put({ TableName: table, Item: product }).promise();
  
  const response = {
    statusCode: 200,
    body: 'Successfully created product with ID ' + product['product_id']
  }
  callback(null, response)
  
  _printFunctionStage(currFunction, messageStr, 'END');
  // Return the product
  // return product;
};

function generateProductId() {
  // Generate a random product ID
  return Math.random().toString(36).substr(2, 9);
}

module.exports.getProduct = async (event, context, callback)  => {
  const currFunction = 'getProduct';
  const messageStr = JSON.stringify(event) //Object to string without adding extra quotes
  _printFunctionStage(currFunction, messageStr, 'START');
  // Get the product ID from the event
  const product_id = event['product_id'];

  // Get the product from the DynamoDB table
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  const table = 'Products';
  const res = await dynamodb.get({ TableName: table, Key: { product_id: product_id } }).promise();
  const product = res.Item;

  const response = {
    statusCode: 200,
    body: JSON.stringify(product)
  }
  callback(null, response)
  _printFunctionStage(currFunction, messageStr, 'END');
  // Return the product
  // return product;
};


module.exports.dummy = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  callback(null, response);
};
