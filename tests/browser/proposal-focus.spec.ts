import {expect,test,type Page} from "@playwright/test";

async function verifyFocusLifecycle(page:Page,openerId:"chapter-opener"|"summary-opener"){
  const opener=page.getByTestId(openerId);
  const dialog=page.getByRole("dialog");
  const close=page.getByRole("button",{name:"Close journey proposal request"});
  const name=page.getByRole("textbox",{name:/Full name/});
  const submit=page.getByRole("button",{name:"Request your journey proposal"});

  await opener.focus();
  await opener.press("Enter");
  await expect(dialog).toBeVisible();
  await expect(name).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(submit).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect.poll(()=>page.evaluate(()=>document.activeElement?.getAttribute("data-testid"))).toBe(openerId);

  await opener.press("Enter");
  await expect(dialog).toBeVisible();
  await expect(name).toBeFocused();
  await close.click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
}

test("restores the exact desktop proposal opener after Escape and explicit close",async({page})=>{
  await page.goto("/");
  await verifyFocusLifecycle(page,"chapter-opener");
});

test("restores the exact mobile proposal opener without targeting its duplicate",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  await verifyFocusLifecycle(page,"summary-opener");
});
