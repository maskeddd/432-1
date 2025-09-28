Assignment 2 - Cloud Services Exercises - Response to Criteria
================================================

Instructions
------------------------------------------------
- Keep this file named A2_response_to_criteria.md, do not change the name
- Upload this file along with your code in the root directory of your project
- Upload this file in the current Markdown format (.md extension)
- Do not delete or rearrange sections.  If you did not attempt a criterion, leave it blank
- Text inside [ ] like [eg. S3 ] are examples and should be removed


Overview
------------------------------------------------

- **Name:** Cody Say
- **Student number:** n11448849
- **Partner name (if applicable):** Trevin Juanli n12040886
- **Application name:** clipper
- **Two line description:** This REST API provides a way to clip an uploaded video into segments,  Users authenticate with Cognito and clipped video stored in s3 while job data is stored in DynamoDB.
- **EC2 instance name or ID:**

------------------------------------------------

### Core - First data persistence service

- **AWS service name:** S3
- **What data is being stored?:** Uploaded video files and output clips
- **Why is this service suited to this data?:** S3 is designed for object storage of large binary files such as video. It provides scalable  storage and integrates well with presigned URL access.
- **Why are the other services not suitable for this data?:** DynamoDB, RDS, and EBS are not appropriate for storing large binary files. They are better for other type of data.
- **Bucket/instance/table name:** 
- **Video timestamp:**
- **Relevant files:**
    - apps/server/src/services/s3.service.ts
    - apps/server/src/controllers/files.controller.ts

### Core - Second data persistence service

- **AWS service name:** DynamoDB
- **What data is being stored?:** JSON job data
- **Why is this service suited to this data?:** DynamoDB is good for structured JSON like records. Jobs can be uniquely identified by jobId and searched by user.
- **Why are the other services not suitable for this data?:** S3 is inefficient for structured queries. RDS is more complex to set up and is not needed for simple job metadata.
- **Bucket/instance/table name:** 
- **Video timestamp:** 
- **Relevant files:**
    - apps/server/src/services/dynamodb.service.ts
    - apps/server/src/data/jobs.store.ts
    - apps/server/src/controllers/jobs.controller.ts

### Third data service

- **AWS service name:**  Not attempted
- **What data is being stored?:** 
- **Why is this service suited to this data?:**
- **Why is are the other services used not suitable for this data?:** 
- **Video timestamp:**
- **Relevant files:**
    -

### S3 Pre-signed URLs

- **S3 Bucket names:**
- **Video timestamp:**
- **Relevant files:**
    -

### In-memory cache

- **ElastiCache instance name:** Not attempted
- **What data is being cached?:** 
- **Why is this data likely to be accessed frequently?:** 
- **Video timestamp:**
- **Relevant files:**
    -

### Core - Statelessness

- **What data is stored within your application that is not stored in cloud data services?:** [eg. intermediate video files that have been transcoded but not stabilised]
- **Why is this data not considered persistent state?:** [eg. intermediate files can be recreated from source if they are lost]
- **How does your application ensure data consistency if the app suddenly stops?:** [eg. journal used to record data transactions before they are done.  A separate task scans the journal and corrects problems on startup and once every 5 minutes afterwards. ]
- **Relevant files:**
    -

### Graceful handling of persistent connections

- **Type of persistent connection and use:** [eg. server-side-events for progress reporting]
- **Method for handling lost connections:** [eg. client responds to lost connection by reconnecting and indicating loss of connection to user until connection is re-established ]
- **Relevant files:**
    -


### Core - Authentication with Cognito

- **User pool name:** ap-southeast-2_JUC9SbgGm
- **How are authentication tokens handled by the client?:** Client authenticates with Cognito, receives a JWT, and passes it as a token in API requests.
- **Video timestamp:** 
- **Relevant files:**
    - apps/client/src/routes/auth.tsx
    - apps/server/src/middlewares/auth.middleware.ts

### Cognito multi-factor authentication

- **What factors are used for authentication:** [eg. password, SMS code]
- **Video timestamp:**
- **Relevant files:**
    -

### Cognito federated identities

- **Identity providers used:**
- **Video timestamp:**
- **Relevant files:**
    -

### Cognito groups

- **How are groups used to set permissions?:** [eg. 'admin' users can delete and ban other users]
- **Video timestamp:**
- **Relevant files:**
    -

### Core - DNS with Route53

- **Subdomain**:  group83.cab432.com
- **Video timestamp:**

### Parameter store

- **Parameter names:**  -/group83/clientUrl
                        -/group83/cognito/clientId
                        -/group83/cognito/domain
                        -/group83/cognito/userPoolId
                        -/group83/dynamodb/tableName
                        -/group83/s3/bucketName
                        -/group83/serverUrl
                        -/group83/qutUsername
- **Video timestamp:**
- **Relevant files:**
    -

### Secrets manager

- **Secrets names:** [eg. n1234567-youtube-api-key]
- **Video timestamp:**
- **Relevant files:**
    -

### Infrastructure as code

- **Technology used:** Not attempted
- **Services deployed:**
- **Video timestamp:**
- **Relevant files:**
    -

### Other (with prior approval only)

- **Description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    -

### Other (with prior permission only)

- **Description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    -
