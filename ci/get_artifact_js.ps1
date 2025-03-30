$ArtifactName = "JavaScript"
$OutFile = $ArtifactName + "_234" + ".zip"
$OrgName="msasg"
$ProjectName="e71f1362-9c7d-488b-99c7-3376db8d3302"
$JSBuildDef="7863"

#use PAT token with read access to carbon build artifacts.
$PAT = "<YOUR_TOKEN_HERE>"

$BuildUrl = "https://msasg.visualstudio.com/Skyman/_apis/build/builds?definitions=$($JSBuildDef)&resultFilter=succeeded&statusFilter=completed&maxBuildsPerDefinition=1&queryOrder=finishTimeDescending"
    
$token = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes(":$($PAT)"))
    
# Get the build Id for the latest JS build
$response = Invoke-RestMethod -Uri $BuildUrl -Headers @{Authorization = "Basic $token"}
$BuildId = $response.value.id
Write-Output $BuildId

#TODO: add validation that last build id received as $BuildId was successful
Write-Output "Build Result: " $response.value.result
$downloadUrl = "https://msasg.visualstudio.com/$($ProjectName)/_apis/build/builds/$($BuildId)/artifacts?artifactName=JavaScript&api-version=7.0&%24format=zip"

# Download the artifact
$response = Invoke-WebRequest -Uri $downloadUrl -Headers @{Authorization = "Basic $token"} -OutFile $OutFile

$destinationDir = '.\tmpJSFolder'
# Create destination dir if not exist.
$null = New-Item $destinationDir -ItemType Directory -Force

# Relative path of file in ZIP to extract. 
$libZipFile = 'SpeechSDK-JavaScript*.zip'
$fileToExtract = 'JavaScript\' + $libZipFile


# Create a unique temporary directory
$tempDir = Join-Path ([IO.Path]::GetTempPath()) ([System.Guid]::NewGuid().ToString('n'))
$null = New-Item $tempDir -ItemType Directory

try {
    # Extract archive to temp dir
    Expand-Archive $OutFile -DestinationPath $tempDir

    # Copy the JS zip lib bundle to destinationDir
    $tempFilePath = Join-Path $tempDir $fileToExtract
    Write-Output $tempFilePath
    Write-Output $destinationDir
    Copy-Item $tempFilePath $destinationDir 

    #Get JS zip file name (version specific) and path in destinationDir
    $contents = Get-ChildItem -Path $destinationDir -Force -Recurse -File | Select-Object -First 1
    $libFilePath = Join-Path $destinationDir $contents.Name

    # Extract JS zip lib bundle to temp directory
    Expand-Archive -LiteralPath $libFilePath -DestinationPath $tempDir

    # Copy actual lib files to destination directory
    $filesToExtract = $contents.Basename + '\*'
    $tempFileDir = Join-Path $tempDir $filesToExtract

    Copy-Item -Force -Recurse -Verbose $tempFileDir -Destination $destinationDir
}
finally {
    # Remove the temp dir
    if( Test-Path $tempDir ) { 
        Remove-Item $tempDir -Recurse -Force -EA Continue 
    }
    if( Test-Path $libFilePath ) { 
        Remove-Item $libFilePath -Recurse -Force -EA Continue 
    }
    if( Test-Path $OutFile ) { 
        Remove-Item $OutFile -Recurse -Force -EA Continue 
    }

}
