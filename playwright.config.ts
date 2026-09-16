import {defineConfig} from "@playwright/test";

export default defineConfig({
  testDir:"./tests/browser",
  testMatch:["proposal-focus.spec.ts","partner-experience.spec.ts"],
  fullyParallel:false,
  workers:1,
  timeout:30_000,
  use:{baseURL:"http://127.0.0.1:4175",browserName:"chromium",headless:true},
  webServer:{
    command:"cd tests/browser/proposal-focus && ../../../node_modules/.bin/next build --webpack && ../../../node_modules/.bin/next start --hostname 127.0.0.1 --port 4175",
    url:"http://127.0.0.1:4175",
    reuseExistingServer:false,
    timeout:30_000
  }
});
