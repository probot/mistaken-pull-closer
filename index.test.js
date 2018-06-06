/* eslint-env jest */

const {createRobot} = require('probot')
const app = require('.')
const pullRequestFromReleaseBranch =
    require('./test/fixtures/pull-request-from-release-branch')

const defaultCommentBody = `
Thanks for your submission.

It appears that you've created a pull request using one of our repository's branches. Since this is
almost always a mistake, we're going to go ahead and close this. If it was intentional, please
let us know what you were intending and we can see about reopening it.

Thanks again!
`

describe('mistaken-pull-closer', () => {
  let robot
  let github

  async function sendPullRequest (payload) {
    await robot.receive({
      name: 'pull_request.opened',
      event: 'pull_request',
      payload: pullRequestFromReleaseBranch
    })
  }

  function bareJest () {
    return jest.fn().mockReturnValue(Promise.resolve())
  }

  function setConfig (config) {
    github.repos.getContent = jest.fn().mockReturnValue(Promise.resolve({
      data: {
        content: Buffer.from(JSON.stringify(config)).toString('base64')
      }
    }))
  }

  function setPermissionLevel (level) {
    github.repos.reviewUserPermissionLevel =
        jest.fn().mockReturnValue(Promise.resolve({
          data: {
            permission: level
          }
        }))
  }

  function deleteLabel () {
    github.issues.getLabel =
        jest.fn().mockReturnValue(Promise.reject(new Error()))
  }

  beforeEach(() => {
    robot = createRobot()
    app(robot)
    github = {
      issues: {
        createComment: bareJest(),
        getLabel: bareJest(),
        addLabels: bareJest(),
        createLabel: bareJest(),
        edit: bareJest()
      },
      repos: {}
    }

    setConfig(null)
    setPermissionLevel('read')
    robot.auth = () => Promise.resolve(github)
  })

  describe('close sequence behavior', () => {
    it('default configuration used', async () => {
      deleteLabel()
      await sendPullRequest(pullRequestFromReleaseBranch)
      expect(github.issues.createComment).toHaveBeenCalledWith({
        body: defaultCommentBody,
        number: 15445,
        owner: 'atom',
        repo: 'atom'
      })
      expect(github.issues.createLabel).toHaveBeenCalledWith({
        color: 'e6e6e6',
        name: 'invalid',
        owner: 'atom',
        repo: 'atom'
      })
      expect(github.issues.addLabels).toHaveBeenCalledWith({
        labels: ['invalid'],
        number: 15445,
        owner: 'atom',
        repo: 'atom'
      })
    })

    it('configured message used', async () => {
      const testComment = 'test comment'
      setConfig({commentBody: testComment})
      await sendPullRequest(pullRequestFromReleaseBranch)
      expect(github.issues.createComment).toHaveBeenCalledWith({
        body: testComment,
        number: 15445,
        owner: 'atom',
        repo: 'atom'
      })
    })

    it('configured label used', async () => {
      const testLabel = 'test label'
      const testColor = 'c0ffee'
      setConfig({
        labelName: testLabel,
        labelColor: testColor
      })
      deleteLabel()
      await sendPullRequest(pullRequestFromReleaseBranch)
      expect(github.issues.createLabel).toHaveBeenCalledWith({
        color: testColor,
        name: testLabel,
        owner: 'atom',
        repo: 'atom'
      })
      expect(github.issues.addLabels).toHaveBeenCalledWith({
        labels: [testLabel],
        number: 15445,
        owner: 'atom',
        repo: 'atom'
      })
    })

    it('configured label disabled', async () => {
      setConfig({addLabel: false})
      await sendPullRequest(pullRequestFromReleaseBranch)
      expect(github.issues.createLabel).not.toHaveBeenCalled()
      expect(github.issues.addLabels).not.toHaveBeenCalled()
    })
  })

  describe('innocuous PR', () => {
    it('default configuration does not close innocuous PR', async () => {
      setPermissionLevel('admin')
      await sendPullRequest(pullRequestFromReleaseBranch)
      expect(github.issues.getLabel).not.toHaveBeenCalled()
      expect(github.issues.createLabel).not.toHaveBeenCalled()
      expect(github.issues.addLabels).not.toHaveBeenCalled()
      expect(github.issues.createComment).not.toHaveBeenCalled()
      expect(github.issues.edit).not.toHaveBeenCalled()
    })
  })

  describe('innocuous PR', () => {
    it('default configuration does not close innocuous PR', async () => {
      setPermissionLevel('admin')
      await sendPullRequest(pullRequestFromReleaseBranch)
      expect(github.issues.getLabel).not.toHaveBeenCalled()
      expect(github.issues.createLabel).not.toHaveBeenCalled()
      expect(github.issues.addLabels).not.toHaveBeenCalled()
      expect(github.issues.createComment).not.toHaveBeenCalled()
      expect(github.issues.edit).not.toHaveBeenCalled()
    })

    it('closeAll closes innocuous PR', async () => {
      setConfig({closeAll: true})
      setPermissionLevel('admin')
      await sendPullRequest(pullRequestFromReleaseBranch)
      expect(github.issues.edit).toHaveBeenCalled()
    })
  })
})
