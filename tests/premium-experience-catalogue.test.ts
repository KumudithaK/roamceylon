import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const catalogue=JSON.parse(await readFile(new URL("../data/experience-editorial-catalogue.json",import.meta.url),"utf8"));
const showcase=new Set([
  "belihuloya-bakers-bend-4x4-off-road-adventure-safari",
  "dambulla-bird-watching-and-sunset-boat-rides-on-kandalama-reservoir",
  "kandy-experiencing-the-grand-annual-kandy-esala-perahera-festival-procession"
]);

test("premium catalogue enriches every non-showcase experience exactly once",()=>{
  assert.equal(catalogue.length,118);
  assert.equal(new Set(catalogue.map((item:{slug:string})=>item.slug)).size,118);
  assert.equal(catalogue.some((item:{slug:string})=>showcase.has(item.slug)),false);
});

test("every enriched experience has complete editorial content and mappings",()=>{
  for(const item of catalogue){
    assert.ok(item.shortDescription&&item.fullDescription,item.slug);
    for(const field of ["highlights","uniquePoints","included","thingsToKnow","nearbyAttractions","travellerTips"]){
      assert.ok(Array.isArray(item[field])&&item[field].length>0,`${item.slug}: ${field}`);
    }
    assert.ok(Array.isArray(item.badges),`${item.slug}: badges`);
    assert.ok(item.destinationSlugs.length>0,`${item.slug}: destination`);
    assert.ok(item.themeSlugs.length>0,`${item.slug}: theme`);
  }
});

test("every enriched gallery has five unique images with five alt descriptions",()=>{
  for(const item of catalogue){
    assert.equal(item.gallery.length,5,`${item.slug}: gallery`);
    assert.equal(new Set(item.gallery).size,5,`${item.slug}: duplicate image`);
    assert.equal(item.galleryAltTexts.length,5,`${item.slug}: gallery alt text`);
    assert.ok(item.galleryAltTexts.every((text:string)=>text.trim().length>10),`${item.slug}: weak alt text`);
  }
});
