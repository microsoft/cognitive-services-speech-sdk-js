// subscription key and region for speech services.
var subscriptionKey, serviceRegion;
var SpeechSDK;
var connector;
var audioPlayer;

function audioReadLoop(audioStream) {
  audioStream.read().on(
    audioBuffer => {
      if (audioBuffer !== null) {
        audioPlayer.playAudioSample(audioBuffer);
      }

      if (audioBuffer != null) {
        audioReadLoop(audioStream);
      }
    },
    () => {}
  );
}

document.addEventListener("DOMContentLoaded", function() {
  listenButton = document.getElementById("listenButton");
  subscriptionKey = document.getElementById("subscriptionKey");
  serviceRegion = document.getElementById("serviceRegion");
  resultDiv = document.getElementById("resultDiv");
  activityDiv = document.getElementById("activityDiv");
  customActivityDiv = document.getElementById("customActivityDiv");

  if (!!window.SpeechSDK) {
    SpeechSDK = window.SpeechSDK;
    listenButton.disabled = true;
    sendActivityButton.disabled = true;
    document.getElementById("content").style.display = "block";
    document.getElementById("warning").style.display = "none";
  }

  connectButton.addEventListener("click", function() {
    if (connector) {
      connector.close();
      connector = undefined;
    }

    var botConfig = SpeechSDK.BotFrameworkConfig.fromSubscription(
      subscriptionKey.value,
      serviceRegion.value
    );

    var audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    connector = new SpeechSDK.DialogServiceConnector(botConfig, audioConfig);

    connector.connect();

    connectButton.innerText = "Reconnect";
    listenButton.disabled = false;
    sendActivityButton.disabled = false;

    var audioFormat = SpeechSDK.AudioStreamFormat.getDefaultInputFormat();
    audioPlayer = new SpeechSDK.BaseAudioPlayer(audioFormat);

    connector.activityReceived = (sender, eventArgs) => {
      var jsonActivity = eventArgs.activity;
      activityDiv.innerHTML += JSON.stringify(jsonActivity);

      if (
        eventArgs.activity.speak !== null &&
        eventArgs.activity.speak !== undefined
      ) {
        audioReadLoop(eventArgs.audioStream);
      }
    };
  });

  sendActivityButton.addEventListener("click", function() {
    var jsonObj = customActivityDiv.value;

    connector.sendActivityAsync(JSON.parse(customActivityDiv.value));
  });

  listenButton.addEventListener("click", function() {
    listenButton.disabled = true;
    resultDiv.innerHTML = "";
    activityDiv.innerHTML = "";

    connector.recognizing = (sender, eventArgs) => {
      resultDiv.innerHTML += "Hyphothesis: " + eventArgs.result.text + "\n";
    };

    connector.listenOnceAsync(
      result => {
        listenButton.disabled = false;
        resultDiv.innerHTML += "\r\nFinal result: " + result.text + "\r\n";
      },
      error => {
        listenButton.disabled = false;
        resultDiv.innerHTML += error;
      }
    );
  });
});
