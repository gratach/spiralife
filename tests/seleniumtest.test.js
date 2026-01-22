import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import express from 'express';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

jest.setTimeout(30000); // Selenium braucht oft mehr Zeit

let driver;
let server;
let testTempDir;

import webpack from 'webpack';
import config from '../webpack.config.cjs'; // CommonJS Config

function buildWebpack(dir) {
  return new Promise((resolve, reject) => {
    const modifiedConfig = { ...config, output: { ...config.output, path: dir } };
    webpack(modifiedConfig, (err, stats) => {
      if (err) return reject(err);
      if (stats.hasErrors()) return reject(new Error(stats.toString()));
      console.log(stats.toString({ colors: true }));
      resolve();
    });
  });
}

beforeAll(async () => {
    // Create temporary directory for test if needed
    testTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'webpack-test-'));

    // Build the webpack project
    await buildWebpack(testTempDir);

    // Start Express server to serve the built files
    const app = express();
    const distPath = testTempDir; // Serve from temporary build directory
    app.use(express.static(distPath));
    server = app.listen(3000);

    // Set up Selenium WebDriver with Firefox
    const options = new firefox.Options();
    driver = await new Builder()
        .forBrowser('firefox')
        .setFirefoxOptions(options)
        .build();
});

afterAll(async () => {
    if (driver) await driver.quit();
    if (server) server.close();
    // Clean up temporary directory
    if (testTempDir){
        await fs.rm(testTempDir, { recursive: true, force: true });
    }
});

test('should load the webpack application', async () => {
    await driver.get('http://localhost:3000');
    const title = await driver.getTitle();
    expect(title).toBe('Calendar Generator');
});
