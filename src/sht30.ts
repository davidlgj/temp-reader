const SHT30_DEFAULT_ADDRESS = 0x44;

export class SHT30 {
  i2c: II2C;
  address: number;

  constructor(i2c: II2C, address = SHT30_DEFAULT_ADDRESS) {
    this.i2c = i2c;
    this.address = address;
  }

  measureTemp() {
    // With clock stretching and medium repeatability
    const command = new Uint8Array(2);
    command[0] = 0x2c;
    command[1] = 0x0d;

    const written = this.i2c.write(command, this.address);

    if (written !== 2) {
      console.log("failed to write", written);
      return null;
    }

    //await delay(1); TODO: is this needed? Don't think so!
    var buf = this.i2c.read(3 /* 8 MSB, 8 LSB, 8 CRC */, SHT30_DEFAULT_ADDRESS);
    if (buf && buf.length === 3) {
      // console.log("read data");
      // console.log(buf);

      // First two values as MSB LSB of temp,
      const value8 = new Uint8Array([buf[0], buf[1]]);

      // CRC checksum calculation
      const crcVal = this.crc(value8);

      if (crcVal !== buf[2]) {
        console.log("CRC checksum failed", crcVal, buf[2]);
        return null;
      }

      // i2c is big endian, starting with msb, pico is little, so we reverse the bytes.
      value8.reverse();
      const value = new Int16Array(value8.buffer);
      const temp = this.toC(value[0]);

      console.log(value);
      // console.log(`Temp is ${temp}°C`);
      return temp;
    } else {
      console.log("Failed to read");
      return null;
    }
  }

  toC(measure: number) {
    // From datasheet
    return -45 + 175 * (measure / 65535);
  }

  crc(data: Uint8Array) {
    let crc = 0xff;
    for (const byte of data) {
      crc ^= byte;

      for (let i = 0; i < 8; i++) {
        if (crc & 0x80) {
          crc <<= 1;
          crc ^= 0x131;
        } else {
          crc <<= 1;
        }
      }
    }
    return crc;
  }
}
