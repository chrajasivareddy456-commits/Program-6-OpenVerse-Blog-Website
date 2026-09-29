const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

/**
 * Reads a JSON data file and returns the parsed content.
 * If the file is missing, creates it with a default value.
 * If the file is corrupt, throws a descriptive error instead of crashing the process.
 */
async function readJSON(fileName, defaultValue = []) {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    if (!raw || !raw.trim()) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await writeJSON(fileName, defaultValue);
      return defaultValue;
    }
    if (err instanceof SyntaxError) {
      console.error(`[fileStorage] Corrupt JSON in ${fileName}:`, err.message);
      throw new Error(`Data file ${fileName} is corrupted`);
    }
    throw err;
  }
}

/**
 * Writes data to a JSON file atomically (write to temp file, then rename)
 * to avoid leaving a half-written / corrupted file if the process dies mid-write.
 */
async function writeJSON(fileName, data) {
  const filePath = path.join(DATA_DIR, fileName);
  const tmpPath = `${filePath}.tmp`;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tmpPath, filePath);
    return true;
  } catch (err) {
    console.error(`[fileStorage] Failed writing ${fileName}:`, err.message);
    throw new Error(`Could not save data to ${fileName}`);
  }
}

module.exports = { readJSON, writeJSON };
