const fs = require('fs');
const path = require('path');

function resolveConfigPath(configPath) {
  if (path.isAbsolute(configPath)) {
    return configPath;
  }

  return path.join(process.cwd(), configPath);
}

function loadBusinessConfig(configPath) {
  const resolvedPath = resolveConfigPath(configPath);
  const raw = fs.readFileSync(resolvedPath, 'utf-8');
  const parsed = JSON.parse(raw);

  return parsed;
}

function watchBusinessConfig(configPath, onChange) {
  const resolvedPath = resolveConfigPath(configPath);

  fs.watch(resolvedPath, { persistent: false }, () => {
    try {
      onChange(loadBusinessConfig(configPath));
    } catch (error) {
      console.error('Failed to reload business config:', error.message);
    }
  });
}

module.exports = {
  loadBusinessConfig,
  watchBusinessConfig,
};
