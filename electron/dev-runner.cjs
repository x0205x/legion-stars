/**
 * Starts Vite then launches Electron once the dev server is up.
 * Usage: node electron/dev-runner.cjs
 */
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const root = path.join(__dirname, "..");
const url = "http://127.0.0.1:5173";
let electronProc = null;

function waitForServer(retries = 60) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const tick = () => {
      http
        .get(url, (res) => {
          res.resume();
          resolve();
        })
        .on("error", () => {
          n += 1;
          if (n >= retries) reject(new Error("Vite dev server did not start"));
          else setTimeout(tick, 500);
        });
    };
    tick();
  });
}

const vite = spawn("npm", ["run", "dev"], {
  cwd: root,
  shell: true,
  stdio: "inherit",
  env: { ...process.env, VITE_DEV_SERVER_URL: url },
});

vite.on("exit", (code) => {
  if (electronProc) electronProc.kill();
  process.exit(code ?? 0);
});

waitForServer()
  .then(() => {
    electronProc = spawn("npx", ["electron", "."], {
      cwd: root,
      shell: true,
      stdio: "inherit",
      env: { ...process.env, VITE_DEV_SERVER_URL: url },
    });
    electronProc.on("exit", () => {
      vite.kill();
      process.exit(0);
    });
  })
  .catch((err) => {
    console.error(err);
    vite.kill();
    process.exit(1);
  });

process.on("SIGINT", () => {
  vite.kill();
  if (electronProc) electronProc.kill();
  process.exit(0);
});
