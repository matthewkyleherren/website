'use client'

import React, { ChangeEvent, useCallback, useEffect, useReducer, useRef, useState } from 'react'

import { Data, Field, IFormContext, InitialState, OnSubmit } from '../types'
import {
  FieldContext,
  FormContext,
  FormSubmittedContext,
  ModifiedContext,
  ProcessingContext,
} from './context'
import initialContext from './initialContext'
import { reduceFieldsToValues } from './reduceFieldsToValues'
import reducer from './reducer'

const defaultInitialState = {}

export type FormProps = {
  onSubmit?: OnSubmit
  children: React.ReactNode
  initialState?: InitialState
  method?: 'GET' | 'POST'
  action?: string
  className?: string
  errors?: {
    field: string
    message: string
  }[]
}

const Form: React.FC<FormProps> = props => {
  const {
    onSubmit,
    children,
    initialState = defaultInitialState,
    method,
    action,
    className,
    errors: errorsFromProps,
  } = props

  const [fields, dispatchFields] = useReducer(reducer, initialState)
  const [isModified, setIsModified] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [errorFromSubmit, setErrorFromSubmit] = useState<string>()

  const contextRef = useRef<IFormContext>(initialContext)

  contextRef.current.initialState = initialState
  contextRef.current.fields = fields

  const handleSubmit = useCallback(
    async (e: ChangeEvent<HTMLFormElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setHasSubmitted(true)

      const formIsValid = contextRef.current.validateForm()

      if (formIsValid) {
        setIsProcessing(true)
      }

      if (!formIsValid) {
        e.preventDefault()
        setIsProcessing(false)
        return false
      }

      if (typeof onSubmit === 'function') {
        try {
          await onSubmit({
            data: reduceFieldsToValues(fields, false),
            unflattenedData: reduceFieldsToValues(fields, true),
            dispatchFields: contextRef.current.dispatchFields,
          })
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          console.error(message) // eslint-disable-line no-console
          setErrorFromSubmit(message)
        }
      }

      setIsProcessing(false)
      setIsModified(false)
      return false
    },
    [onSubmit, setHasSubmitted, setIsProcessing, setIsModified, fields],
  )

  const getFields = useCallback(() => contextRef.current.fields, [contextRef])

  const getField = useCallback(
    (path: string): Field => {
      return contextRef.current.fields[path]
    },
    [contextRef],
  )

  const getFormData = useCallback((): Data => {
    return reduceFieldsToValues(contextRef.current.fields, true)
  }, [contextRef])

  const validateForm = useCallback((): boolean => {
    return !Object.values(contextRef.current.fields).some((field): boolean => field.valid === false)
  }, [contextRef])

  contextRef.current.dispatchFields = dispatchFields
  contextRef.current.handleSubmit = handleSubmit
  contextRef.current.getFields = getFields
  contextRef.current.getField = getField
  contextRef.current.getFormData = getFormData
  contextRef.current.validateForm = validateForm
  contextRef.current.setIsModified = setIsModified
  contextRef.current.setIsProcessing = setIsProcessing
  contextRef.current.setHasSubmitted = setHasSubmitted

  useEffect(() => {
    contextRef.current = { ...initialContext }
    dispatchFields({
      type: 'REPLACE_STATE',
      state: initialState,
    })
  }, [initialState])

  return (
    <form
      method={method}
      action={action}
      noValidate
      onSubmit={contextRef.current.handleSubmit}
      className={className}
    >
      <FormContext.Provider
        value={{
          ...contextRef.current,
          apiErrors: errorsFromProps,
          submissionError: errorFromSubmit,
        }}
      >
        <FieldContext.Provider value={contextRef.current}>
          <FormSubmittedContext.Provider value={hasSubmitted}>
            <ProcessingContext.Provider value={isProcessing}>
              <ModifiedContext.Provider value={isModified}>{children}</ModifiedContext.Provider>
            </ProcessingContext.Provider>
          </FormSubmittedContext.Provider>
        </FieldContext.Provider>
      </FormContext.Provider>
    </form>
  )
}

export default Form
