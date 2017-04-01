var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var moment = require('moment');
var SpeedTest = require('speedtest-net');

validateEnvironment();
const SHEET_ID = process.env.SHEET_ID;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_DIR = (process.env.TOKEN_DIR || process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';

const SPEED_TEST_INTERVAL_MIN = process.env.SPEED_TEST_INTERVAL_MIN || 15;

console.log("Authorizing...");
authorize(appendSheetItems);
const WAIT_MS = SPEED_TEST_INTERVAL_MIN * 60 * 1000;
setInterval(() => {
        // Authorize a client with the loaded credentials, then call the
        // Google Sheets API.
        console.log("Authorizing...");
        authorize(appendSheetItems);
    }, WAIT_MS);

function validateEnvironment(){
    var clientSecret = process.env.CLIENT_SECRET;
    var clientId = process.env.CLIENT_ID;
    var redirectUrl = process.env.REDIRECT_URI;
    var sheetId = process.env.SHEET_ID;

    if(!clientSecret){
        console.error("ERROR: CLIENT_SECRET is not set.");
        process.exit(1);
    } else if(!clientId) {
        console.error("ERROR: CLIENT_ID is not set.");
        process.exit(1);
    } else if(!redirectUrl) {
        console.error("ERROR: REDIRECT_URI is not set.");
        process.exit(1);
    } else if(!sheetId) {
        console.error("ERROR: SHEET_ID is not set.");
        process.exit(1);
    }
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(callback) {
    var clientSecret = process.env.CLIENT_SECRET;
    var clientId = process.env.CLIENT_ID;
    var redirectUrl = process.env.REDIRECT_URI;
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