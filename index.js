var fs = require('fs');
var SpeedTest = require('speedtest-net');
var metrics = require('datadog-metrics');

const SPEED_TEST_INTERVAL_MIN = process.env.SPEED_TEST_INTERVAL_MIN || 20;

metrics.init({
    host: 'ISP',
    prefix: 'isp.'
});

uploadBandwidth(() => {
    console.log(`Sleeping for ${SPEED_TEST_INTERVAL_MIN} min`);
});

const WAIT_MS = SPEED_TEST_INTERVAL_MIN * 60 * 1000;

setInterval(() => {
    uploadBandwidth(() => {
        console.log(`Sleeping for ${SPEED_TEST_INTERVAL_MIN} min`);
    });
}, WAIT_MS);

function uploadBandwidth(callback) {
    console.log("Running speed test...");
    var test = SpeedTest({maxTime: 5000});

    test.on('error', err => {
        console.error(err);
        return;
    });

    test.on('data', testData => {
        console.log("Uploading results...");
        var dlSpeed = testData.speeds.download;
        var ulSpeed = testData.speeds.upload;
        metrics.gauge('speed.download', dlSpeed);
        metrics.gauge('speed.upload', ulSpeed);
        if(callback) {
            callback();
        };
    });
}
