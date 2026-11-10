import { useCallback, useLayoutEffect, useRef, useState } from 'octane'
import type { ButtonProps } from '../../props'
import type { ActivationEvent } from '../../gestures/types'
import { reportActionError } from '../../internal/rendering/action-error'

/** One admission token covers synchronous effects, navigation and managed work. */
export function useButtonAction(
  props: ButtonProps,
  groupDisabled: boolean,
  navigate?: (href: string) => void,
) {
  const [pending, setPending] = useState(false)
  const tokens = useRef(new Set<symbol>())
  const alive = useRef(true)
  const latest = useRef({ props, groupDisabled, navigate })

  useLayoutEffect(() => {
    latest.current = { props, groupDisabled, navigate }
  }, [props, groupDisabled, navigate])

  useLayoutEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      tokens.current.clear()
    }
  }, [])

  const press = useCallback((event: ActivationEvent) => {
    const { props, groupDisabled, navigate } = latest.current

    if (
      !alive.current ||
      props.isDisabled ||
      groupDisabled ||
      ((props.isLoading || tokens.current.size > 0) && !props.isInterruptible)
    ) {
      event.preventDefault()
      return
    }

    const token = Symbol('button-action')

    tokens.current.add(token)

    const settle = () => {
      if (tokens.current.delete(token) && alive.current) {
        setPending(tokens.current.size > 0)
      }
    }

    let prevented = false

    try {
      props.onPress?.({
        ...event,
        preventDefault() {
          prevented = true
          event.preventDefault()
        },
      })

      if (prevented) {
        settle()
        return
      }

      if (props.href != null) {
        navigate?.(props.href)
      }
    } catch (error) {
      settle()
      throw error
    }

    try {
      const action = props.pressAction?.()

      if (action && typeof action.then === 'function') {
        if (alive.current && tokens.current.has(token)) {
          setPending(true)
        }

        Promise.resolve(action).then(settle, (error) => {
          settle()
          reportActionError(error, props.onActionError)
        })
      } else {
        settle()
      }
    } catch (error) {
      settle()
      reportActionError(error, props.onActionError)
    }
  }, [])

  return { pending, press }
}

export type ButtonActionBinding = ReturnType<typeof useButtonAction>
