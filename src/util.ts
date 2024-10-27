import { PicoCYW43 } from "pico_cyw43";

const pico_cyw43 = new PicoCYW43();

export const delay = (duration: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, duration));

export const blink = (duration: number) =>
  new Promise<void>((resolve) => {
    pico_cyw43.putGpio(0, true);
    setTimeout(() => {
      pico_cyw43.putGpio(0, false);
      resolve();
    }, duration);
  });
