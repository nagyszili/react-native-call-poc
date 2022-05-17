const TYPES = {
  DEBUG: "debug",
  INFO: "info",
  SUCCESS: "success",
  ERROR: "error",
};

const log = (type, ...args) => {
  // Log only in dev mode

  //   if (!__DEV__ && type !== TYPES.ERROR) {
  //     return;
  //   }

  switch (type) {
    case TYPES.DEBUG: {
      console.log(...args);
      break;
    }
    case TYPES.INFO: {
      const [title, ...rest] = args;
      console.log("\x1b[36m", title, "\x1b[0m", ...rest);
      break;
    }
    case TYPES.SUCCESS: {
      const [title, ...rest] = args;
      console.log("\x1b[32m", title, "\x1b[0m", ...rest);
      break;
    }
    case TYPES.ERROR: {
      const [title, ...rest] = args;
      if (__DEV__) {
        console.log("\x1b[31m", title, "\x1b[0m", ...rest);
      } else {
        // Sentry.captureException(args);
      }
      break;
    }
  }
};

const Logger = {
  debug: (...args) => log(TYPES.DEBUG, ...args),
  info: (...args) => log(TYPES.INFO, ...args),
  success: (...args) => log(TYPES.SUCCESS, ...args),
  error: (...args) => log(TYPES.ERROR, ...args),
};

export default Logger;
