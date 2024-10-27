import { WiFi } from "wifi";
import { I2C } from "i2c";
import { delay, blink } from "./util";
import { SHT30 } from "./sht30";
import { createAPIServer } from "./server";

const wifi = new WiFi();
const sht30 = new SHT30(new I2C(0));

// wifi.connect(
//   {
//     ssid: "",
//     password: "",
//     // security: "WPA2_WPA_PSK",
//     enforce: true,
//   },
//   (err, info) => {
//     console.log("connect", err, info, http);

//     let server;
//     try {
//       server = http.createServer((req, res) => {
//         console.log("Request path: " + req.url);
//         let message = JSON.stringify({ hello: "world" });
//         res.writeHead(200, "OK", {
//           "Content-Type": "application/json",
//           "Content-Length": message.length,
//         });
//         res.write(message);
//         res.end();
//       });

//       server.listen(80, function () {
//         console.log("HTTP server listening on port: " + 80);
//       });
//     } catch (err) {
//       console.log("error", err);
//     }
//   },
// );

const PORT = 80;

// wifi.on("associated", (ev) => console.log("associated", ev));
// wifi.on("connected", (ev) => console.log("connected", ev));
// wifi.on("disconnected", (ev) => console.log("disconnected", ev));

const reset = () =>
  new Promise<void>((resolve, reject) =>
    wifi.reset((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    }),
  );

// const scan = () =>
//   new Promise<void>((resolve, reject) =>
//     wifi.scan((err, results) => {
//       if (err) {
//         reject(err);
//       } else {
//         console.log(results);
//         results.sort((a, b) => Math.abs(a.rssi) - Math.abs(b.rssi));
//         const net = results.find((s) => s.ssid === "jensen");
//         console.log("choosing", net);
//         resolve();
//       }
//     }),
//   );

const connect = () => {
  console.log("connecting to wifi");
  return new Promise<void>((resolve, reject) =>
    wifi.connect(
      {
        ssid: "",
        password: "",
        // security,
        // security: "WPA2_WPA_PSK",
        enforce: true,
        // bssid,
      },
      (err, info) => {
        console.log("wifi result", err, info);
        if (err) {
          console.log("wifi connect error", err);
          reject(err);
        } else {
          resolve();
        }
      },
    ),
  );
};

// const server = () => {
//   const server = http.createServer((req, res) => {
//     console.log("Request path: " + req.url);
//     let message = JSON.stringify({ hello: "world" });
//     res.writeHead(200, "OK", {
//       "Content-Type": "application/json",
//       "Content-Length": message.length,
//     });
//     res.write(message);
//     res.end();
//   });

//   server.listen(PORT, function () {
//     console.log("HTTP server listening on port: " + PORT);
//   });
//};

const server = createAPIServer();

server.get("/hello", () => ({ status: 200, body: "<h1>Hello world</h1>" }));
server.get("/temp", () => {
  console.log("read temp call");
  const t = sht30.measureTemp();
  return { status: 200, body: { t } };
});
server.get("/temp/limit/:limit", (params) => {
  console.log("setting limit?", params.limit);
  if (!params.limit) {
    return { status: 400 };
  }
  return { status: 200, body: { limit: params.limit } };
});

let blinkSpeed = 5000;
const blinkit = async () => {
  await blink(1000);
  setTimeout(blinkit, blinkSpeed);
};

// Main
connect()
  // My Asus router seems to do stuff so we loose connection, maybe moving connection to closer
  // mesh node. W/o this delay the server won't get connected...
  .then(() => delay(10000))
  .then(() => {
    server.listen(PORT, () => {
      blinkit();
      console.log("HTTP server listening on port: " + PORT);
    });
  })
  .catch((err) => {
    console.log("error!", err);
    blinkSpeed = 1000;
    // TODO: listen to 'Error: WiFi is not connected.' and reboot/re-connect
  });
