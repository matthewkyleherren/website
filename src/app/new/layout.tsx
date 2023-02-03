'use client'

import * as React from 'react'
import { useTheme } from '@providers/Theme'
import { usePathname, useRouter } from 'next/navigation'

import { Gutter } from '@components/Gutter'
import { HeaderObserver } from '@components/HeaderObserver'
import { Heading } from '@components/Heading'
import { Label } from '@components/Label'
import { useAuth } from '@root/providers/Auth'

const NewButNoUser = () => {
  const router = useRouter()
  const pathname = usePathname()

  if (pathname !== '/new') router.replace('/new')

  return (
    <Gutter>
      <Label>New</Label>
      <h1>Let's build something awesome.</h1>
      <p>
        You need to be logged in to create a new project. If you don't have an account, you can
        create one for free.
      </p>

      <div>
        <Heading as="h4">Custom sign up page displaying templates and sign up form?</Heading>
      </div>
    </Gutter>
  )
}

const AllProjectsLayout = ({ children }) => {
  const theme = useTheme()

  const { user } = useAuth()

  return (
    <HeaderObserver color={theme} pullUp>
      {!user ? <NewButNoUser /> : children}
    </HeaderObserver>
  )
}

export default AllProjectsLayout
