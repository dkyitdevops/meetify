import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

test.describe('AI Team Office - Agent Modal Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Переходим на страницу AI Team Office
    await page.goto(BASE_URL);
    // Ждем загрузки страницы
    await page.waitForSelector('.office-container', { timeout: 10000 });
    // Ждем загрузки агентов
    await page.waitForTimeout(3000);
  });

  test('Клик на Елену — модалка пустая (нет issues)', async ({ page }) => {
    // Находим и кликаем на Елену (в комнате отдыха)
    const elenaCard = page.locator('.rest-agent:has-text("Елена")').first();
    await expect(elenaCard).toBeVisible();
    await elenaCard.click();

    // Ждем открытия модалки
    const modal = page.locator('#agentModal');
    await expect(modal).toBeVisible();

    // Проверяем имя в модалке
    const modalName = page.locator('#modalName');
    await expect(modalName).toHaveText('Елена');

    // Проверяем, что список issues пуст
    const issuesList = page.locator('#modalIssuesList');
    await expect(issuesList).toBeVisible();
    
    // Должно быть сообщение "Нет открытых задач"
    const noIssuesText = issuesList.locator('text=Нет открытых задач');
    await expect(noIssuesText).toBeVisible();

    // Закрываем модалку
    await page.locator('.modal-close').click();
    await expect(modal).not.toBeVisible();
  });

  test('Клик на Ивана — есть Issue #15', async ({ page }) => {
    // Находим и кликаем на Ивана (в рабочей зоне)
    const ivanCard = page.locator('.desk-station:has-text("Иван")').first();
    await expect(ivanCard).toBeVisible();
    await ivanCard.click();

    // Ждем открытия модалки
    const modal = page.locator('#agentModal');
    await expect(modal).toBeVisible();

    // Проверяем имя в модалке
    const modalName = page.locator('#modalName');
    await expect(modalName).toHaveText('Иван');

    // Ждем загрузки issues
    const issuesLoader = page.locator('#modalIssuesLoader');
    await expect(issuesLoader).toBeHidden();

    // Проверяем, что Issue #15 есть в списке
    const issuesList = page.locator('#modalIssuesList');
    await expect(issuesList).toBeVisible();
    
    // Ищем issue #15
    const issue15 = issuesList.locator('.issue-item:has-text("#15")').first();
    await expect(issue15).toBeVisible();

    // Закрываем модалку
    await page.locator('.modal-close').click();
    await expect(modal).not.toBeVisible();
  });

  test('Клик на Сергея — модалка пустая (нет issues)', async ({ page }) => {
    // Находим и кликаем на Сергея (в комнате отдыха)
    const sergeyCard = page.locator('.rest-agent:has-text("Сергей")').first();
    await expect(sergeyCard).toBeVisible();
    await sergeyCard.click();

    // Ждем открытия модалки
    const modal = page.locator('#agentModal');
    await expect(modal).toBeVisible();

    // Проверяем имя в модалке
    const modalName = page.locator('#modalName');
    await expect(modalName).toHaveText('Сергей');

    // Проверяем, что список issues пуст
    const issuesList = page.locator('#modalIssuesList');
    await expect(issuesList).toBeVisible();
    
    // Должно быть сообщение "Нет открытых задач"
    const noIssuesText = issuesList.locator('text=Нет открытых задач');
    await expect(noIssuesText).toBeVisible();

    // Закрываем модалку
    await page.locator('.modal-close').click();
    await expect(modal).not.toBeVisible();
  });
});
