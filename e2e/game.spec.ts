import { expect, test } from '@playwright/test'

const firstTenAnswers = [
  'Kareem',
  'Julius Erving',
  'Magic Johnson',
  'Larry Bird',
  'Moses Malone',
  'Isiah Thomas',
  'George Gervin',
  'Alex English',
  'Dominique Wilkins',
  'Kevin McHale',
]

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0
  })
  await page.goto('/')
})

test('starts a Normal challenge, deducts misses, reveals clues and accepts the answer', async ({ page }) => {
  await page.getByRole('button', { name: /start game/i }).click()
  await expect(page.getByText('1 / 10')).toBeVisible()
  await expect(page.getByTestId('available-score')).toHaveText('100')

  await page.getByLabel('Enter one player').fill('Bill Russell')
  await page.getByRole('button', { name: 'Submit guess' }).click()
  await expect(page.getByTestId('available-score')).toHaveText('90')
  await expect(page.getByText('Bill Russell')).toBeVisible()

  await page.getByRole('button', { name: /reveal another clue/i }).click()
  await expect(page.getByTestId('available-score')).toHaveText('70')

  await page.getByLabel('Enter one player').fill('Kareem')
  await page.getByRole('button', { name: 'Submit guess' }).click()
  await expect(page.getByTestId('answer-reveal')).toContainText('Kareem Abdul-Jabbar')
  await expect(page.getByTestId('answer-reveal')).toContainText('70')
})

test('giving up reveals the answer and scores zero', async ({ page }) => {
  await page.getByRole('button', { name: /start game/i }).click()
  await page.getByRole('button', { name: 'Give up' }).click()
  await expect(page.getByTestId('answer-reveal')).toContainText('Kareem Abdul-Jabbar')
  await expect(page.getByTestId('answer-reveal')).toContainText('0')
})

test('completes ten rounds and persists a high score', async ({ page }) => {
  await page.getByRole('button', { name: /start game/i }).click()
  for (const [index, answer] of firstTenAnswers.entries()) {
    await page.getByLabel('Enter one player').fill(answer)
    await page.getByRole('button', { name: 'Submit guess' }).click()
    await expect(page.getByTestId('answer-reveal')).toContainText('100')
    await page.getByRole('button', { name: index === 9 ? /see final results/i : /next player/i }).click()
  }

  await expect(page.getByText("That’s the run.")).toBeVisible()
  await expect(page.getByText('/ 1000')).toBeVisible()
  await expect(page.getByText('New personal best.')).toBeVisible()

  await page.reload()
  await expect(page.getByText('Normal best').locator('..')).toContainText('1000')
})
