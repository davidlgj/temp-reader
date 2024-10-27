import { WiFi } from "wifi";
import { I2C } from "i2c";
import { delay, createBlinker } from "./util";
import { SHT30 } from "./sht30";
import { createAPIServer } from "./server";
import storage from "storage";

const wifi = new WiFi();
const sht30 = new SHT30(new I2C(0));

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

const connect = () => {
  console.log("connecting to wifi");
  return new Promise<void>((resolve, reject) =>
    wifi.connect(
      {
        ssid: storage.getItem("ssid") as string,
        password: storage.getItem("passwd") as string,
        enforce: true,
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

// Main
const blinker = createBlinker();
blinker.start();

function main() {
  connect()
    // My Asus router seems to do stuff so we loose connection, maybe moving connection to closer
    // mesh node. W/o this delay the server won't get connected...
    .then(() => delay(10000))
    .then(() => {
      server.listen(PORT, () => {
        blinker.clearError(); // if this is not the first time, we clear error.
        console.log("HTTP server listening on port: " + PORT);
      });
    })
    .catch((err: unknown) => {
      console.log("error!", err);
      // TODO: blink more differently depending on error, like not finding plug
      if (String(err) === "Error: WiFi is not connected.") {
        blinker.setError(5);
      } else {
        blinker.setError(3);
      }

      // Wait a while and reset stack
      setTimeout(main, 5000);
    });
}

main();
