// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Issue #26 - AI Background Segmentation', () => {
  
  test('MediaPipe loaded', async ({ page }) => {
    await page.goto('/room.html?id=seg-test');
    await page.waitForTimeout(2000);
    
    const libs = await page.evaluate(() => ({
      mediaPipe: typeof SelfieSegmentation !== 'undefined',
      bodyPix: typeof bodyPix !== 'undefined'
    }));
    
    console.log('Libraries:', libs);
    expect(libs.mediaPipe).toBe(true);
  });
  
  test('AI code in room.js', async ({ page }) => {
    await page.goto('/room.html?id=seg-test-code');
    
    const js = await page.evaluate(async () => {
      const r = await fetch('/room.js');
      return await r.text();
    });
    
    expect(js).toContain('AI-СЕГМЕНТАЦИЯ ФОНА');
    expect(js).toContain('SelfieSegmentation');
    expect(js).toContain('initSegmentation');
    expect(js).toContain('globalCompositeOperation');
    expect(js).toContain("filter = 'blur(20px)'");
    expect(js).toContain('backgroundPresets');
    expect(js).toContain('images.unsplash.com');
  });
  
  test('Functions available', async ({ page }) => {
    await page.goto('/room.html?id=seg-test-func');
    await page.waitForTimeout(2000);
    
    const funcs = await page.evaluate(() => ({
      init: typeof initSegmentation !== 'undefined',
      apply: typeof applyVirtualBackground !== 'undefined',
      loadBg: typeof loadBackgroundPreset !== 'undefined'
    }));
    
    console.log('Functions:', funcs);
    expect(funcs.init).toBe(true);
    expect(funcs.apply).toBe(true);
    expect(funcs.loadBg).toBe(true);
  });
});