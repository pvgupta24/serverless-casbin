For setting up any application or benchmark, use the following step in the individual directory:

### Setup
- Install required dependencies - `npm install`
- Setup AWS access key and secret using [this](https://www.serverless.com/framework/docs/providers/aws/guide/credentials/)
- Configure functions in [serverless.yml](/serverless.yml)

### Running Workflows
- Configure the policies in `src/config/`
- FIXME: Copy `utils/utils.js` to `src/utils.js`
- Deploy changes on AWS using `serverless deploy`
- Invoke the producer function with the details about the chained request `serverless invoke -f producer -d '{"requestId":"3", "action": "read", "subject": "alice", "object": "data1", "nextFunction": "intermediate", "useMonitor": true, "nextFunctionArgs": {"intermediateCount": 3}}' -l`
- View logs for a function using `serverless logs -f monitor` or on [Log Groups on Cloudwatch](https://us-east-1.console.aws.amazon.com/cloudwatch/)

### Measuring Metrics
- TODO: Add info for python scripts to automatically run benchmarks

### Local Development
FIXME - SNS config does not work with offline and online simulataneously right now
Usage on cloud deployment can take a long time while testing changes during development. As an alternative, we simulate the function runtime locally along with other dependencies like SNS.
 - [SNS Offline](https://www.serverless.com/plugins/serverless-offline-sns)
 - [Serverless Offline](https://www.serverless.com/plugins/serverless-offline)
