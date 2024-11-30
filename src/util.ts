import { PicoCYW43 } from "pico_cyw43";

const pico_cyw43 = new PicoCYW43();

export const delay = (duration: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, duration));

// export const blink = (duration: number) =>
//   new Promise<void>((resolve) => {
//     pico_cyw43.putGpio(0, true);
//     setTimeout(() => {
//       pico_cyw43.putGpio(0, false);
//       resolve();
//     }, duration);
//   });

export function createBlinker() {
  let error: null | number = null;
  let timeout: null | ReturnType<typeof setTimeout> = null;
  let isLedOn = false;
  let blinkCount = 0;

  const on = () => {
    isLedOn = true;
    pico_cyw43.putGpio(0, true);
  };
  const off = () => {
    isLedOn = false;
    pico_cyw43.putGpio(0, false);
  };
  // Make sure we start with off.
  off();

  const blinkit = () => {
    if (error === null) {
      // 1s lightup, all is OK
      if (isLedOn) {
        off();
      } else {
        on();
        timeout = setTimeout(blinkit, 1000);
        return;
      }
    } else {
      // Blink "error" nr of times
      if (isLedOn) {
        off();
      } else {
        on();
      }

      // Did a modulo first, but I just kept getting "infinity"
      if (blinkCount > (error - 1) * 2) {
        blinkCount = 0;
        // Were done fast blinking, time for a longer blink so we can actually see the code
        timeout = setTimeout(blinkit, 2000);
        return;
      }
      blinkCount++;
      timeout = setTimeout(blinkit, 300);
      return;
    }
    // Normal loop fallback
    // 4s between blinks
    timeout = setTimeout(blinkit, 4000);
  };

  // Start blinking an error
  const setError = (err: null | number) => {
    if (timeout !== null && err === error) {
      // We're already blinking this error
      return;
    }
    // Turn off and interrupt normal blinking
    off();
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    error = err;
    blinkCount = 0;
    // Start it off again
    blinkit();
  };

  return {
    start: blinkit,
    setError,
    clearError: () => setError(null),
  };
}
