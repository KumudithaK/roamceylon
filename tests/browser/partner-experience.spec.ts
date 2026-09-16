import {expect,test,type Page} from "@playwright/test";

async function expectNoHorizontalOverflow(page:Page){
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
}

async function completeContact(page:Page){
  await page.getByLabel("Full name").fill("CR2 Test Partner");
  await page.getByLabel("Business or professional name").fill("CR2 Test Business");
  await page.getByLabel("Email").fill("cr2@example.com");
  await page.getByLabel("Phone / WhatsApp").fill("0000000000");
  await page.getByRole("button",{name:"Continue"}).click();
}

async function completeContext(page:Page,introduction="A carefully prepared synthetic introduction for browser verification only."){
  await page.getByLabel("Full address").fill("Synthetic verification address");
  await page.getByLabel("District").selectOption("Anuradhapura");
  await page.getByLabel("Short introduction").fill(introduction);
  await page.getByLabel("How did you hear about us?").selectOption("Recommendation");
}

test("partner application exposes labelled required fields and focuses validation feedback",async({page})=>{
  await page.goto("/partner");
  await expect(page.getByRole("heading",{name:"Tell us what you bring to the journey."})).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveAttribute("required","");
  await expect(page.getByLabel("Email")).toHaveAttribute("type","email");
  await page.getByRole("button",{name:"Continue"}).click();
  const alert=page.getByRole("alert");
  await expect(alert).toContainText("Please complete:");
  await expect(alert).toBeFocused();
  await expectNoHorizontalOverflow(page);
});

test("partner application supports keyboard progress without crossing the submission boundary",async({page})=>{
  await page.goto("/partner");
  await page.getByLabel("Full name").fill("Test Partner");
  await page.getByLabel("Business or professional name").fill("Test Business");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Phone / WhatsApp").fill("0000000000");
  await page.getByRole("button",{name:"Continue"}).press("Enter");
  await expect(page.getByRole("heading",{name:"Where are you based?"})).toBeVisible();
  await page.getByRole("button",{name:"Continue"}).press("Enter");
  const alert=page.getByRole("alert");
  await expect(alert).toBeFocused();
  await expect(alert).toContainText("full address");
  await expect(page.getByRole("button",{name:/Submit for manual review/})).toHaveCount(0);
});

test("partner application remains usable at a 390px mobile viewport",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/partner");
  await expectNoHorizontalOverflow(page);
  await page.getByLabel("Full name").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Business or professional name")).toBeFocused();
  await page.getByRole("button",{name:"Continue"}).click();
  await expect(page.getByRole("alert")).toBeFocused();
});

test("explicit partner route wins over a stale browser draft and selects canonical types",async({page})=>{
  await page.goto("/partner");
  await page.evaluate(()=>sessionStorage.setItem("roam-ceylon-partner-draft",JSON.stringify({type:"accommodation",values:{applicantName:"Preserved name",propertyType:"Villa"},entries:[]})));
  await page.goto("/partner?type=guide");
  await expect(page.getByLabel("Partner type")).toHaveValue("guide");
  await expect(page.getByLabel("Full name")).toHaveValue("Preserved name");
  await page.goto("/partner?type=vehicle");
  await expect(page.getByLabel("Partner type")).toHaveValue("vehicle");
});

test("district derives province and Context enforces the trimmed 30-character minimum",async({page})=>{
  await page.goto("/partner");
  await completeContact(page);
  await page.getByLabel("Full address").fill("Synthetic verification address");
  await page.getByLabel("District").selectOption("Anuradhapura");
  await expect(page.getByRole("status")).toContainText("North Central");
  await page.getByLabel("Short introduction").fill("a".repeat(29));
  await page.getByLabel("How did you hear about us?").selectOption("Recommendation");
  await page.getByRole("button",{name:"Continue"}).click();
  await expect(page.getByRole("alert")).toContainText("at least 30");
  await expect(page.getByRole("alert")).toBeFocused();
  await expect(page.getByLabel("Short introduction")).toHaveAttribute("aria-invalid","true");
  await page.getByLabel("Short introduction").fill("a".repeat(30));
  await page.getByRole("button",{name:"Continue"}).click();
  await expect(page.getByRole("heading",{name:"What do you bring to a journey?"})).toBeVisible();
});

test("guide catalogue selectors support search, tags, exclusivity, removal and keyboard use",async({page})=>{
  await page.goto("/partner?type=guide");
  await completeContact(page);
  await completeContext(page);
  await page.getByRole("button",{name:"Continue"}).click();
  const destinationSearch=page.getByRole("combobox",{name:"Search Destinations covered"});
  await destinationSearch.fill("Island");
  await destinationSearch.press("Enter");
  await expect(page.getByRole("button",{name:"Remove Island Wide"})).toBeVisible();
  await destinationSearch.fill("Sigiriya");
  await destinationSearch.press("Enter");
  await expect(page.getByRole("button",{name:"Remove Island Wide"})).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Remove Sigiriya"})).toBeVisible();
  await page.getByRole("button",{name:"Remove Sigiriya"}).click();
  const experienceSearch=page.getByRole("combobox",{name:"Search Experiences supported"});
  await experienceSearch.fill("Any Experience");
  await experienceSearch.press("Enter");
  await expect(page.getByRole("button",{name:"Remove Any Experience"})).toBeVisible();
  await experienceSearch.press("Escape");
  await expect(experienceSearch).toHaveAttribute("aria-expanded","false");
  await expectNoHorizontalOverflow(page);
});
