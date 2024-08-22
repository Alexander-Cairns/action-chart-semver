const core = require('@actions/core');
const github = require('@actions/github');
const semver = require('semver');
const yaml = require('yaml');
const path = require('path');
const crypto = require('crypto');

function getAppDiff(newTag, oldTag) {
// get semVer diff between new and old tag
    if (!semver.valid(newTag,{loose: true}) && !semver.valid(oldTag, {loose: true})) {
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
  
  const getYaml = async function (path, ref) {
    const resp = await octokit.rest.repos.getContent({
      ...context.repo,
      path: path,
      ref: ref,
    })
    const content = atob(resp.data.content)
    return yaml.parse(content)
  }

  const changed_values_files = changed_files.data.filter(
    (file) => file.filename.endsWith('values.yaml')
  )

  for (file of changed_values_files){
    core.info(file.filename)
    const base_values = await getYaml( file.filename, base)
    core.info(base_values.image.tag)
    const pr_values = await getYaml( file.filename, context.ref)
    core.info(pr_values.image.tag)
    core.info(path.dirname(file.filename))
    const chart_file = `${path.dirname(file.filename)}/Chart.yaml` 
    var chart = await getYaml(chart_file, context.ref)
    core.info(chart.version)
    const diff = getAppDiff(pr_values.image.tag, base_values.image.tag)
    if (!diff) {
      continue
    }
    core.info(diff)
    const newVersion = createNewChartVersion(chart.version, diff)
    chart.version = newVersion
    const chart_content = yaml.stringify(chart)
    const chart_sha = crypto.createHash('sha256').update(chart_content).digest('base64');
    octokit.rest.repos.createOrUpdateFileContents({
      ...context.repo,
      path: chart_file,
      branch: pull_request.data.head.ref,
      content: btoa(chart_content),
      sha, chart_sha,
      message: 'bump chart',
    })
    core.info(pull_request.data.head.ref)
    core.info('----')

  }
}

run();
