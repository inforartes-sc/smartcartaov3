import { execSync } from 'child_process';

const PORT = 3000;

try {
  console.log(`Checking for processes on port ${PORT}...`);
  const output = execSync(`netstat -ano | findstr :${PORT}`).toString();
  const lines = output.split('\n');
  const pids = new Set();

  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length > 4) {
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && !isNaN(pid)) {
        pids.add(pid);
      }
    }
  });

  if (pids.size > 0) {
    pids.forEach(pid => {
      try {
        console.log(`Killing process ${pid}...`);
        execSync(`taskkill /F /PID ${pid}`);
      } catch (e) {
        console.error(`Failed to kill process ${pid}: ${e.message}`);
      }
    });
    console.log('Port cleaned up.');
  } else {
    console.log(`No processes found on port ${PORT}.`);
  }
} catch (e) {
  console.log(`Port ${PORT} is already free or no process found.`);
}
