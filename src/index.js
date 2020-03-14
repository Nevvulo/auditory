const { app, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')

// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent(app)) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

function createWindow () {
  // Create the browser window.
  let win = new BrowserWindow({
    width: 1024,
    height: 1024,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  win.setMenuBarVisibility(false);
}

app.on('ready', createWindow)

function handleSquirrelEvent(application) {
  if (process.argv.length === 1) {
  return false;
  }
  const ChildProcess = require('child_process');
  const path = require('path');
  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);
  const spawn = function(command, args) {
  let spawnedProcess, error;
  try {
  spawnedProcess = ChildProcess.spawn(command, args, {
  detached: true
  });
  } catch (error) {}
  return spawnedProcess;
  };
  const spawnUpdate = function(args) {
  return spawn(updateDotExe, args);
  };
  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
  case '--squirrel-install':
  case '--squirrel-updated':
  // Optionally do things such as:
  // - Add your .exe to the PATH
  // - Write to the registry for things like file associations and
  //   explorer context menus
  // Install desktop and start menu shortcuts
  spawnUpdate(['--createShortcut', exeName]);
  setTimeout(application.quit, 1000);
  return true;
  case '--squirrel-uninstall':
  // Undo anything you did in the --squirrel-install and
  // --squirrel-updated handlers
  // Remove desktop and start menu shortcuts
  spawnUpdate(['--removeShortcut', exeName]);
  setTimeout(application.quit, 1000);
  return true;
  case '--squirrel-obsolete':
  // This is called on the outgoing version of your app before
  // we update to the new version - it's the opposite of
  // --squirrel-updated
  application.quit();
  return true;
  }
  };