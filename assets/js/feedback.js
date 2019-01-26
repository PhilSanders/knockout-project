// assets / js / feedback

const consoleOut = document.querySelector("#ConsoleLog span")

const updateConsole = (text) => {
  // consoleOut.title = text
  consoleOut.innerHTML = text
}

module.exports.updateConsole = updateConsole
