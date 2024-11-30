// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
interface fooII2C {
  /**
   * This method writes data to the specified address (slave device) and returns the number of bytes written. This method can be called only in master mode.
   * @param data Data to write.
   * @param address I2C slave address. (7bit)
   * @param timeout Timeout in milliseconds. Default: 5000.
   * @param count Indicates how many times to write data. Default: 1
   * @returns The number of bytes written, -1 if it failed to write or timeout.
   */
  write(
    data: Uint8Array | string,
    address: number,
    timeout?: number,
    count?: number,
  ): number;

  /**
   * This method read data from the specified address (slave device) and returns an array buffer object. This method can be called only in master mode.
   * @param length Data length to read.
   * @param address I2C slave address. (7bit)
   * @param timeout Timeout in milliseconds. Default: 5000.
   * @returns An array buffer having data read, null if failed to read.
   */
  read(length: number, address: number, timeout?: number): Uint8Array;

  /**
   * This method writes data to the memory address in the specified slave device and returns the number of bytes written. This method can be called only in master mode.
   * @param data Data to write.
   * @param address I2C slave address. (7bit)
   * @param memAddress Memory address to write.
   * @param memAddressSize Size of memAddress. Set 16 when memAddress is 16-bit address, or set 8 if memAddress is 8-bit address. Default: 8.
   * @param timeout Timeout in milliseconds. Default: 5000.
   * @param count Indicates how many times to write data. Default: 1
   * @returns The number of bytes written, -1 if failed to write or timeout.
   */
  memWrite(
    data: Uint8Array | string,
    address: number,
    memAddress: number,
    memAddressSize?: number,
    timeout?: number,
    count?: number,
  ): number;

  /**
   * This method read data at memory address from the specified slave device and returns an array buffer object. This method can be called only in master mode.
   * @param length Data length to read.
   * @param address I2C slave address. (7bit)
   * @param memAddress Memory address to read.
   * @param memAddressSize Size of memAddress. Set 16 when memAddress is 16-bit address, or set 8 when memAddress is 8-bit address. Default: 8.
   * @param timeout Timeout in milliseconds. Default: 5000
   * @returns A buffer having data read, null if failed to read.
   */
  memRead(
    length: number,
    address: number,
    memAddress: number,
    memAddressSize?: number,
    timeout?: number,
  ): Uint8Array;

  /**
   * This method closes the I2C bus.
   */
  close(): void;
}

interface ConnectInfo {
  ssid: string;
  password?: string;
  bssid?: string;
  security?: "OPEN" | "WPA2_WPA_PSK" | "WPA2_PSK" | "WPA_PSK" | "WEP_PSK";
  enforce?: boolean;
}

interface IWiFi {
  connect(
    info: ConnectInfo,
    callback: (err: null | unknown, info: ConnectInfo) => void,
  ): void;
  disconnect(callback: (err: null | unknown) => void): void;
  reset(callback: (err: null | unknown) => void): void;
  getConnection(
    callback: (
      err: null | unknown,
      info: Pick<ConnectInfo, "ssid" | "bssid"> | {} | null,
    ) => void,
  ): void;
}

declare module "wifi" {
  class WiFi implements IWiFi {
    /** @inheritdoc */
    connect(
      info: ConnectInfo,
      callback: (err: null | unknown, info: ConnectInfo) => void,
    ): void;
    /** @inheritdoc */
    disconnect(callback: (err: null | unknown) => void): void;
    /** @inheritdoc */
    reset(callback: (err: null | unknown) => void): void;
    /** @inheritdoc */
    getConnection(
      callback: (
        err: null | unknown,
        info: Pick<ConnectInfo, "ssid" | "bssid"> | {} | null,
      ) => void,
    ): void;
  }
}

interface IPicoCYW43 {
  putGpio(pin: number, on: boolean): void;
}

declare module "pico_cyw43" {
  class PicoCYW43 implements IPicoCYW43 {
    /** @inheritdoc */
    putGpio(pin: number, on: boolean): void;
  }
}

declare module "http" {
  class OutgoingMessage {
    headers: Record<string, string>;
    headersSent: boolean;
    setHeader(name: string, value: string): void;
    getHeader(name: string): string;
    removeHeader(name: string): void;
  }

  class ServerResponse extends OutgoingMessage {
    writeHead(
      statusCode: number,
      statusMessage?: string,
      headers?: Record<string, string>,
    ): ServerResponse;
    write(chunk: Uint8Array | string, callback?: () => void): boolean;
    end(chunk?: Uint8Array | string, callback?: () => void): boolean;
  }

  class Server {
    listen(port: number, callback?: () => void): void;
    close(callback?: () => void): void;
  }

  class IncomingMessage {
    httpVersion: "1.1" | "1.0";
    method: string;
    statusCode: number;
    headers: Record<string, string>;
    url: string;
    complete: boolean;

    // TODO: should be from readable
    on(event: "data", callback: (chunk: Uint8Array) => void): void;
    on(event: "end" | "close", callback: () => void): void;
  }

  class ClientRequest extends OutgoingMessage {
    write(chunk: Uint8Array | string, callback?: () => void): boolean;
    end(chunk: Uint8Array | string, callback?: () => void): this;

    // TODO: should be from writble
    on(event: "error", callback: () => void): void;
  }

  function createServer(
    listener: (req: IncomingMessage, res: ServerResponse) => void,
  ): Server;

  function get(
    options: {
      host: string;
      port: number;
      path?: string;
      headers?: Record<string, string>;
    },
    callback?: (response: IncomingMessage) => void,
  ): ClientRequest;
}

declare module "storage" {
  const Storage: {
    length: number;
    setItem(key: string, value: string): void;
    getItem(key: string): null | string;
    removeItem(key: string): void;
    clear(): void;
    key(index: number): null | string;
  };

  export default Storage;
}
