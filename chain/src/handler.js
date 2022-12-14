'use strict'

const { newEnforcer } = require('casbin');
const { _getConfig, _printDebug, _printFunctionStage, triggerNextFunction } = require('./utils');
// ================================================================== //
// Producer function that needs to trigger the consumer function
// Sending the request to the monitor function to verify and forward
// Event example:
// '{"requestId": "50", "action": "read", "subject": "bob", "object": "data2", "nextFunction": "consumer", "useMonitor": true, "nextFunctionArgs": {"key1": "value1"}}'
module.exports.producer = (event, context, callback) => {
  const currFunction = 'producer';
  const messageStr = JSON.stringify(event) //Object to string without adding extra quotes
  _printFunctionStage(currFunction, messageStr, 'START');
  _printDebug(messageStr);
  triggerNextFunction(event, callback, currFunction);
  _printFunctionStage(currFunction, messageStr, 'END');
}

// ================================================================== //
// Intermediate function run n times recursively for benchmarking
// '{"requestId": "50", "action": "read", "subject": "bob", "object": "data2",\
//  "nextFunction": "intermediate", "useMonitor": true, "nextFunctionArgs": {"intermediateCount": 1}}'
module.exports.intermediate = (event, context, callback) => {
  const currFunction = 'intermediate';
  let messageStr = event.Records[0].Sns.Message;
  _printFunctionStage(currFunction, messageStr, 'START');
  const message = JSON.parse(messageStr);

  const intermediateCount = message.nextFunctionArgs.intermediateCount ?? 0;
  message.nextFunction = intermediateCount ? message.nextFunction : 'consumer';
  message.nextFunctionArgs.intermediateCount = intermediateCount - 1;
  triggerNextFunction(message, callback, currFunction);
  _printFunctionStage(currFunction, messageStr, 'END');
}

// ================================================================== //
// End function accessing priveleged data or performing priveleged action
// Triggered by monitor function using process.env['consumerSnsTopicArn']
module.exports.consumer = (event, context, callback) => {
  const currFunction = 'consumer';
  let messageStr = event.Records[0].Sns.Message;
  _printFunctionStage(currFunction, messageStr, 'START');
  const message = JSON.parse(messageStr);
  _printDebug(message);

  const response = {
    statusCode: 200,
    body: 'Received Request'
  }
  callback(null, response)
  _printFunctionStage(currFunction, messageStr, 'END');
}

// ================================================================== //
// Monitor function that verifies the request and forwards it to the consumer
// Triggered by producer function using process.env['monitorSnsTopicArn']
module.exports.monitor = async (event, context, callback) => {
  const currFunction = 'monitor';
  let messageStr = event.Records[0].Sns.Message;
  _printFunctionStage(currFunction, messageStr, 'START');
  const message = JSON.parse(messageStr);
  _printDebug(message);

  // const nextFunction = message.nextFunction; // Next function to trigger
  const action = message.action; // Type of action to perform i.e READ, WRITE, UPDATE, DELETE
  const subject = message.subject; // Subject over which action is perform
  const object = message.object; // Object on which action is performed

  const enforcer = await newEnforcer(_getConfig('model.conf'), _getConfig('policy.csv'));

  const actionAllowed = await enforcer.enforce(subject, object, action);
  if (actionAllowed) {
    const response = {
      statusCode: 200,
      body: 'Action is allowed for ' + JSON.stringify(message)
    }
    triggerNextFunction(message, callback, currFunction, response);
    console.log('Action is allowed for', JSON.stringify(message))
    callback(null, response)
  } else {
    const response = {
      statusCode: 403,
      body: 'Forbidden Request ' + JSON.stringify(message)
    }
    triggerNextFunction(message, callback, currFunction, response);
    console.log('Forbidden Request ', JSON.stringify(message))
    callback(null, response)
  }
  _printFunctionStage(currFunction, messageStr, 'END');
}