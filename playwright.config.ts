import {defineConfig} from "@playwright/test";

export default defineConfig({
  testDir:"./tests/browser",
  testMatch:"proposal-focus.spec.ts",
  fullyParallel:false,
  workers:1,
  timeout:30_000,
  use:{baseURL:"http://127.0.0.1:4175",browserName:"chromium",headless:true},
  webServer:{
    command:"node_modules/.bin/next dev tests/browser/proposal-focus --hostname 127.0.0.1 --port 4175",
    url:"http://127.0.0.1:4175",
    reuseExistingServer:false,
    timeout:30_000
  }
});
