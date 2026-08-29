import { render, screen, within } from '@testing-library/react'
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

  it('navigates and marks checks in DFIR checklist domain', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'DFIR' }))
    await user.click(screen.getByRole('button', { name: 'Checklist' }))

    expect(
      screen.getByRole('heading', { name: 'DFIR Investigation Checklist', level: 1 }),
    ).toBeVisible()

    const workspace = screen.getByRole('main')
    // Expand Disk / Filesystem group in checklist
    await user.click(within(workspace).getByRole('button', { name: /Disk \/ Filesystem/i }))
    const checkbox = screen.getByRole('checkbox', {
      name: 'Mark Verify disk image format & cryptographic hash complete',
    })
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
    expect(screen.getByText(/1 of \d+ checks/)).toBeVisible()
  })
})

