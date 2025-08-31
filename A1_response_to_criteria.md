Assignment 1 - REST API Project - Response to Criteria
================================================

Overview
------------------------------------------------

- **Name:** Cody Say
- **Student number:** n11558849
- **Application name:** clipper
- **Two line description:** This REST API provides a way to clip an uploaded video into segments, with some extra options.


Core criteria
------------------------------------------------

### Containerise the app

- **ECR Repository name:** n11558849/clipper-server
- **Video timestamp:** 0:15
- **Relevant files:**
  - ./infra/docker/server.Dockerfile
  - ./infra/docker/client.Dockerfile
  - ./docker-compose-yml

### Deploy the container

- **EC2 instance ID:** i-041bca8446760c9bb
- **Video timestamp:** 0:30

### User login

- **One line description:** Hard-coded user objects with roles. Uses JWTs for sessions.
- **Video timestamp:** 1:59, 2:33
- **Relevant files:**
  - ./apps/server/src/routes/auth.routes.ts
  - ./apps/server/src/middlewares/auth.middleware.ts
  - ./apps/server/src/middlewares/auth.controller.ts
  - ./apps/server/src/utils/users.util.ts

### REST API

- **One line description:** REST API with endpoints and HTTP methods (GET, POST), and appropriate status codes
- **Video timestamp:** 1:09
- **Relevant files:**
  - ./apps/server/src/routes
  - ./apps/server/src/controllers

### Data types

#### First kind

- **One line description:** The unstructured data are the temporary video files for both input and output
- **Type:** Unstructured
- **Rationale:** Videos are very large and on disk files is basically the only way
- **Video timestamp:** 2:43
- **Relevant files:**
  - ./apps/server/uploads
  - ./apps/server/src/utils/file.util.ts
  - ./apps/server/src/controllers/clipper.controller.ts

#### Second kind

- **One line description:** The structured data is the job queue which is json
- **Type:** Structured
- **Rationale:** While database also works json was easier at the time. Most likely will migrate to db
- **Video timestamp:** 2:55
- **Relevant files:**
  - ./apps/server/jobs.json
  - ./apps/server/src/types/job.d.ts
  - ./apps/server/src/controllers/jobs.controller.ts

### CPU intensive task

**One line description:** Uses ffmpeg to clip video into segments and combine them (using a light wrapper from GitHub)
- **Video timestamp:** 3:06
- **Relevant files:**
  - ./apps/server/src/services/clipper.server.ts
  - ./apps/server/src/controllers/clipper.controller.ts

### CPU load testing

**One line description:** Load is tested by uploading a video once and then requesting the process endpoint multiple times
- **Video timestamp:** 3:27
- **Relevant files:**
  - ./apps/server/loadtest.js

Additional criteria
------------------------------------------------

### Extensive REST API features

- **One line description:** Unsure
- **Video timestamp:**
- **Relevant files:**
  - 

### External API(s)

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
  - 

### Additional types of data

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
  - 

### Custom processing

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
  - 

### Infrastructure as code

- **One line description:** Used docker compose to run the frontend and backend together
- **Video timestamp:** 0:09
- **Relevant files:**
  - ./docker-compose.yml

### Web client

- **One line description:** A simple frontend done with react + vite for the clipping endpoint only
- **Video timestamp:** 0:53
- **Relevant files:**
  -   ./apps/client

### Upon request

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
  - 