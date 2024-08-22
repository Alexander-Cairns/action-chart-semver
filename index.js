const core = require('@actions/core');
const github = require('@actions/github');
const semver = require('semver');
const yaml = require('yaml');

function getAppDiff(newTag, oldTag) {
// get semVer diff between new and old tag
    if (!semver.valid(newTag) && !semver.valid(oldTag)) {
        core.setFailed('Invalid tag format detected');
        return;
    }
    const diff = semver.diff(newTag, oldTag);
    return diff;
}

function createNewChartVersion(chartVersion, diff) {
    // if diff is null, exit
    if (!diff) {
        core.setFailed('No new version detected');
        return;
    }
// if diff is major, exit
    if (diff === 'major') {
        core.setFailed('Major version detected');
        return;
    }
    // else create chart version
    // if diff is minor, increment minor version of chart
    if (diff === 'minor') {
        return chartVersion = semver.inc(chartVersion, 'minor');
    } else if (diff === 'patch') {
        return chartVersion = semver.inc(chartVersion, 'patch');
    } else {
        core.setFailed('Unknown version detected');
        return;
    }
}




async function run() {
  const token = core.getInput('token')
  const octokit = github.getOctokit(token)
  const context = github.context
  const pull_request = await octokit.rest.pulls.get({
    ...context.repo,
    pull_number: context.payload.pull_request.number
  })
  const base = pull_request.data.base.ref
  const changed_files = await octokit.rest.pulls.listFiles({
    ...context.repo,
    pull_number: context.payload.pull_request.number,
  })
  
  core.notice()
  const changed_values_files = changed_files.data.filter(
    (file) => file.filename.endsWith('values.yaml')
  )

  for (file of changed_values_files){
    core.info(file.filename)
    const base_file = await octokit.rest.repos.getContent({
      ...context.repo,
      path: file.filename,
      ref: base,
    })
    const base_content = btoa(base_file.data.content)
    core.info(base_content)
    const base_values = yaml.parse(base_content)
    core.info(base_values.image.tag)
  }
}

run();
