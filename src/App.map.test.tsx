import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { App } from './App'

describe('Map mode', () => {
  beforeEach(() => localStorage.clear())

  it('selects a methodology node and renders the complete node detail contract', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /fingerprint web server/i }))
    expect(screen.getByRole('heading', { name: 'Fingerprint web server', level: 2 })).toBeVisible()

    await user.click(screen.getByRole('button', { name: /identify technologies/i }))
    expect(screen.getByRole('heading', { name: 'Identify technologies', level: 2 })).toBeVisible()
    for (const section of [
      'Goal',
      'Checklist',
      'Tools',
      'Command examples',
      'What to look for',
      'Possible findings',
      'Next steps',
      'Resources',
    ]) {
      expect(screen.getByRole('heading', { name: section })).toBeVisible()
    }
    expect(screen.getByText('GraphQL detected')).toBeVisible()
    expect(screen.getByRole('link', { name: /OWASP WSTG v4.2/i })).toHaveAttribute(
      'href',
      expect.stringContaining('/v42/'),
    )
    expect(screen.getByText('Documentation')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Copy Inspect response headers command' }))
    expect(await navigator.clipboard.readText()).toBe('curl -I https://target.example')
  })
})
