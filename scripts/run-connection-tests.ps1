# PowerShell script to run only the connection type tests

# Set the environment variable to enable connection type tests
$env:RUN_CONNECTION_TYPE_TESTS = "true"

# Run Jest with the connection type tests enabled and filter to only run tests in describe blocks with "Connection Tests"
Write-Host "Running connection type tests only..."
npx jest --testNamePattern="Connection Tests"