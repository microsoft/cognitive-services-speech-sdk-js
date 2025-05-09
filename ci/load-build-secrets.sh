
export JSONSETTINGS_SCRIPT_FOLDER="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"  

if [[ ! $(ls "$JSONSETTINGS_SCRIPT_FOLDER/secrets/test.subscriptions.regions.json") ]]; then
  echo "WARNING: No subscriptions JSON found. Skipping all assignment and use of settings from JSON."
else
  function getSetting() {
    set -euo pipefail
    if [[ ! "${SPEECHSDK_GETSETTING_CMD:-}" ]]; then
      if [[ $(which jq) ]]; then
        # The jq tool is a much more appropriate and efficient means for this; use it if it's available
        export SPEECHSDK_GETSETTING_CMD="cat \"${JSONSETTINGS_SCRIPT_FOLDER}/\$1\" | jq -jr \".\$2\""
      else
        echo "jq not found, quitting"
        exit -1
      fi
    fi
    eval "$SPEECHSDK_GETSETTING_CMD"
  }

  SPEECHSDK_SPEECH_KEY=$( getSetting './secrets/test.subscriptions.regions.json' 'UnifiedSpeechSubscription.Key' )
  SPEECHSDK_SPEECH_REGION=$( getSetting './secrets/test.subscriptions.regions.json' 'UnifiedSpeechSubscription.Region' )
  
# Redaction: pipe anything that could contain known sensitive information like keys into global_redact
  SPEECHSDK_GLOBAL_STRINGS_TO_REDACT=(
    $SPEECHSDK_SPEECH_KEY
  )

  function redact_input_with {
    # N.B. receiving stdin as first command in function. Avoid calling this repeatedly (e.g. once per line of large
    # output) as there's a startup cost to invoking perl. Use stream redirection as needed, instead.
    perl -MIO::Handle -lpe \
      'BEGIN { 
          STDOUT->autoflush(1); 
          STDERR->autoflush(1); 
          if (@ARGV) { 
              $re = sprintf "(?:%s)", (join "|", map { quotemeta $_ } splice @ARGV); 
              $re = qr/$re/ 
          } 
      } 
      $re and s/$re/***/gi' $@
  }

  function global_redact {
    redact_input_with "${SPEECHSDK_GLOBAL_STRINGS_TO_REDACT[@]}"
  }
fi