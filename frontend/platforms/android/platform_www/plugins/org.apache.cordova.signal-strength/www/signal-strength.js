cordova.define("org.apache.cordova.signal-strength.signal-strength", function(require, exports, module) {
function SignalStrength() {
  this.dbm = function(callback) {
    return cordova.exec(callback, function(err) {
      callback(-1);
    }, "SignalStrength", "dbm", []);

  };
}

window.SignalStrength = new SignalStrength()

});
