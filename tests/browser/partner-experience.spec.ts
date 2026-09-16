import {expect,test,type Page} from "@playwright/test";

async function expectNoHorizontalOverflow(page:Page){
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
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
