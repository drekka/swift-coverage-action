const core = require('@actions/core')
const glob = require('@actions/glob')

const fs = require("node:fs")
const path = require('node:path');

const Minimatch = require('minimatch').Minimatch

async function generateReport() {
    try {

        const buildDir = core.getInput('build-dir')
        const coverageFileFilter = core.getInput('coverage-files')
        const coverageFilter = path.join(buildDir, coverageFileFilter)

        console.log('Loading coverage from: ' + coverageFilter)

        const includes = buildFilterGlobs('includes')
        for (const glob of includes) { console.log('Including: ' + glob) }
        const excludes = buildFilterGlobs('excludes')
        for (const glob of excludes) { console.log('Excluding: ' + glob) }

        const globber = await glob.create(coverageFilter, {followSymbolicLinks: false})
        const coverageFiles = await globber.glob()
        for (const coverageFile of coverageFiles) {
            processCoverage(coverageFile, includes, excludes, buildDir)
        }

        core.summary.addHeading('Code coverage', '1')
        core.summary.addRaw('Code coverage results', true)
        core.summary.write()

    } catch (error) {
        // Handle errors and indicate failure
        core.setFailed(error.message);
    }
}

function buildFilterGlobs(input, buildDir) {
    return core.getInput(input).split(',').map(glob => path.join(buildDir, glob.trim()))
}

// Processes a single coverage file.
function processCoverage(file, includes, excludes, buildDir) {

    console.log('Reading coverage file: ' + file)

    fs.readFile(file, (err, rawData) => {

        if (err) throw err;

        // Parse the raw coverage JSON into a data structure.
        const coverage = JSON.parse(rawData);

        console.log('Data count: ' + coverage.data.length)
        console.log('Lines  : ' + coverage.data[0].totals.lines.count)
        console.log('Covered: ' + coverage.data[0].totals.lines.covered)
        console.log('%      : ' + coverage.data[0].totals.lines.percent)

        // Reject files in the build dir as they'll be dependencies.
        var projectFiles = coverage.data[0].files.filter(file => file.filename.indexOf(buildDir) == -1)

        // Include only the files we want.
        const matchers = includes.map(glob => new Minimatch(glob, {}))
        projectFiles = projectFiles.filter(file => matchers.some(matcher => matcher.matches(file)))

        // Filter out any excludes.
        for (const glob in excludes) {

        }

        // Build the report.
        for (const file of projectFiles) {
            console.log('File: ' + file.filename)
        }

    });
}

generateReport()
