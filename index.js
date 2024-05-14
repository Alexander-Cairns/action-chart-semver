const core = require('@actions/core');
const github = require('@actions/github');
const semver = require('semver');

function getAppDiff(newTag, oldTag) {
// get semVer diff between new and old tag
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
    try {
        const newTag = core.getInput('new_tag');
        const oldTag = core.getInput('old_tag');
        const chartVersion = core.getInput('chart_version');
        const diff = getAppDiff(newTag, oldTag);
        core.setOutput('diff', diff);
        const newChartVersion = createNewChartVersion(chartVersion, diff);
        core.setOutput('new_chart_version', newChartVersion);

    } catch (error) {
        core.setFailed(error.message);
    }
}

run();