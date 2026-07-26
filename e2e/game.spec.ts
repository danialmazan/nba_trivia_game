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

async function startGame(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /start game/i }).click()
  await expect(page.getByRole('heading', { name: /know your three moves/i })).toBeVisible()
  await page.getByRole('button', { name: /understood.*let's go/i }).click()
}

test('starts a Normal challenge, deducts misses, reveals clues and accepts the answer', async ({ page }) => {
  await startGame(page)
  await expect(page.getByText('1 / 10')).toBeVisible()
  await expect(page.getByTestId('available-score')).toHaveText('100')

  await page.getByLabel(/guess now/i).fill('Bill Russell')
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByTestId('available-score')).toHaveText('90')
  await expect(page.getByText('Bill Russell')).toBeVisible()

  await page.getByRole('button', { name: /next clue/i }).click()
  await expect(page.getByTestId('available-score')).toHaveText('70')

  await page.getByLabel(/guess now/i).fill('Kareem')
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByTestId('answer-reveal')).toContainText('Kareem Abdul-Jabbar')
  await expect(page.getByTestId('answer-reveal')).toContainText('70')
})

test('giving up reveals the answer and scores zero', async ({ page }) => {
  await startGame(page)
  await page.getByRole('button', { name: 'Give up' }).click()
  await expect(page.getByTestId('answer-reveal')).toContainText('Kareem Abdul-Jabbar')
  await expect(page.getByTestId('answer-reveal')).toContainText('0')
  await expect(page.getByRole('button', { name: /next player/i })).toBeVisible()
  await expect(page.getByText(/review all five clues/i)).toBeVisible()
})

test('completes ten rounds and persists a high score', async ({ page }) => {
  await startGame(page)
  for (const [index, answer] of firstTenAnswers.entries()) {
    await page.getByLabel(/guess now/i).fill(answer)
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(page.getByTestId('answer-reveal')).toContainText('100')
    await page.getByRole('button', { name: index === 9 ? /see final results/i : /next player/i }).click()
  }

  await expect(page.getByText("That’s the run.")).toBeVisible()
  await expect(page.getByText('/ 1000')).toBeVisible()
  await expect(page.getByText('New personal best.')).toBeVisible()

  await page.reload()
  await expect(page.getByText('Normal best').locator('..')).toContainText('1000')
})
