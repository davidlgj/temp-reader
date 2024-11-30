import { get, IncomingMessage } from "http";

const REQ_TIMEOUT = 20 * 1000; // 1 minute timeout

const decoder = new TextDecoder();

export function createRelay(host: string, port = 80) {
  // TODO: add timeoout?
  const call = (state: "on" | "off"): Promise<string> =>
    new Promise((resolve, reject) => {
      let alive = true;
      let body = "";
      let response: IncomingMessage | null = null;
      let timer: ReturnType<typeof setTimeout>;

      const req = get(
        {
          host,
          port,
          path: "/" + state,
          headers: {
            // THIS IS IMPORTANT: HTTP/1.1 requires Host header
            Host: host + ":" + port,
          },
        },
        (res) => {
          response = res;
          console.log("got res!", res.statusCode);
          if (res.statusCode !== 200) {
            alive = false;
            clearTimeout(timer);
            reject(res.statusCode);
            return;
          }
          res.on("close", () => {
            console.log("res close", alive, body);
            if (alive) {
              alive = false;
              clearTimeout(timer);
              resolve(body);
            }
          });
          // Res 'end' event doesn't happen 🤔
          // res.on("end", () => {
          //   console.log("end", alive, body);
          //   if (alive) {
          //     alive = false;
          //     resolve(body);
          //   }
          // });
          res.on("data", (chunk) => {
            console.log("got data", decoder.decode(chunk));
            body += decoder.decode(chunk);
          });
        },
      );
      req.on("error", () => {
        console.log("request error", alive);
        if (alive) {
          alive = false;
          clearTimeout(timer);
          reject("error");
        }
      });

      // Set a timeout on the request, we seem to hang otherwise
      timer = setTimeout(() => {
        console.log("request timed out");
        alive = false;
        // TODO fix proper typing
        req.removeAllListeners(); // from EventEmitter
        req.destroy(); // from  _Stream
        if (response) {
          response.removeAllListeners();
          response.destroy();
        }
        reject("timeout");
      }, REQ_TIMEOUT);
    });

  return {
    on() {
      return call("on");
    },
    off() {
      return call("off");
    },
  };
}
