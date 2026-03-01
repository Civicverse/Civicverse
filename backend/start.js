const { spawn } = require('child_process');

function startProcess(command, args, name) {
  const proc = spawn(command, args, { stdio: 'inherit', shell: true });
  proc.on('close', (code) => {
    console.log(`${name} exited with code ${code}`);
  });
  return proc;
}

console.log('Starting Backend Services...');
startProcess('node', ['index.js'], 'API Server');
startProcess('node', ['multiplayer-server.js'], 'Multiplayer Server');
