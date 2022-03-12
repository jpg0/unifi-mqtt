'use strict'

const MQTT_TOPIC = "unifi"

const argv = require('yargs')
    .usage('Usage: $0 --mqtt [mqtt url] --unifi-host [host] --unifi-user [username] --unifi-password [password] [--retain [true/false]]')
    .demandOption(['mqtt', 'unifiHost', 'unifiUser', 'unifiPassword'])
    .env(true)
    .argv;

console.log(argv);

let retain_flag = (argv.retain === "true") ? true:false;

const mqtt_url = argv.mqtt;

var winston = require('winston');

const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.splat(),
        winston.format.simple()
    ),
    transports: [
        new winston.transports.Console()
    ]
});

const mqtt = require('mqtt')
const Unifi = require('unifi-events')

const unifi = new Unifi({
  host: argv.unifiHost,                        // The hostname or ip address of the unifi controller (default: 'unifi')
  port: 443,                           // Port of the unifi controller (default: 8443)
  username: argv.unifiUser,                    // Username (default: 'admin').
  password: argv.unifiPassword,                     // Password (default: 'ubnt').
  site: 'default',                      // The UniFi site to connect to (default: 'default').
  insecure: true,                        // Allow connections if SSL certificate check fails (default: false).
  unifios: true  
});


//todo detect connection failures
let mqttClient = mqtt.connect(mqtt_url)
mqttClient.on('error', function (error) {
    logger.error("Error from mqtt broker: %v", error)
});
mqttClient.on('connect', function (connack) {
    logger.info("Connected to mqtt broker")

    // Listen for any event
    unifi.on('**', function (data) {
      mqttClient.publish(MQTT_TOPIC + "/" + this.event, JSON.stringify(data), {retain:retain_flag})
    });
});
