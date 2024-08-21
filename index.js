const core = require('@actions/core');
const github = require('@actions/github');
const semver = require('semver');

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
  const changed_files = await octokit.rest.pulls.listFiles({
    ...context.repo,
    pull_number: context.payload.pull_request.number,
  })
  
  core.notice(changed_files.data[0].filename)
}

run();
