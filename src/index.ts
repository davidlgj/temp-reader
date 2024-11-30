import { WiFi } from "wifi";
import { I2C } from "i2c";
import { delay, createBlinker } from "./util";
import { SHT30 } from "./sht30";
import { createAPIServer } from "./server";
import storage from "storage";
import { createRelay } from "./relay";

const wifi = new WiFi();
const sht30 = new SHT30(new I2C(0));

const PORT = 80;
const ERROR_WIFI = 2;
const ERROR_RELAY = 3;
const ERROR_SHT30 = 4;
const ERROR_GENERIC = 5;

const storedTemp = parseFloat(storage.getItem("temp") ?? "");
let tempLimit =
  isNaN(storedTemp) || storedTemp < 15 || storedTemp > 24 ? 20 : storedTemp;
console.log("Using temp limit", tempLimit);

const relayHost = storage.getItem("RELAY_HOST") || "192.168.50.202";
const relayPort = parseInt(storage.getItem("RELAY_PORT") || "3000");
console.log("Using relay", relayHost, relayPort);
const relay = createRelay(relayHost, relayPort);

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
  const l = parseFloat(params.limit);
  if (!params.limit || isNaN(l) || l < 15 || l > 24) {
    return { status: 400 };
  }
  tempLimit = l;
  storage.setItem("temp", String(l));
  return { status: 200, body: { limit: l } };
});
server.get("/temp/limit", (params) => {
  return { status: 200, body: { limit: tempLimit } };
});

const blinker = createBlinker();
blinker.start();

// States
type States =
  | { type: "boot" }
  | { type: "main" }
  | { type: "error"; kind: "wifi" | "sht30" | "relay" };
let state: States = { type: "main" };
let temp: number | null = null;

const setError = (kind: "wifi" | "sht30" | "relay") => {
  state = { type: "error", kind };
};

async function mainLoop() {
  console.log("mainloop", state);
  const tick = () => setTimeout(mainLoop, 1000);

  // We should not be in boot, buit let's be safe
  if (state.type === "boot") {
    // TODO: set blinking too boot
    return tick();
  }

  // Main temp reading loop, we just keep trying even if we are in an errored state
  temp = sht30.measureTemp();
  if (temp === null) {
    setError("sht30");
    blinker.setError(ERROR_SHT30);
    return tick();
  }
  console.log("temp", temp);
  // Wifi error is resolved by re-connection logic
  if (state.type !== "error" || state.kind !== "wifi") {
    try {
      if (temp < tempLimit) {
        console.log("calling relay on");
        const res = await relay.on();
        console.log("relay on", res);
      } else {
        console.log("calling relay off");
        const res = await relay.off();
        console.log("relay off", res);
      }

      // Reset any potential error state since all went well
      state = { type: "main" };
      blinker.clearError();

      // When all is well we check in 5 min again
      return setTimeout(mainLoop, 1000 * 60 /*5 * 1000 * 60*/);
    } catch (err: unknown) {
      if (String(err) === "Error: WiFi is not connected.") {
        console.log("Wifi lost connection");
        setError("wifi");
        blinker.setError(ERROR_WIFI);

        // Restart boot again to conmnect
        boot();
        return;
      }

      console.log("Setting relay error");
      setError("relay");
      blinker.setError(ERROR_RELAY);
      return tick();
    }
  }
}

function boot() {
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
    .then(() => {
      // kick off main loop
      state = { type: "main" };
      mainLoop();
    })
    .catch((err: unknown) => {
      console.log("error!", err);
      // TODO: blink more differently depending on error, like not finding plug
      if (String(err) === "Error: WiFi is not connected.") {
        blinker.setError(ERROR_WIFI);
      } else {
        blinker.setError(ERROR_GENERIC);
      }
      // Wait a while and reset stack
      setTimeout(boot, 5000);
    });
}

boot();
