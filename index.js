const defaultConfig = require('./default-config')
const jp = require('jsonpath')
const getConfig = require('probot-config')

async function addLabel (context, issue, name, color) {
  const params = Object.assign({}, issue, {labels: [name]})

  await ensureLabelExists(context, {name, color})
  await context.github.issues.addLabels(params)
}

async function close (context, params) {
  const closeParams = Object.assign({}, params, {state: 'closed'})

  return context.github.issues.edit(closeParams)
}

async function comment (context, params) {
  return context.github.issues.createComment(params)
}

async function ensureLabelExists (context, {name, color}) {
  try {
    return await context.github.issues.getLabel(context.repo({name}))
  } catch (e) {
    return context.github.issues.createLabel(context.repo({name, color}))
  }
}

async function hasPushAccess (context, params) {
  const permissionResponse = await context.github.repos.reviewUserPermissionLevel(params)
  const level = permissionResponse.data.permission

  return level === 'admin' || level === 'write'
}

module.exports = (app) => {
  app.on('pull_request.opened', async context => {
    const htmlUrl = context.payload.pull_request.html_url
    app.log.debug(`Inspecting: ${htmlUrl}`)

    const config = await getConfig(context, 'mistaken-pull-closer.yml', defaultConfig) || defaultConfig
    const username = context.payload.pull_request.user.login
    const canPush = await hasPushAccess(context, context.repo({username}))
    const data = Object.assign({has_push_access: canPush}, context.payload)

    if (!config.filters.every((filter, i) => {
      try {
        if (jp.query([data], `$[?(${filter})]`).length > 0) {
          app.log.info(`Filter "${filter}" matched the PR ✅ [${i + 1} of ${config.filters.length}]`)
          return true
        }
      } catch (e) {
        app.log.debug(`Malformed JSONPath query: "${filter}"`)
      }
      return false
    })) return

    app.log.debug(`Close PR ${htmlUrl}`)
    await comment(context, context.issue({body: config.commentBody}))
    if (config.addLabel) {
      await addLabel(
          context, context.issue(), config.labelName, config.labelColor)
    }
    return close(context, context.issue())
  })
}
