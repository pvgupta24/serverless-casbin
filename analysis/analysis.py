import boto3
import json
import base64
import re
import time
from tqdm import tqdm

lambda_client = boto3.client('lambda')
log_client = boto3.client('logs')

function_name = 'ecommerce-dev-addProductToCart'



def get_logs(f):
    path = f"/aws/lambda/{f}"
    next_token = None
    is_first = True

    invokes = []
    events = []

    while next_token is not None or is_first:
        args = {
            "logGroupName": path,
            "orderBy": "LastEventTime",
            "descending": True,
        }
        if is_first:
            is_first = False
        else:
            args["nextToken"] = next_token

        stream_response = log_client.describe_log_streams(**args)

        next_token = stream_response.get("nextToken")

        for log_stream in stream_response["logStreams"]:
            args = {
                "logGroupName": path,
                "logStreamName": log_stream["logStreamName"],
            }
            events.extend(log_client.get_log_events(**args)["events"])
        for event in events:
            if event["message"].startswith("REPORT RequestId"):
                t = re.search(r"Billed Duration: (\d+) ms", event["message"]).group(1)
                print(t)
    return [invoke for invoke in invokes if invoke.unique_id != -1]

try: 
    log_client.delete_log_group(logGroupName=f'/aws/lambda/{function_name}')
except:
    pass
for i in tqdm(range(10)):
    payload = '{"product_id":"test", "quantity":1, "user_id":"alice", "useMonitor":true}'
    lambda_client.invoke(
        FunctionName=function_name,  # Name of the Lambda function
        Payload=payload         # The payload to be passed to the Lambda function
    )
    time.sleep(2)

get_logs(function_name)
# with open('data-4-with-monitor.csv', 'w') as f:
#     for i in i_s:
#         latency = i.end - i.start
#         print(latency)
#         f.write(f"{latency}\n")