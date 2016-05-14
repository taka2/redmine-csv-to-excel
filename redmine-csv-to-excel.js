var host = "www.redmine.org";
var port = 80;
var projectName = "redmine";
var path = "/projects/" + projectName + "/issues.csv?columns=all";

HTTP.start(host, port, function(http) {
  File.open("redmine.csv", "w", function(file) {
    var response = http.get(path, {"Accept-Encoding": "Shift_JIS"}, HTTP.RESPONSE_TYPE_BODY);
    file.puts(Stream.binaryToText(response, "Shift_JIS"));
  });
});
