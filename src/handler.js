'use strict'

const aws = require('aws-sdk')
const { newEnforcer } = require('casbin');

// Helper Functions
const _getConfig = fileName => __dirname + "/config/" + fileName;

// ================================================================== //
// Producer function that needs to trigger the consumer function
// Sending the request to the monitor function to verify and forward
// Event example:
// '{"requestId", "action": "read", "subject": "bob", "object": "data2", "nextFunction": "consumer", "useMonitor": true}'
module.exports.producer = (event, context, callback) => {
  let sns = new aws.SNS()
  const useMonitor = event.useMonitor ?? true;

  // Whether to use intermediate monitor function or not
  const targetFunction = useMonitor ? "monitor" : event.nextFunction;

  const messageStr = JSON.stringify(event) //Object to string without adding extra quotes
  console.log("EVENT: ", typeof(messageStr), '\n', messageStr);
  console.log("Triggering next function ", process.env[targetFunction + 'SnsTopicArn']);

  let opts = {
    Message: messageStr,
    TopicArn: process.env[targetFunction + 'SnsTopicArn'],
  };

  sns.publish(opts, (err, data) => {
    if (err) {
      console.log('ERR: error while sending message over sns: ' + err)
      callback(err, null)
    } else {
      const response = {
        statusCode: 200,
        body: 'message sent'
      }
      callback(null, response)
    }
  })
}

// ================================================================== //
// End function accessing priveleged data or performing priveleged action
// Triggered by monitor function using process.env['consumerSnsTopicArn']
module.exports.consumer = (event, context, callback) => {
  let messageStr = event.Records[0].Sns.Message;
  const message = JSON.parse(messageStr);
  console.log('Received Message ', message, typeof(message))
  const response = {
    statusCode: 200,
    body: 'Received Request'
  }
  callback(null, response)
}

// ================================================================== //
// Monitor function that verifies the request and forwards it to the consumer
// Triggered by producer function using process.env['monitorSnsTopicArn']
module.exports.monitor = async (event, context, callback) => {
  let messageStr = event.Records[0].Sns.Message;
  const message = JSON.parse(messageStr);
  console.log("Received monitoring request for ", typeof(message));
  console.log(message)

  const targetFunction = message.nextFunction; // Next function to trigger
  const action = message.action; // Type of action to perform i.e READ, WRITE, UPDATE, DELETE
  const subject = message.subject; // Subject over which action is perform
  const object = message.object; // Object on which action is performed

  const enforcer = await newEnforcer(
    _getConfig('model.conf'), _getConfig('policy.csv')
  );

  const actionAllowed = await enforcer.enforce(subject, object, action);
  if (actionAllowed) {
    const response = {
      statusCode: 200,
      body: 'Action is allowed for ' + JSON.stringify(message)
    }
    let sns = new aws.SNS()
    let opts = {
      Message: messageStr,
      TopicArn: process.env[targetFunction + 'SnsTopicArn'],
    };

    sns.publish(opts, (err, data) => {
      if (err) {
        console.log('ERR: error while sending message over sns: ' + err)
        callback(err, null)
      }
    })
    console.log('Action is allowed for ' + JSON.stringify(message))
    callback(null, response)
  } else {
    const response = {
      statusCode: 403,
      body: 'Forbidden Request ' + JSON.stringify(message)
    }
    console.log('Forbidden Request ' + JSON.stringify(message))
    callback(null, response)
  }
}