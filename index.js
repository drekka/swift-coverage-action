const core = require('@actions/core');
const github = require('@actions/github');

try {
  //const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello World!`);
  
  // Record the time of greeting as an output
  const time = (new Date()).toTimeString();
  core.setOutput("time", time);

} catch (error) {
  // Handle errors and indicate failure
  core.setFailed(error.message);
}
