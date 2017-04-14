NodeJS app that does an Internet speed test uploads the results to DataDog.

Wrote this to monitor my ISP's download and upload speeds. Designed to be run on a Raspberry Pi with [Resin.io](https://resin.io/).

Runs continuously at an interval specified by the SPEED_TEST_INTERVAL_MIN environment variable (default is 5 min).

![screenshot](/img/screenshot.png)

## Resin.io instructions

1. Create an app on [Resin.io](https://docs.resin.io/raspberrypi/nodejs/getting-started/). 
2. Add your git remote for your Resin.io app and push to it:
 ```
 git remote add resin your-username@git.resin.io:your-username/app-name.git
 git push resin
 ```
3. Get a [DataDog API key](https://app.datadoghq.com/account/settings#api).
4. In your Resin app, set the "DATADOG_API_KEY" environment variable to this key.
5. Profit! You should start seeing metrics being uploaded to DataDog as soon as the app is up and running.

