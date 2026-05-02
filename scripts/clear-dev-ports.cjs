const { execSync } = require("child_process");

const ports = process.argv.slice(2).length ? process.argv.slice(2) : ["5173", "4000"];

for (const port of ports) {
  try {
    const output = execSync("netstat -ano", { encoding: "utf8" });
    const pids = new Set();

    for (const line of output.split(/\r?\n/)) {
      if (!line.includes(`:${port}`) || !line.includes("LISTENING")) continue;
      const pid = line.trim().split(/\s+/).pop();
      if (/^\d+$/.test(pid)) pids.add(pid);
    }

    if (pids.size === 0) {
      console.log(`Port ${port} is free`);
      continue;
    }

    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        console.log(`Stopped PID ${pid} on port ${port}`);
      } catch {
        console.log(`Could not stop PID ${pid} on port ${port}`);
      }
    }
  } catch (error) {
    console.log(`Could not inspect port ${port}: ${error.message}`);
  }
}
