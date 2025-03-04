'use client'

import React, { Fragment, useEffect, useState } from 'react'
import { NewProjectBlock } from '@blocks/NewProject'
import { Cell, Grid } from '@faceless-ui/css-grid'
import { Text } from '@forms/fields/Text'
import Link from 'next/link'

import { Button } from '@components/Button'
import { ProjectCard } from '@components/cards/ProjectCard'
import { Gutter } from '@components/Gutter'
import { LoadingShimmer } from '@components/LoadingShimmer'
import { Pagination } from '@components/Pagination'
import { useGetProjects } from '@root/utilities/use-cloud-api'
import useDebounce from '@root/utilities/use-debounce'
import { useRouteData } from '../context'

import classes from './index.module.scss'

export const TeamPage = () => {
  const { team } = useRouteData()
  const [page, setPage] = React.useState<number>(1)
  const [search, setSearch] = React.useState<string>('')
  const debouncedSearch = useDebounce(search, 100)
  const [searchedTerm, setSearchedTerm] = React.useState<string>(search)
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false)
  const [renderNewProjectBlock, setRenderNewProject] = useState(false)

  const { isLoading, error, result } = useGetProjects({
    teams: team ? [typeof team === 'object' && team !== null ? team.id : team] : undefined,
    search: debouncedSearch,
    page,
  })

  // this will avoid rendering race conditions
  // where the `NewProjectBlock` will flash on the screen
  // and conflict with the `useGetProjects` loading state
  useEffect(() => {
    if (isLoading === false) {
      setSearchedTerm(debouncedSearch)
    }
  }, [isLoading, debouncedSearch])

  useEffect(() => {
    if (isLoading === false && !hasLoadedInitial) {
      setRenderNewProject(result?.docs?.length === 0)
      setHasLoadedInitial(true)
    }
  }, [isLoading, result, hasLoadedInitial])

  if (!hasLoadedInitial) {
    return (
      <Gutter>
        <LoadingShimmer number={3} />
      </Gutter>
    )
  }

  if (renderNewProjectBlock) {
    return (
      <NewProjectBlock
        heading={`Team '${team?.name}' has no projects yet`}
        cardLeader="New"
        headingElement="h4"
        teamSlug={team?.slug}
      />
    )
  }

  return (
    <Gutter>
      {error && <p className={classes.error}>{error}</p>}
      <div className={classes.controls}>
        <div className={classes.controlsBG} />
        <Text
          placeholder="Search projects"
          initialValue={search}
          onChange={setSearch}
          className={classes.search}
          fullWidth={false}
        />
        <Button
          appearance="primary"
          href={`/new${team?.slug ? `?team=${team.slug}` : ''}`}
          el="link"
          className={classes.createButton}
          label="Create new project"
        />
      </div>
      {isLoading && <LoadingShimmer number={3} />}
      {!isLoading && (
        <div className={classes.content}>
          {result?.docs.length === 0 && searchedTerm?.length > 0 && (
            <p className={classes.noResults}>
              {"Your search didn't return any results, please try again."}
            </p>
          )}
          {result?.docs.length > 0 && (
            <Grid className={classes.projects}>
              {result.docs.map((project, index) => (
                <Cell key={index} cols={4}>
                  <ProjectCard project={project} className={classes.projectCard} />
                </Cell>
              ))}
            </Grid>
          )}
        </div>
      )}
      {result?.totalPages > 1 && (
        <Pagination page={page} totalPages={result?.totalPages} setPage={setPage} />
      )}
    </Gutter>
  )
}
