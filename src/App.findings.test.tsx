import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('finding-driven navigation', () => {
  it('opens the declared GraphQL branch as a deterministic methodology list', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /open GraphQL testing branch/i }))

    expect(screen.getByRole('heading', { name: 'GraphQL testing branch', level: 2 })).toBeVisible()
    expect(screen.getByRole('button', { name: /Identify GraphQL endpoint/i })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Map' })).toHaveAttribute('aria-pressed', 'true')
  })
})
