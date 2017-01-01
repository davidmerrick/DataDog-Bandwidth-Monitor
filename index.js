var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var moment = require('moment');
var SpeedTest = require('speedtest-net');

const SHEET_ID = process.env.SHEET_ID;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Sheets API.
    authorize(JSON.parse(content), appendSheetItems);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Appends speed test data to Google Sheet
 * Assumes this order:
 * Date, time, download speed, upload speed.
 * Units are in Mbps
 */
function appendSheetItems(auth) {
    console.log("Running speed test...");
    var test = SpeedTest({maxTime: 5000});

    test.on('error', err => {
        console.error(err);
        return;
    });

    test.on('data', testData => {
        console.log("Appending data to sheet...");
        var sheets = google.sheets('v4');
        var now = moment();
        var dateString = now.format("MM/DD/YYYY");
        var timeString = now.format("HH:mm");
        var dlSpeed = testData.speeds.download;
        var ulSpeed = testData.speeds.upload;
        var values = [
            [dateString, timeString, dlSpeed, ulSpeed]
        ];
        var range = 'Sheet1!A2:D';
        var body = {
            range: range,
            majorDimension: "ROWS",
            values: values
        }

        sheets.spreadsheets.values.append({
            auth: auth,
            spreadsheetId: SHEET_ID,
            range: range,
            resource: body,
            valueInputOption: "USER_ENTERED"
        }, (err, response) => {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }
            console.log("SUCCESS: Wrote data to spreadsheet.");
        });
    });
}