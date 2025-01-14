import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { ApiProvider } from '../provider'
import {
  useCalendar,
  useClassmates,
  useEtjanstChildren,
  useMenu,
  useNews,
  useNotifications,
  useSchedule,
  useUser,
} from '../hooks'
import store from '../store'
import createStorage from '../__mocks__/AsyncStorage'

const { default: init } = jest.requireActual(
  '../../../api-skolplattformen/lib/index.ts'
)

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms))

describe('hooks with fake data', () => {
  let api: any
  let storage: any
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ApiProvider api={api} storage={storage}>
      {children}
    </ApiProvider>
  )
  beforeEach(async () => {
    api = init(
      () => {
        // noop
      },
      () => {
        //noop
      }
    )
    await api.login('121212121212')

    storage = createStorage({})
  })
  it('does not use cache', async () => {
    storage.cache.user = JSON.stringify({ user: 'cached' })

    const { result } = renderHook(() => useUser(), {
      wrapper,
    })

    await waitFor(() =>
      expect(result.current.data).toEqual({
        firstName: 'Namn',
        lastName: 'Namnsson',
        isAuthenticated: true,
        personalNumber: '195001182046',
      })
    )
  })
  it('returns user', async () => {
    const { result } = renderHook(() => useUser(), {
      wrapper,
    })

    await waitFor(() =>
      expect(result.current.data).toEqual({
        firstName: 'Namn',
        lastName: 'Namnsson',
        isAuthenticated: true,
        personalNumber: '195001182046',
      })
    )
  })
  it('returns child list', async () => {
    const { result } = renderHook(() => useEtjanstChildren(), { wrapper })

    await waitFor(() => expect(result.current.data).toHaveLength(2))
  })
  describe('data belonging to one child', () => {
    let child: any
    beforeEach(async () => {
      ;[child] = await api.getChildren()
    })
    it('returns calendar', async () => {
      const { result } = renderHook(() => useCalendar(child), { wrapper })

      await waitFor(() => expect(result.current.data.length).toBeGreaterThan(1))
    })
    it('returns classmates', async () => {
      const { result } = renderHook(() => useClassmates(child), { wrapper })

      await waitFor(() => expect(result.current.data.length).toBeGreaterThan(1))
    })
    it('returns menu', async () => {
      const { result } = renderHook(() => useMenu(child), {
        wrapper,
      })

      await waitFor(() => expect(result.current.data.length).toBeGreaterThan(1))
    })
    it('returns news', async () => {
      const { result } = renderHook(() => useNews(child), {
        wrapper,
      })

      await waitFor(() => expect(result.current.data.length).toBeGreaterThan(1))
    })
    it('returns notifications', async () => {
      const { result } = renderHook(() => useNotifications(child), {
        wrapper,
      })

      await waitFor(() => expect(result.current.data.length).toBeGreaterThan(1))
    })
    it('returns schedule', async () => {
      const from = '2021-01-01'
      const to = '2021-01-08'
      const { result } = renderHook(() => useSchedule(child, from, to), {
        wrapper,
      })

      await waitFor(() =>
        // No fake schedule in embedded-api yet
        expect(result.current.data.length).not.toBeGreaterThan(1)
      )
    })
  })
  it('handles reloads', async () => {
    store.dispatch({ type: 'CLEAR' } as any) // fixes test for invalid type

    const [child] = await api.getChildren()

    const { result } = renderHook(() => useNotifications(child), { wrapper })

    await waitFor(() => {
      expect(result.current.status).toEqual('loaded')
    })

    result.current.reload()
    await waitFor(() => expect(result.current.status).toEqual('loaded'))
  })
})
