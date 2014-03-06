module.exports = Utils = {
  /*
   * Get the full file path of the calling function.
   *
   * See:
   *  - http://stackoverflow.com/questions/13227489/how-can-one-get-the-file-path-of-the-caller-function-in-node-js
   *  - http://stackoverflow.com/questions/14172455/get-name-and-line-of-calling-function-in-node-js
   */
  getCaller: function() {
    var stack = getStack();
    return stack[3].receiver;
  },
  camelCase: function(input) { 
      return capitalize(input.toLowerCase().replace(/_(.)/g, function(match, group1) {
          return group1.toUpperCase();
      }));
  }
};

function capitalize(s)
{
    return s[0].toUpperCase() + s.slice(1);
}

function getStack() {
  // Save original Error.prepareStackTrace
  var origPrepareStackTrace = Error.prepareStackTrace;

  // Override with function that just returns `stack`
  Error.prepareStackTrace = function (_, stack) {
    return stack;
  };

  // Create a new `Error`, which automatically gets `stack`
  var err = new Error();
  var stack = err.stack;

  // Restore original `Error.prepareStackTrace`
  Error.prepareStackTrace = origPrepareStackTrace;
  // Remove superfluous function call on stack
  stack.shift(); // getStack --> Error

  return stack;
}
