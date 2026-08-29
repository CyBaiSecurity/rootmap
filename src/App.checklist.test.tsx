import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { App } from './App'

describe('Checklist mode', () => {
  beforeEach(() => localStorage.clear())

  it('persists a completed methodology check across remounts', async () => {
    const user = userEvent.setup()
    const firstRender = render(<App />)

    await user.click(screen.getByRole('button', { name: 'Checklist' }))
    const checkbox = screen.getByRole('checkbox', { name: 'Mark Fingerprint web server complete' })
    await user.click(checkbox)
    expect(checkbox).toBeChecked()

    firstRender.unmount()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Checklist' }))

    expect(
      screen.getByRole('checkbox', { name: 'Mark Fingerprint web server complete' }),
    ).toBeChecked()
    expect(screen.getByText(/1 of \d+ checks/)).toBeVisible()
  })
})

