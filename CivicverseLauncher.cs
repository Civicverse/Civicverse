using System;
using System.IO;
using System.Diagnostics;
using System.Threading;
using System.Drawing;
using System.Windows.Forms;
using System.Net;
using System.Net.Sockets;
using System.Collections.Generic;

namespace CivicverseLauncher
{
    public class LauncherForm : Form
    {
        private string repoDir;
        private string nodeExe;
        
        private Process backendProcess;
        private Process multiplayerProcess;
        private Process frontendProcess;
        
        private NotifyIcon trayIcon;
        private ContextMenuStrip trayMenu;
        
        private Label lblTitle;
        private Label lblSubtitle;
        private Label lblStatus;
        private Panel panelStatus;
        
        private Label lblApiStatus;
        private Label lblMpStatus;
        private Label lblWebStatus;
        
        private Button btnOpenBrowser;
        private Button btnRestart;
        private Button btnToggleLogs;
        private Button btnExit;
        
        private TextBox txtLogs;
        private System.Windows.Forms.Timer statusTimer;
        private bool isExiting = false;
        private bool browserOpened = false;

        public LauncherForm()
        {
            InitializeComponent();
            LocateEnvironment();
            EnsureDesktopShortcut();
            StartServices();
        }

        private void InitializeComponent()
        {
            this.Text = "Civicverse Node Launcher";
            this.Size = new Size(680, 520);
            this.MinimumSize = new Size(580, 420);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(11, 14, 20); // #0B0E14
            this.ForeColor = Color.FromArgb(240, 246, 252);
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            // Try loading app icon
            string iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "app.ico");
            if (!File.Exists(iconPath))
            {
                string candidate = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Civicverse", "app.ico");
                if (File.Exists(candidate)) iconPath = candidate;
            }
            if (File.Exists(iconPath))
            {
                try { this.Icon = new Icon(iconPath); } catch { }
            }

            // Top Header Panel
            Panel pnlHeader = new Panel();
            pnlHeader.Dock = DockStyle.Top;
            pnlHeader.Height = 85;
            pnlHeader.BackColor = Color.FromArgb(18, 22, 32);
            pnlHeader.Padding = new Padding(20, 15, 20, 10);
            this.Controls.Add(pnlHeader);

            lblTitle = new Label();
            lblTitle.Text = "CIVICVERSE METAVERSE NODE";
            lblTitle.Font = new Font("Segoe UI", 14f, FontStyle.Bold);
            lblTitle.ForeColor = Color.FromArgb(179, 102, 255); // Neon Purple
            lblTitle.AutoSize = true;
            lblTitle.Location = new Point(20, 12);
            pnlHeader.Controls.Add(lblTitle);

            lblSubtitle = new Label();
            lblSubtitle.Text = "Decentralized Autonomous Metaverse & Identity Protocol";
            lblSubtitle.Font = new Font("Segoe UI", 8.5f, FontStyle.Regular);
            lblSubtitle.ForeColor = Color.FromArgb(139, 148, 158);
            lblSubtitle.AutoSize = true;
            lblSubtitle.Location = new Point(22, 40);
            pnlHeader.Controls.Add(lblSubtitle);

            lblStatus = new Label();
            lblStatus.Text = "● Initializing...";
            lblStatus.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            lblStatus.ForeColor = Color.FromArgb(234, 179, 8); // Yellow
            lblStatus.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            lblStatus.AutoSize = true;
            lblStatus.Location = new Point(540, 16);
            pnlHeader.Controls.Add(lblStatus);

            // Main Status Container
            panelStatus = new Panel();
            panelStatus.Dock = DockStyle.Top;
            panelStatus.Height = 110;
            panelStatus.Padding = new Padding(20, 12, 20, 10);
            this.Controls.Add(panelStatus);

            TableLayoutPanel tableServices = new TableLayoutPanel();
            tableServices.Dock = DockStyle.Fill;
            tableServices.ColumnCount = 3;
            tableServices.RowCount = 1;
            tableServices.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33.33f));
            tableServices.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33.33f));
            tableServices.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33.33f));
            panelStatus.Controls.Add(tableServices);

            lblWebStatus = CreateServiceCard("Web Frontend", "http://localhost:3000", "Starting...");
            lblApiStatus = CreateServiceCard("Backend API", "http://localhost:3003", "Starting...");
            lblMpStatus = CreateServiceCard("Multiplayer & Foyer", "ws://localhost:8080", "Starting...");

            tableServices.Controls.Add(lblWebStatus.Parent, 0, 0);
            tableServices.Controls.Add(lblApiStatus.Parent, 1, 0);
            tableServices.Controls.Add(lblMpStatus.Parent, 2, 0);

            // Action Buttons Panel
            Panel pnlButtons = new Panel();
            pnlButtons.Dock = DockStyle.Top;
            pnlButtons.Height = 60;
            pnlButtons.Padding = new Padding(20, 5, 20, 10);
            this.Controls.Add(pnlButtons);

            btnOpenBrowser = new Button();
            btnOpenBrowser.Text = "🚀 Open Civicverse (Browser)";
            btnOpenBrowser.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
            btnOpenBrowser.BackColor = Color.FromArgb(124, 58, 237); // Purple 600
            btnOpenBrowser.ForeColor = Color.White;
            btnOpenBrowser.FlatStyle = FlatStyle.Flat;
            btnOpenBrowser.FlatAppearance.BorderSize = 0;
            btnOpenBrowser.Size = new Size(240, 42);
            btnOpenBrowser.Location = new Point(20, 5);
            btnOpenBrowser.Cursor = Cursors.Hand;
            btnOpenBrowser.Click += (s, e) => OpenCivicverseInBrowser();
            pnlButtons.Controls.Add(btnOpenBrowser);

            btnRestart = new Button();
            btnRestart.Text = "🔄 Restart";
            btnRestart.Font = new Font("Segoe UI", 9f, FontStyle.Regular);
            btnRestart.BackColor = Color.FromArgb(30, 41, 59);
            btnRestart.ForeColor = Color.FromArgb(226, 232, 240);
            btnRestart.FlatStyle = FlatStyle.Flat;
            btnRestart.FlatAppearance.BorderSize = 1;
            btnRestart.FlatAppearance.BorderColor = Color.FromArgb(51, 65, 85);
            btnRestart.Size = new Size(110, 42);
            btnRestart.Location = new Point(270, 5);
            btnRestart.Cursor = Cursors.Hand;
            btnRestart.Click += (s, e) => RestartServices();
            pnlButtons.Controls.Add(btnRestart);

            btnToggleLogs = new Button();
            btnToggleLogs.Text = "📜 Logs";
            btnToggleLogs.Font = new Font("Segoe UI", 9f, FontStyle.Regular);
            btnToggleLogs.BackColor = Color.FromArgb(30, 41, 59);
            btnToggleLogs.ForeColor = Color.FromArgb(226, 232, 240);
            btnToggleLogs.FlatStyle = FlatStyle.Flat;
            btnToggleLogs.FlatAppearance.BorderSize = 1;
            btnToggleLogs.FlatAppearance.BorderColor = Color.FromArgb(51, 65, 85);
            btnToggleLogs.Size = new Size(95, 42);
            btnToggleLogs.Location = new Point(390, 5);
            btnToggleLogs.Cursor = Cursors.Hand;
            btnToggleLogs.Click += (s, e) => ToggleLogs();
            pnlButtons.Controls.Add(btnToggleLogs);

            btnExit = new Button();
            btnExit.Text = "🛑 Stop & Exit";
            btnExit.Font = new Font("Segoe UI", 9f, FontStyle.Regular);
            btnExit.BackColor = Color.FromArgb(40, 20, 24);
            btnExit.ForeColor = Color.FromArgb(248, 113, 113);
            btnExit.FlatStyle = FlatStyle.Flat;
            btnExit.FlatAppearance.BorderSize = 1;
            btnExit.FlatAppearance.BorderColor = Color.FromArgb(127, 29, 29);
            btnExit.Size = new Size(120, 42);
            btnExit.Location = new Point(495, 5);
            btnExit.Cursor = Cursors.Hand;
            btnExit.Click += (s, e) => { isExiting = true; this.Close(); };
            pnlButtons.Controls.Add(btnExit);

            // Log Console
            txtLogs = new TextBox();
            txtLogs.Dock = DockStyle.Fill;
            txtLogs.Multiline = true;
            txtLogs.ScrollBars = ScrollBars.Both;
            txtLogs.ReadOnly = true;
            txtLogs.BackColor = Color.FromArgb(15, 18, 26);
            txtLogs.ForeColor = Color.FromArgb(166, 173, 186);
            txtLogs.Font = new Font("Consolas", 8.5f, FontStyle.Regular);
            txtLogs.BorderStyle = BorderStyle.None;
            this.Controls.Add(txtLogs);

            // Tray Icon Setup
            trayMenu = new ContextMenuStrip();
            trayMenu.Items.Add("Open Civicverse in Browser", null, (s, e) => OpenCivicverseInBrowser());
            trayMenu.Items.Add("Show Launcher Dashboard", null, (s, e) => RestoreFromTray());
            trayMenu.Items.Add("-");
            trayMenu.Items.Add("Restart Services", null, (s, e) => RestartServices());
            trayMenu.Items.Add("Stop & Exit", null, (s, e) => { isExiting = true; this.Close(); });

            trayIcon = new NotifyIcon();
            trayIcon.Text = "Civicverse Node";
            if (this.Icon != null) trayIcon.Icon = this.Icon;
            trayIcon.ContextMenuStrip = trayMenu;
            trayIcon.Visible = true;
            trayIcon.DoubleClick += (s, e) => RestoreFromTray();

            // Status Timer for service health checks
            statusTimer = new System.Windows.Forms.Timer();
            statusTimer.Interval = 2000;
            statusTimer.Tick += (s, e) => CheckHealth();
            statusTimer.Start();

            this.FormClosing += LauncherForm_FormClosing;
            this.Resize += LauncherForm_Resize;
        }

        private Label CreateServiceCard(string title, string endpoint, string initialStatus)
        {
            Panel card = new Panel();
            card.Dock = DockStyle.Fill;
            card.Margin = new Padding(5);
            card.BackColor = Color.FromArgb(20, 24, 35);
            card.Padding = new Padding(10);

            Label lblCardTitle = new Label();
            lblCardTitle.Text = title;
            lblCardTitle.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            lblCardTitle.ForeColor = Color.FromArgb(226, 232, 240);
            lblCardTitle.AutoSize = true;
            lblCardTitle.Location = new Point(10, 8);
            card.Controls.Add(lblCardTitle);

            Label lblEndpoint = new Label();
            lblEndpoint.Text = endpoint;
            lblEndpoint.Font = new Font("Consolas", 8f, FontStyle.Regular);
            lblEndpoint.ForeColor = Color.FromArgb(100, 116, 139);
            lblEndpoint.AutoSize = true;
            lblEndpoint.Location = new Point(10, 30);
            card.Controls.Add(lblEndpoint);

            Label lblCardStatus = new Label();
            lblCardStatus.Text = initialStatus;
            lblCardStatus.Font = new Font("Segoe UI", 9f, FontStyle.Regular);
            lblCardStatus.ForeColor = Color.FromArgb(234, 179, 8);
            lblCardStatus.AutoSize = true;
            lblCardStatus.Location = new Point(10, 52);
            card.Controls.Add(lblCardStatus);

            return lblCardStatus;
        }

        private void LocateEnvironment()
        {
            // Locate Repo Dir
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            List<string> potentialDirs = new List<string>
            {
                baseDir,
                Path.Combine(baseDir, "Civicverse"),
                Path.Combine(baseDir, "..", "Civicverse"),
                @"C:\Users\frybo\Desktop\DEV OPS\Civicverse",
                @"C:\Users\frybo\Desktop\DEV OPS"
            };

            foreach (string dir in potentialDirs)
            {
                if (Directory.Exists(dir) && File.Exists(Path.Combine(dir, "package.json")) && Directory.Exists(Path.Combine(dir, "backend")))
                {
                    repoDir = Path.GetFullPath(dir);
                    break;
                }
            }

            if (string.IsNullOrEmpty(repoDir))
            {
                AppendLog("[ERROR] Could not locate Civicverse directory. Defaulting to: " + baseDir);
                repoDir = baseDir;
            }
            else
            {
                AppendLog("[INIT] Civicverse repository found: " + repoDir);
            }

            // Locate Node.exe
            List<string> potentialNodes = new List<string>
            {
                @"C:\Program Files\nodejs\node.exe",
                @"C:\Program Files (x86)\nodejs\node.exe",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Programs\node\node.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), @"nvm\current\node.exe")
            };

            foreach (string p in potentialNodes)
            {
                if (File.Exists(p))
                {
                    nodeExe = p;
                    break;
                }
            }

            if (string.IsNullOrEmpty(nodeExe))
            {
                nodeExe = "node.exe";
            }

            AppendLog("[INIT] Using Node runtime: " + nodeExe);
        }

        private void EnsureDesktopShortcut()
        {
            try
            {
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                if (Directory.Exists(desktop))
                {
                    string shortcutPath = Path.Combine(desktop, "Civicverse.lnk");
                    string exePath = Path.Combine(repoDir, "Civicverse.exe");
                    string iconPath = Path.Combine(repoDir, "app.ico");

                    Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                    if (shellType != null)
                    {
                        dynamic shell = Activator.CreateInstance(shellType);
                        dynamic shortcut = shell.CreateShortcut(shortcutPath);
                        shortcut.TargetPath = exePath;
                        shortcut.WorkingDirectory = repoDir;
                        shortcut.Description = "Civicverse Metaverse Node";
                        if (File.Exists(iconPath))
                        {
                            shortcut.IconLocation = iconPath + ",0";
                        }
                        shortcut.Save();
                        AppendLog("[SHORTCUT] Desktop shortcut verified: " + shortcutPath);
                    }
                }
            }
            catch (Exception ex)
            {
                AppendLog("[SHORTCUT] Note: " + ex.Message);
            }
        }

        private void StartServices()
        {
            KillExistingPortProcesses(new int[] { 3000, 3003, 8080 });

            Thread t = new Thread(() =>
            {
                try
                {
                    AppendLog("[LAUNCH] Starting Civicverse services...");

                    // 1. Start Backend API Server (Port 3003)
                    string backendScript = Path.Combine(repoDir, "backend", "index.js");
                    if (File.Exists(backendScript))
                    {
                        backendProcess = StartNodeProcess(backendScript, "Backend API", Path.Combine(repoDir, "backend"));
                    }

                    // 2. Start Multiplayer Server (Port 8080)
                    string mpScript = Path.Combine(repoDir, "backend", "multiplayer-server.js");
                    if (File.Exists(mpScript))
                    {
                        multiplayerProcess = StartNodeProcess(mpScript, "Multiplayer Server", Path.Combine(repoDir, "backend"));
                    }

                    // 3. Start Frontend (Port 3000)
                    string frontendDir = Path.Combine(repoDir, "frontend");
                    string viteCli = Path.Combine(repoDir, "node_modules", "vite", "bin", "vite.js");
                    if (File.Exists(viteCli))
                    {
                        frontendProcess = StartNodeProcess(viteCli, "Frontend Vite Node", frontendDir, "--port 3000 --host");
                    }
                    else
                    {
                        frontendProcess = StartCmdProcess("npm run dev", "Frontend", frontendDir);
                    }

                    AppendLog("[LAUNCH] All services launched. Connecting...");
                }
                catch (Exception ex)
                {
                    AppendLog("[ERROR] Failed to start services: " + ex.Message);
                }
            });
            t.IsBackground = true;
            t.Start();
        }

        private Process StartNodeProcess(string scriptPath, string name, string workDir, string extraArgs = "")
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = nodeExe;
                psi.Arguments = string.IsNullOrEmpty(extraArgs) ? ("\"" + scriptPath + "\"") : ("\"" + scriptPath + "\" " + extraArgs);
                psi.WorkingDirectory = workDir;
                psi.UseShellExecute = false;
                psi.RedirectStandardOutput = true;
                psi.RedirectStandardError = true;
                psi.CreateNoWindow = true;

                Process p = new Process();
                p.StartInfo = psi;
                p.OutputDataReceived += (s, e) => { if (e.Data != null) AppendLog("[" + name + "] " + e.Data); };
                p.ErrorDataReceived += (s, e) => { if (e.Data != null) AppendLog("[" + name + " ERR] " + e.Data); };
                
                p.Start();
                p.BeginOutputReadLine();
                p.BeginErrorReadLine();
                AppendLog("[OK] " + name + " process started (PID: " + p.Id + ")");
                return p;
            }
            catch (Exception ex)
            {
                AppendLog("[ERROR] Failed to start " + name + ": " + ex.Message);
                return null;
            }
        }

        private Process StartCmdProcess(string cmd, string name, string workDir)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "cmd.exe";
                psi.Arguments = "/c " + cmd;
                psi.WorkingDirectory = workDir;
                psi.UseShellExecute = false;
                psi.RedirectStandardOutput = true;
                psi.RedirectStandardError = true;
                psi.CreateNoWindow = true;

                Process p = new Process();
                p.StartInfo = psi;
                p.OutputDataReceived += (s, e) => { if (e.Data != null) AppendLog("[" + name + "] " + e.Data); };
                p.ErrorDataReceived += (s, e) => { if (e.Data != null) AppendLog("[" + name + " ERR] " + e.Data); };
                
                p.Start();
                p.BeginOutputReadLine();
                p.BeginErrorReadLine();
                return p;
            }
            catch (Exception ex)
            {
                AppendLog("[ERROR] Failed to run command " + cmd + ": " + ex.Message);
                return null;
            }
        }

        private void CheckHealth()
        {
            bool webOk = IsPortOpen("localhost", 3000);
            bool apiOk = IsPortOpen("localhost", 3003);
            bool mpOk = IsPortOpen("localhost", 8080);

            try
            {
                if (this.IsDisposed || !this.IsHandleCreated) return;
                this.BeginInvoke(new Action(() =>
                {
                    lblWebStatus.Text = webOk ? "● Online (Port 3000)" : "● Starting / Connecting...";
                    lblWebStatus.ForeColor = webOk ? Color.FromArgb(52, 211, 153) : Color.FromArgb(234, 179, 8);

                    lblApiStatus.Text = apiOk ? "● Online (Port 3003)" : "● Starting...";
                    lblApiStatus.ForeColor = apiOk ? Color.FromArgb(52, 211, 153) : Color.FromArgb(234, 179, 8);

                    lblMpStatus.Text = mpOk ? "● Online (Port 8080)" : "● Starting...";
                    lblMpStatus.ForeColor = mpOk ? Color.FromArgb(52, 211, 153) : Color.FromArgb(234, 179, 8);

                    if (webOk || apiOk)
                    {
                        lblStatus.Text = "● Online";
                        lblStatus.ForeColor = Color.FromArgb(52, 211, 153);

                        if (!browserOpened)
                        {
                            browserOpened = true;
                            OpenCivicverseInBrowser();
                        }
                    }
                }));
            }
            catch { }
        }

        private bool IsPortOpen(string host, int port)
        {
            try
            {
                using (TcpClient client = new TcpClient())
                {
                    var result = client.BeginConnect(host, port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(300);
                    if (!success) return false;
                    client.EndConnect(result);
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }

        private void OpenCivicverseInBrowser()
        {
            try
            {
                string targetUrl = IsPortOpen("localhost", 3000) ? "http://localhost:3000" : "http://localhost:3003";
                Process.Start(new ProcessStartInfo
                {
                    FileName = targetUrl,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                AppendLog("[ERROR] Failed to open browser: " + ex.Message);
            }
        }

        private void RestartServices()
        {
            AppendLog("[ACTION] Restarting all Civicverse services...");
            StopAllProcesses();
            StartServices();
        }

        private void StopAllProcesses()
        {
            try
            {
                if (backendProcess != null && !backendProcess.HasExited) { backendProcess.Kill(); backendProcess.Dispose(); backendProcess = null; }
                if (multiplayerProcess != null && !multiplayerProcess.HasExited) { multiplayerProcess.Kill(); multiplayerProcess.Dispose(); multiplayerProcess = null; }
                if (frontendProcess != null && !frontendProcess.HasExited) { frontendProcess.Kill(); frontendProcess.Dispose(); frontendProcess = null; }
            }
            catch { }

            KillExistingPortProcesses(new int[] { 3000, 3003, 8080 });
        }

        private void KillExistingPortProcesses(int[] ports)
        {
            try
            {
                Process netstat = new Process();
                netstat.StartInfo.FileName = "netstat.exe";
                netstat.StartInfo.Arguments = "-ano";
                netstat.StartInfo.UseShellExecute = false;
                netstat.StartInfo.RedirectStandardOutput = true;
                netstat.StartInfo.CreateNoWindow = true;
                netstat.Start();
                string output = netstat.StandardOutput.ReadToEnd();
                netstat.WaitForExit();

                string[] lines = output.Split(new char[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                HashSet<int> pidsToKill = new HashSet<int>();

                foreach (string line in lines)
                {
                    foreach (int port in ports)
                    {
                        if (line.Contains(":" + port + " ") && line.Contains("LISTENING"))
                        {
                            string[] parts = line.Trim().Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                            if (parts.Length > 4)
                            {
                                int pid;
                                if (int.TryParse(parts[parts.Length - 1], out pid) && pid > 0 && pid != Process.GetCurrentProcess().Id)
                                {
                                    pidsToKill.Add(pid);
                                }
                            }
                        }
                    }
                }

                foreach (int pid in pidsToKill)
                {
                    try
                    {
                        Process p = Process.GetProcessById(pid);
                        p.Kill();
                        AppendLog("[CLEANUP] Terminated port collision process (PID: " + pid + ")");
                    }
                    catch { }
                }
            }
            catch { }
        }

        private void ToggleLogs()
        {
            txtLogs.Visible = !txtLogs.Visible;
            btnToggleLogs.Text = txtLogs.Visible ? "📜 Hide Logs" : "📜 Show Logs";
        }

        private void AppendLog(string message)
        {
            try
            {
                if (this.IsDisposed || !this.IsHandleCreated) return;
                this.BeginInvoke(new Action(() =>
                {
                    if (txtLogs != null && !txtLogs.IsDisposed)
                    {
                        string time = DateTime.Now.ToString("HH:mm:ss");
                        txtLogs.AppendText("[" + time + "] " + message + Environment.NewLine);
                    }
                }));
            }
            catch { }
        }

        private void RestoreFromTray()
        {
            this.Show();
            this.WindowState = FormWindowState.Normal;
            this.BringToFront();
        }

        private void LauncherForm_Resize(object sender, EventArgs e)
        {
            if (this.WindowState == FormWindowState.Minimized)
            {
                this.Hide();
                if (trayIcon != null)
                {
                    trayIcon.ShowBalloonTip(2000, "Civicverse Running", "Civicverse node is running in the background. Double-click tray icon to open.", ToolTipIcon.Info);
                }
            }
        }

        private void LauncherForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (!isExiting && e.CloseReason == CloseReason.UserClosing)
            {
                DialogResult dr = MessageBox.Show(
                    "Do you want to stop all Civicverse services and exit?\n\nClick 'No' to minimize to System Tray and keep running in background.",
                    "Exit Civicverse?",
                    MessageBoxButtons.YesNoCancel,
                    MessageBoxIcon.Question
                );

                if (dr == DialogResult.Cancel)
                {
                    e.Cancel = true;
                    return;
                }
                else if (dr == DialogResult.No)
                {
                    e.Cancel = true;
                    this.WindowState = FormWindowState.Minimized;
                    return;
                }
            }

            isExiting = true;
            if (statusTimer != null) { statusTimer.Stop(); statusTimer.Dispose(); }
            if (trayIcon != null) { trayIcon.Visible = false; trayIcon.Dispose(); }
            StopAllProcesses();
        }

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new LauncherForm());
        }
    }
}
