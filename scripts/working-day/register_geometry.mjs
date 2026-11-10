import assert from 'node:assert/strict';
import {join} from 'node:path';
import {expect} from '@playwright/test';

/** Measure the usable first row, including the controls below the player name. */
export function registerGeometry(page) {
  return page.locator('.register-roster').evaluate(roster => {
    const first = roster.firstElementChild;
    const marks = Array.from(first.querySelectorAll('.register-options button'));
    const box = first.getBoundingClientRect();
    const targets = marks.map(mark => mark.getBoundingClientRect());
    const center = roster.closest('.workspace-center');
    const review = center.querySelector('.register-savebar').getBoundingClientRect();
    const rounded = value => Math.round(value);
    return {
      firstRowTop: rounded(box.top),
      markBottom: rounded(Math.max(...targets.map(target => target.bottom))),
      minimumMarkHeight: rounded(Math.min(...targets.map(target => target.height))),
      minimumMarkWidth: rounded(Math.min(...targets.map(target => target.width))),
      reviewTop: rounded(review.top),
      viewportHeight: innerHeight,
      horizontalOverflow: Math.max(document.documentElement.scrollWidth - innerWidth, center.scrollWidth - center.clientWidth),
      actionable: marks.length === 3 && marks.every(mark => !mark.disabled),
      visibleMarkTargets: marks.filter((mark,index)=>{
        const rect=targets[index];
        return mark.contains(document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2));
      }).length,
    };
  });
}

export async function checkPhoneRegister(page,mode,locale,captures) {
  const viewport=page.viewportSize();
  const cases=[];
  try {
    for(const width of [390,360,320]){
      await page.setViewportSize({width,height:844});
      await expect(page.locator('.phone-dialog-panes')).toBeVisible();
      await page.evaluate(()=>window.scrollTo(0,0));
      const measure=await registerGeometry(page);
      assert.equal(measure.horizontalOverflow,0);
      assert.equal(measure.actionable,true);
      assert.ok(measure.minimumMarkHeight>=44&&measure.minimumMarkWidth>=44);
      assert.ok(measure.markBottom<=measure.reviewTop,JSON.stringify(measure));
      assert.equal(measure.visibleMarkTargets,3);
      if(width===390&&captures)await page.screenshot({path:join(captures,`${mode}-${locale}-390.png`)});
      if(width===320&&mode==='canonical'){
        const actions=page.locator('.register-action-menu > summary');
        await actions.click();
        const box=await page.locator('.register-action-menu[open] > div').boundingBox();
        assert.ok(box&&box.x>=0&&box.x+box.width<=width);
        await actions.press('Escape');
        await expect(actions).toBeFocused();
      }
      await page.locator('.register-roster > li').last().locator('.register-options button').first().click({trial:true});
      cases.push({mode,locale,width,...measure,lastMarkReachable:true});
    }
  }finally{
    await page.setViewportSize(viewport);
    await page.evaluate(()=>window.scrollTo(0,0));
  }
  return cases;
}
