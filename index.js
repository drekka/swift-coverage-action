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
        const minCoverage = core.getInput('coverage')

        console.log('Loading coverage from: ' + coverageFilter)

        const includes = readFilterGlobs('Reporting on files matching', 'includes', buildDir)
        const excludes = readFilterGlobs('Excluding files matching', 'excludes', buildDir)

        const globber = await glob.create(coverageFilter, {followSymbolicLinks: false})
        const coverageFiles = await globber.glob()
        for (const coverageFile of coverageFiles) {
            processCoverage(coverageFile, includes, excludes, buildDir, minCoverage)
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
function processCoverage(file, includes, excludes, buildDir, minCoverage) {

    console.log('Reading coverage file: ' + file)

    fs.readFile(file, (err, rawData) => {

        if (err) throw err;

        // Parse the raw coverage JSON into a data structure.
        const coverage = JSON.parse(rawData);

        // Read the file coverage summaries, rejecting files from the build dir as they'll be dependencies.
        var coverageData = coverage.data[0].files.filter(fileCoverage => fileCoverage.filename.indexOf(buildDir) == -1)

        // Filter the coverage data using the specified Globs.
        coverageData = filter(coverageData, includes)
        coverageData = filter(coverageData, excludes, true)

        // Build the report.
        console.log('Coverage on ' + coverageData.length + ' files being processed…')
        for (const coverage of coverageData) {
            console.log('File: ' + coverage.filename + ', lines: ' + coverage.summary.lines.count + ', coverage: ' + coverage.summary.lines.percent + '%')
        }

    });
}

// Returns a list of glob filtered coverage data.
function filterFiles(coverageData, globs, invert = false) {

    if (globs.length == 0) {
        return coverageData
    }

    const matcher = micromatch.matcher(globs)
    return coverageData.filter(coverage => matcher(coverage.filename) && !invert)
}

generateReport()
