import {Application} from 'probot'
import defaultConfig from '../src/default-config'
import startApp from '../src/index'
import * as pullRequestFromReleaseBranch from './fixtures/pull-request-from-release-branch.json'

const defaultCommentBody = defaultConfig.commentBody

let app: any
let github: any

function sendPullRequest (payload: any) {
  return app.receive({
    name: 'pull_request.opened',
    event: 'pull_request',
    payload: payload
  })
}

function bareJest () {
  return jest.fn().mockReturnValue(Promise.resolve())
}

// TODO: We should be mocking probot-config out completely rather than building upon
//       assumptions about its implementation details.
function setConfig (config: any) {
  if (config) {
    github.repos.getContent = jest.fn().mockReturnValue(Promise.resolve({
      data: {
        content: Buffer.from(JSON.stringify(config)).toString('base64')
      }
    }))
  } else {
    github.repos.getContent = jest.fn().mockReturnValue(Promise.reject({code: 404}))
  }
}

function setPermissionLevel (level: any) {
  github.repos.reviewUserPermissionLevel =
    jest.fn().mockReturnValue(Promise.resolve({
      data: {
        permission: level
      }
    }))
}

describe('mistaken-pull-closer', async () => {
  beforeEach(async () => {
    app = new Application()

    github = {
      issues: {
        createComment: bareJest(),
        getLabel: jest.fn().mockReturnValue(Promise.resolve()),
        addLabels: bareJest(),
        createLabel: bareJest(),
        edit: bareJest()
      },
      repos: {}
    }

    app.auth = () => Promise.resolve(github)

    startApp(app)
  })

  describe('when the default configuration is used', async () => {
    beforeEach(async () => {
      setConfig(null)
    })

    describe('and the label does not exist', async () => {
      beforeEach(async () => {
        setPermissionLevel('read')
        github.issues.getLabel = jest.fn().mockReturnValue(Promise.reject(new Error()))
        await sendPullRequest(pullRequestFromReleaseBranch)
      })

      it('creates the label', async () => {
        expect(github.issues.createLabel).toHaveBeenCalledWith({
          color: 'e6e6e6',
          name: 'invalid',
          owner: 'atom',
          repo: 'atom'
        })
      })
    })

    describe('and a mistaken PR is opened', async () => {
      beforeEach(async () => {
        setPermissionLevel('read')
        await sendPullRequest(pullRequestFromReleaseBranch)
      })

      it('adds the default comment', async () => {
        expect(github.issues.createComment).toHaveBeenCalledWith({
          body: defaultCommentBody,
          number: 15445,
          owner: 'atom',
          repo: 'atom'
        })
      })

      it('adds the label to the pull request', async () => {
        expect(github.issues.addLabels).toHaveBeenCalledWith({
          labels: ['invalid'],
          number: 15445,
          owner: 'atom',
          repo: 'atom'
        })
      })
    })

    describe('and a normal PR is opened', async () => {
      beforeEach(async () => {
        setPermissionLevel('admin')
        await sendPullRequest(pullRequestFromReleaseBranch)
      })

      it('is not closed', async () => {
        expect(github.issues.getLabel).not.toHaveBeenCalled()
        expect(github.issues.createLabel).not.toHaveBeenCalled()
        expect(github.issues.addLabels).not.toHaveBeenCalled()
        expect(github.issues.createComment).not.toHaveBeenCalled()
        expect(github.issues.edit).not.toHaveBeenCalled()
      })
    })
  })

  describe('when an alternate message is configured', async () => {
    it('uses the configured message', async () => {
      const testComment = 'test comment'
      setConfig({commentBody: testComment})
      setPermissionLevel('read')

      await sendPullRequest(pullRequestFromReleaseBranch)

      expect(github.issues.createComment).toHaveBeenCalledWith({
        body: testComment,
        number: 15445,
        owner: 'atom',
        repo: 'atom'
      })
    })
  })

  describe('when an alternate label is configured', async () => {
    it('creates the configured label', async () => {
      github.issues.getLabel = jest.fn().mockReturnValue(Promise.reject(new Error()))
      setConfig({labelName: 'autoclosed', labelColor: 'c0ffee'})
      setPermissionLevel('read')

      await sendPullRequest(pullRequestFromReleaseBranch)

      expect(github.issues.createLabel).toHaveBeenCalledWith({
        color: 'c0ffee',
        name: 'autoclosed',
        owner: 'atom',
        repo: 'atom'
      })
    })
  })

  describe('when addLabel is false', async () => {
    beforeEach(async () => {
      setConfig({addLabel: false})
      setPermissionLevel('read')

      await sendPullRequest(pullRequestFromReleaseBranch)
    })

    it('does not add the label to the PR', async () => {
      expect(github.issues.addLabels).not.toHaveBeenCalled()
    })

    it('does not create the label', async () => {
      expect(github.issues.getLabel).not.toHaveBeenCalled()
      expect(github.issues.createLabel).not.toHaveBeenCalled()
    })
  })
})
