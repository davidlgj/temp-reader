import { statusCodes } from "./statusCodes";
import { createServer } from "http";

const routeRegExp = new RegExp("(:[a-zA-Z]+)", "g");

type RouteMatcher = (url: string) => null | Record<string, string>;
type RouteHandler = (params: Record<string, string>) => {
  status: keyof typeof statusCodes;
  body?: string | object;
};

type Route = {
  matcher: RouteMatcher;
  handler: RouteHandler;
};

/**
 * Create a matching function
 * @param {string} route
 * @return {(url: string): null | Record<string,string>} a fucntion to match an url. The matcher will return null or an object of params if matching
 */
const routeToMatcher = (route: string): RouteMatcher => {
  const matches = route.match(routeRegExp);
  if (matches) {
    const re = new RegExp(route.replace(routeRegExp, "([^/]+)"));
    return function (url: string) {
      console.log("match url", route);
      const m = url.match(re);
      if (!m || m.length !== matches.length) {
        console.log("no match");
        return null;
      }
      const params: Record<string, string> = {};
      const len = m.length;
      for (let i = 0; i < len; i++) {
        console.log("loop", i, len);
        params[matches[i].substring(1)] = m[i];
      }

      return params;
    };
  }
  return function (url) {
    if (url === route) {
      return {};
    }
    return null;
  };
};

export const createAPIServer = () => {
  let routes: Route[] = [];

  const server = createServer((req, res) => {
    try {
      console.log("Request path: " + req.url, req.method, routes.length);

      let params = null;
      let result: ReturnType<RouteHandler> = {
        status: 404,
        body: "404 Not Found",
      };
      for (const route of routes) {
        console.log("loop");
        params = route.matcher(req.url);
        if (params) {
          result = route.handler(params);
          console.log("found matching route", req.url);
          break;
        }
      }
      console.log("result of matcher", result);

      let message;
      if (result.status === 200 && typeof result.body === "string") {
        message = result.body;
        res.writeHead(200, statusCodes["200"], {
          "Content-Type": "text/html",
          "Content-Length": String(message.length),
        });
        res.write(message);
      } else if (result.status === 200) {
        message = JSON.stringify(result.body);
        res.writeHead(200, statusCodes["200"], {
          "Content-Type": "application/json",
          "Content-Length": String(message.length),
        });
        res.write(message);
      } else if (result.body) {
        // Error messages
        message = "";
        message =
          "<!DOCTYPE html><head><style>body{background-color:#483D8B;color:white;font-size:50px;font-family:sans-serif;display:flex;justify-content:center;align-items:center;width:100vw;height:100vh;}</style></head><body>" +
          result.body +
          "</body></html>";
        res.writeHead(result.status, statusCodes[result.status], {
          "Content-Type": "text/html",
          "Content-Length": String(message.length),
        });
        res.write(message);
      } else {
        res.writeHead(result.status, statusCodes[result.status]);
      }
      console.log("end!");
    } catch (err) {
      console.error(err);
    }
    res.end();
  });

  return {
    /** Only handle GET requests for now, actually we don't even check 🙈
     * @param {string} route A route with optional variables in `:variablename` form, e.g. `/set/:id/:name`
     * @param {RouteHandler} A route handling function, gets parsed params and should return an object
     *   with a HTTP status code and in case of 200 a property `body`, if it's a string its assumed to html, if not it's assumed to be JSON and is stringified before sending */
    get(route: string, handler: RouteHandler) {
      routes.push({
        matcher: routeToMatcher(route),
        handler,
      });
    },
    listen(port: number, callback?: () => void) {
      server.listen(port, callback);
    },
  };
};
