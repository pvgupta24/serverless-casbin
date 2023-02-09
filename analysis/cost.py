import boto3
import json
import base64
import re
import time
from tqdm import tqdm

lambda_client = boto3.client('lambda')
log_client = boto3.client('logs')

function_name = 'serverless-policy-dev-producer' #1024

consumer_name = 'serverless-policy-dev-consumer' #1024

monitor_name = 'serverless-policy-dev-monitor' #1024

intermediate = 'serverless-policy-dev-intermediate' #1024

# class Invoke:
#     def __init__(self):
#         self.producer_request_id = ""
#         self.consumer_request_id = ""
#         self.unique_id = -1
#         self.start = 0
#         self.end = 0

def get_consumer_logs(f):
    path = f"/aws/lambda/{f}"
    next_token = None
    is_first = True
    billed = 0
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

        events = []
        try:
            stream_response = log_client.describe_log_streams(**args)
        except Exception as e:
            return 0
        next_token = stream_response.get("nextToken")

        for log_stream in stream_response["logStreams"]:
            args = {
                "logGroupName": path,
                "logStreamName": log_stream["logStreamName"],
            }
            events.extend(log_client.get_log_events(**args)["events"])
        for event in events:
            if "REPORT RequestId" in event["message"]:
                billed += int(re.search(r"Billed Duration: (\d+) ms", event["message"]).group(1))
    return billed



for i in tqdm(range(3)):
    payload = '{"unique_id": "'+ str(i) + '", "action": "read", "subject": "alice", "object": "data1", "nextFunction": "intermediate", "useMonitor": true, "nextFunctionArgs": {"intermediateCount": 3}}'
    lambda_client.invoke(
        FunctionName=function_name,  # Name of the Lambda function
        Payload=payload         # The payload to be passed to the Lambda function
    )
    time.sleep(2)
try: 
    log_client.delete_log_group(logGroupName=f'/aws/lambda/{function_name}')
except:
    pass
try:
    log_client.delete_log_group(logGroupName=f'/aws/lambda/{consumer_name}')
except:
    pass
try:
    log_client.delete_log_group(logGroupName=f'/aws/lambda/{monitor_name}')
except:
    pass
try:
    log_client.delete_log_group(logGroupName=f'/aws/lambda/{intermediate}')
except:
    pass
for i in tqdm(range(10)):
    payload = '{"unique_id": "'+ str(i) + '", "action": "read", "subject": "alice", "object": "data1", "nextFunction": "intermediate", "useMonitor": true, "nextFunctionArgs": {"intermediateCount": 4}}'
    lambda_client.invoke(
        FunctionName=function_name,  # Name of the Lambda function
        Payload=payload         # The payload to be passed to the Lambda function
    )
    time.sleep(2)

billed_time = 0

billed_time += get_consumer_logs(consumer_name)
billed_time += get_consumer_logs(function_name)
billed_time += get_consumer_logs(monitor_name)
billed_time += get_consumer_logs(intermediate)


print(billed_time/10)