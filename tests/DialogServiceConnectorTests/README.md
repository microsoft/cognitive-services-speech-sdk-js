# DialogServiceConnector browser test

This test page uses the JS Speech SDK to connect to BotFramework or CustomCommands agents. By inputting the required fields and connecting you can test your agent's supported interactions like SR, TTS, and sending activities.

## Setup

You'll need a way to host the page. One option is `http-server`

Install with `npm`:

>npm install https-server

Start a server to host the page.

* If using npm, from command line run 'http-server'

In your browser, visit http://127.0.0.1:8080/DialogServiceConnectorSample.html

Enter a subscription key and corresponding region (defaults to westus2, yours may vary)

Click "Connect"

Try out "Start listening" for one-shot SR or enter a valid JSON activity to send in the `Custom Activity` text area. The `Results` and `Activity` text areas will display the latest responses.
