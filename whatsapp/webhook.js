/*
 * Starter Project for WhatsApp Echo Bot Tutorial
 *
 * Remix this as the starting point for following the WhatsApp Echo Bot tutorial
 *
 */

"use strict";

// Access token for your app
// (copy token from DevX getting started page
// and save it as environment variable into the .env file)
const token = process.env.WHATSAPP_TOKEN;

// Imports dependencies and set up http server
const request = require("request"),
    express = require("express"),
    body_parser = require("body-parser"),
    axios = require("axios").default,
    app = express().use(body_parser.json()); // creates express http server

const mysql = require('mysql')
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'anilzkau_wa',
    password: 'JMPSahvn@2119',
    database: 'anilzkau_whatsapp'
})

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

// Accepts POST requests at /webhook endpoint
app.post("/app/webhook", (req, res) => {
    // Parse the request body from the POST
    let body = req.body;
    //console.log(body);
    // Check the Incoming webhook message
    //console.log(JSON.stringify(req.body, null, 2));

    // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
    if (req.body.object) {
        connection.connect()

        let sql1 = `INSERT INTO body (body) VALUES ('${JSON.stringify(req.body.entry)}')`;
          connection.query(sql1, (err, rows, fields) => {
              if (err) throw err
              //console.log('The solution is: ', rows[0].solution)
          })
        if (req.body.entry && req.body.entry.length > 0) {
            const entries = req.body.entry;
            const entriesLength = entries.length;
            for (let i = 0; i < entriesLength; i++) {
                if (entries[i].changes && entries[i].changes.length > 0) {
                    const changes = entries[i].changes;
                    const changesLength = changes.length;
                    for (let j = 0; j < changesLength; j++) {

                        if (changes[j] && changes[j].value.messages) {
                            let messages = changes[j].value.messages;
                            let messageLength = messages.length;
                            let phone_number_id = changes[j].value.metadata.phone_number_id;

                            for(let k=0; k < messageLength; k++) {

                                let from = messages[k].from; // extract the phone number from the webhook payload
                                let msg_body = messages[k].text.body; // extract the message text from the webhook payload

                                let sql = `INSERT INTO webhook (phone, message) VALUES ('${from}','${msg_body}')`;

                                connection.query(sql, (err, rows, fields) => {
                                    if (err) throw err
                                    //console.log('The solution is: ', rows[0].solution)
                                })
                            }


                            if(changes[j].value.contacts && changes[j].value.contacts[0].wa_id) {
                                let info = changes[j].value.contacts[0];
                                let reply_body = `Thank you ${info.profile.name}, for your message, we will get back shortly`;
                                axios({
                                    method: "POST", // Required, HTTP method, a string, e.g. POST, GET
                                    url:
                                        "https://graph.facebook.com/v13.0/" +
                                        phone_number_id +
                                        "/messages?access_token=" +
                                        token,
                                    data: {
                                        messaging_product: "whatsapp",
                                        to: info.wa_id,
                                        text: { body: reply_body },
                                    },
                                    headers: { "Content-Type": "application/json" },
                                });
                            }
                        }

                        //status
                        if (changes[j] && changes[j].value.statuses) {
                            let statuses = changes[j].value.statuses;
                            let statusesLength = statuses.length;

                            for(let s=0; s < statusesLength; s++) {

                                let from = statuses[s].recipient_id; // extract the phone number from the webhook payload
                                let stat = statuses[s].status; // extract the message text from the webhook payload

                                let sql = `INSERT INTO seen (phone, status) VALUES ('${from}','${stat}')`;

                                connection.query(sql, (err, rows, fields) => {
                                    if (err) throw err
                                    //console.log('The solution is: ', rows[0].solution)
                                })
                            }

                        }
                    }
                }
            }
        }
        connection.end()
        res.sendStatus(200);
    } else {
        // Return a '404 Not Found' if event is not from a WhatsApp API
        res.sendStatus(404);
    }
});

app.get("/app/check", (req, res) => {
    console.log("console happens");
    res.status(200).send("working");
});

// Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/app/webhook", (req, res) => {
    /**
     * UPDATE YOUR VERIFY TOKEN
     *This will be the Verify Token value when you set up webhook
    **/
    const verify_token = process.env.VERIFY_TOKEN;

    // Parse params from the webhook verification request
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];

    // Check if a token and mode were sent
    if (mode && token) {
        // Check the mode and token sent are correct
        if (mode === "subscribe" && token === verify_token) {
            // Respond with 200 OK and challenge token from the request
            console.log("WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});
