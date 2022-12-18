const aws = require('aws-sdk')

// ================================================================== //
const _getSNS = () => {
  return new aws.SNS();

  // FIXME: Add Offline support
  const snsOffline = {
    endpoint: "http://127.0.0.1:4002",
  }
  return process.env.IS_OFFLINE ? new aws.SNS(snsOffline) : new aws.SNS();
};

const _getTopicArn = (functionName) => {
  return process.env[functionName + 'SnsTopicArn'];

  // FIXME: Add Offline support
  return process.env.IS_OFFLINE
    ? "arn:aws:sns:us-east-1:123456789012:" + functionName + "Topic"
    : process.env[functionName + 'SnsTopicArn'];
}

// ================================================================== //
// Helper Functions
export const _getConfig = fileName => __dirname + '/config/' + fileName;
export const _printDebug = variable => console.log('DEBUG: Variable', variable, 'of type', typeof (variable));
export const _printFunctionStage =
  (functionName, event, stage) => console.log(stage, 'function:', functionName, 'with params', event);
export const sleep = ms => new Promise(r => setTimeout(r, ms));

// ======================================================================================= //
// Helper function to trigger the nextfunction in message from the currfunction
export const triggerNextFunction = (message, callback, currFunction, response = null) => {
  _printDebug(message);
  _printDebug(message.useMonitor);
  _printDebug(message.nextFunction);
  const sns = _getSNS();
  // Whether to use intermediate monitor function or not
  const nextFunction = (currFunction !== 'monitor' && message.useMonitor)
    ? "monitor" : message.nextFunction;
  _printDebug(nextFunction);
  console.log(`Triggering ${nextFunction} from ${currFunction}\ with topic
    ${_getTopicArn(nextFunction)} & useMonitor: - ${message.useMonitor}`);

  const opts = {
    Message: JSON.stringify(message),
    TopicArn: _getTopicArn(nextFunction),
  };

  sns.publish(opts, (err, data) => {
    if (err) {
      console.log('ERR: error while sending message over sns:', err)
      callback(err, null)
    } else {
      const res = response ?? {
        statusCode: 200,
        body: 'Message sent to ' + nextFunction
      };
      callback(null, res);
    }
  })
}
