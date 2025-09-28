# Config
$accountId   = "901444280953"
$region      = "ap-southeast-2"
$clientRepo  = "group83/client"
$serverRepo  = "group83/server"
$tag         = "latest"

# Parse .env for client build-time variables (VITE_*)
$envVars = Get-Content .env | ForEach-Object {
    if ($_ -match "^(VITE_.*)=(.*)$") {
        [PSCustomObject]@{ Key = $Matches[1]; Value = $Matches[2] }
    }
}

# Build args as array (not string)
$buildArgs = $envVars | ForEach-Object {
    "--build-arg"
    "$($_.Key)=$($_.Value)"
}

# Login to ECR
Write-Host "Logging in to Amazon ECR..."
aws ecr get-login-password --region $region |
    docker login --username AWS --password-stdin "$accountId.dkr.ecr.$region.amazonaws.com"

# Build and push client image
Write-Host "Building client image..."
docker build @buildArgs -f infra/docker/client.Dockerfile -t client:local .

$clientEcrTag = "$accountId.dkr.ecr.$region.amazonaws.com/${clientRepo}:$tag"
Write-Host "Tagging client image as $clientEcrTag ..."
docker tag client:local $clientEcrTag

Write-Host "Pushing client image..."
docker push $clientEcrTag

# Build and push server image
Write-Host "Building server image..."
docker build -f infra/docker/server.Dockerfile -t server:local .

$serverEcrTag = "$accountId.dkr.ecr.$region.amazonaws.com/${serverRepo}:$tag"
Write-Host "Tagging server image as $serverEcrTag ..."
docker tag server:local $serverEcrTag

Write-Host "Pushing server image..."
docker push $serverEcrTag

# Done
Write-Host "Deploy complete."
Write-Host "Client pushed to: $clientEcrTag"
Write-Host "Server pushed to: $serverEcrTag"
