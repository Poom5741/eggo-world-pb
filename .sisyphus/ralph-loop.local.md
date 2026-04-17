---
active: true
iteration: 1
completion_promise: "DONE"
initial_completion_promise: "DONE"
started_at: "2026-04-17T03:44:40.033Z"
session_id: "ses_26e88c235ffeAdwRk6yk1xL6KG"
ultrawork: true
strategy: "continue"
message_count_at_start: 230
---
don't work yet we found this two error :
Error: Create failed: {"daccPublickey":{"code":"validation_invalid_format","message":"Invalid value format."}}
Request URL
https://pb.eggoworld.io/api/auth/line-user
Request Method
POST
Status Code
404 Not Found
Remote Address
172.67.131.154:443
Referrer Policy
strict-origin-when-cross-origin 
{"error":"User not found","success":false}
fetch("https://pb.eggoworld.io/api/collections/users/records", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US",
    "content-type": "application/json",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Google Chrome\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin"
  },
  "referrer": "https://pb.eggoworld.io/line-callback.html?code=o0SJBqeRLfwH22I6JAV7&state=eyJyYW5kb20iOiI4UHVOQkVrV0FRdGJLcmo4IiwicmV0dXJuVXJsIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwL2F1dGgvY2FsbGJhY2siLCJyZWZlcnJlciI6IiIsInJlZGlyZWN0VG8iOiIvZGFzaGJvYXJkIn0%3D",
  "body": "{\"name\":\"ภูมิ\",\"email\":\"U1d4dfa8@line.eggo\",\"emailVisibility\":false,\"username\":\"line_U1d4dfa8d14a2f9f27e5ed70ce978381a\",\"externalId\":\"line_U1d4dfa8d14a2f9f27e5ed70ce978381a\",\"password\":\"438251d8e64a41efea2627e9e46f38fa\",\"passwordConfirm\":\"438251d8e64a41efea2627e9e46f38fa\"}",
  "method": "POST",
  "mode": "cors",
  "credentials": "omit"
}); 
{"name":"ภูมิ","email":"U1d4dfa8@line.eggo","emailVisibility":false,"username":"line_U1d4dfa8d14a2f9f27e5ed70ce978381a","externalId":"line_U1d4dfa8d14a2f9f27e5ed70ce978381a","password":"438251d8e64a41efea2627e9e46f38fa","passwordConfirm":"438251d8e64a41efea2627e9e46f38fa"} 
{
    "data": {
        "daccPublickey": {
            "code": "validation_invalid_format",
            "message": "Invalid value format."
        }
    },
    "message": "Failed to create record.",
    "status": 400
}
