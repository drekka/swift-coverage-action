const core = require('@actions/core')
const glob = require('@actions/glob')

const fs = require("node:fs")
const path = require('node:path')

const micromatch = require('micromatch')

async function generateReport() {
    try {

        const buildDir = core.getInput('build-dir')
        const coverageFileFilter = core.getInput('coverage-files')
        const coverageFilter = path.join(buildDir, coverageFileFilter)

        console.log('Loading coverage from: ' + coverageFilter)

        const includes = readFilterGlobs('Reporting on files matching', 'includes', buildDir)
        const excludes = readFilterGlobs('Excluding files matching', 'excludes', buildDir)

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

// Reads a filter from the input arguments and generates a list of globs.
function readFilterGlobs(logTitle, input, buildDir) {
    return core.getInput(input).split(',')
    .filter(glob => glob.trim())
    .map(glob => {
        console.log(logTitle + ': ' + glob)
        return glob
    })
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

        // Reject all files in the build dir as they'll be dependencies.
        var projectFiles = coverage.data[0].files.filter(file => file.filename.indexOf(buildDir) == -1)

        // Include only the files we want.
        if (includes.length > 0) {
            const matcher = micromatch.matcher(includes)
            projectFiles = projectFiles.filter(fileCoverage => matcher(fileCoverage.filename))
        }

        // Filter out any excludes.
        for (const glob in excludes) {

        }

        // Build the report.
        console.log('Coverage on ' + projectFiles.length + ' being processed.')
        for (const file of projectFiles) {
            console.log('File: ' + file.filename + ', lines: ' + file.summary.lines.count + ', coverage: ' + file.summary.lines.percent + '%')
        }

    });
}

generateReport()
