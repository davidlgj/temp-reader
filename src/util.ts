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

export function createBlinker() {
  let error: null | number;
  let timeout: null | ReturnType<typeof setTimeout> = null;

  const blinkit = async () => {
    if (error === null) {
      // 1s lightup, all is OK
      await blink(1000);
    } else {
      // Blink "error" nr of times
      for (let i = 0; i++; i < error) {
        await blink(500);
        await delay(500);
      }
    }
    // 4s between blinks
    timeout = setTimeout(blinkit, 4000);
  };

  // Start normal blinking
  const setError = (err: null | number) => {
    error = err;
  };

  return {
    start: blinkit,
    setError,
    clearError: () => setError(null),
  };
}
