const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

function createDesktopShortcut() {
  if (process.platform !== 'win32') return;

  try {
    const desktopPath = path.join(os.homedir(), 'Desktop');
    if (!fs.existsSync(desktopPath)) return;

    const repoDir = path.resolve(__dirname, '..');
    const targetExe = path.join(repoDir, 'Civicverse.exe');
    const iconPath = path.join(repoDir, 'app.ico');
    const shortcutPath = path.join(desktopPath, 'Civicverse.lnk');

    // Create Windows shortcut via PowerShell COM object
    const psCommand = `$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('${shortcutPath.replace(/'/g, "''")}'); $s.TargetPath = '${targetExe.replace(/'/g, "''")}'; $s.WorkingDirectory = '${repoDir.replace(/'/g, "''")}'; $s.IconLocation = '${iconPath.replace(/'/g, "''")},0'; $s.Description = 'Civicverse Metaverse Node'; $s.Save();`;

    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand}"`, { stdio: 'ignore' });
    console.log(`\x1b[32m✔ Civicverse Desktop shortcut created on Desktop: ${shortcutPath}\x1b[0m`);
  } catch (err) {
    // Non-fatal if permissions or restricted environment
  }
}

createDesktopShortcut();
