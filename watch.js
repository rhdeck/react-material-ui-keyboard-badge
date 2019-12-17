#!/usr/bin/env node
const watch = require("node-watch");
const cwd = __dirname;
const { execSync } = require("child_process");
process.cwd(cwd);
execSync("yarn build", { stdio: "inherit" });
watch(
  "./src",
  { filter: f => !/node_modules/.test(f) && /\.js$/.test(f) },
  () => {
    try {
      execSync("yarn build", { stdio: "inherit" });
    } catch (e) {}
  }
);
