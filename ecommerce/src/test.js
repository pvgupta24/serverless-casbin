const { newEnforcer } = require('casbin');
const { _getConfig, _printDebug, _printFunctionStage, triggerNextFunction, sleep } = require('./utils');
var async = require("async");

// async function main() {
//     const enforcer = await newEnforcer(_getConfig('model.conf'), _getConfig('policy.csv'));

//     const message = {
//         key: 'user_id', value: 'alice', table: 'Products',
//         user: 'bob', action: 'get', func: 'addProductToCart'
//     };
//     const { user, table, key, value, action, func } = message;
//     console.log(user, table, key, value, action, func);

//     const actionAllowed = enforcer.enforceSync(user, table, value, action);
//     console.log('actionAllowed', actionAllowed);
// }

// main();

const f = () => {
    const c = 1;
    const x = () =>{console.log(c)};
}