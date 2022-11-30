### Setup
- Install required dependencies - `npm install`
- Setup AWS access key and secret using [this](https://www.serverless.com/framework/docs/providers/aws/guide/credentials/)
- Configure functions in [serverless.yml](/serverless.yml)
- Configure the policies in functions

### Usage
- Deploy changes on AWS using `serverless deploy`
- Invoke the producer function with the details about the chained request `serverless invoke -f producer -d '{"action": "read", "subject": "alice", "object": "data1", "function": "consumer"}' -l`
- View logs for a function using `serverless logs -f monitor` or on [Log Groups on Cloudwatch](https://us-east-1.console.aws.amazon.com/cloudwatch/)

### Local Development
Usage on cloud deployment can take a long time while testing changes during development. As an alternative, we simulate the function runtime locally along with other dependencies like SNS.
 - [SNS Offline](https://www.serverless.com/plugins/serverless-offline-sns)
 - [Serverless Offline](https://www.serverless.com/plugins/serverless-offline)

#### Usage
TODO