// Configuration for connecting to the Redmine
var host = "www.redmine.org";
var port = 80;

// Configuration for target project
var projectName = "redmine";
var path = "/projects/" + projectName + "/issues.csv?op%5Bstatus_id%5D=*&columns=all";

// Configuration for CSV file
var csvFileColumnNames = [
  "トラッカー"
  , "優先度"
  , "更新日"
  , "カテゴリ"
  , "作成日"
  , "終了日"
];

HTTP.start(host, port, function(http) {
  // Download CSV File from Redmine
  var response = http.get(path, {"Accept-Encoding": "Shift_JIS"}, HTTP.RESPONSE_TYPE_BODY);
  var csvString = Stream.binaryToText(response, "Shift_JIS");
  var rfc4180 = new RFC4180(true);

  // Parse CSV File
  var records = rfc4180.toArray(csvString);
  var recordsLength = records.length;
  var columnsLength = records[0].length;

  // Get column position
  var columnPosition = {};
  for(var i=0; i<columnsLength; i++) {
    for(var j=0; j<csvFileColumnNames.length; j++) {
      if(records[0][i] == csvFileColumnNames[j]) {
        columnPosition[csvFileColumnNames[j]] = i;
      }
    }
  }

  // Output to excel file
  var outputFileName = "redmine_" + new Date().getYYYYMMDDHH24MISS() + ".xls";
  File.copy("template/redmine_template.xls", outputFileName);
  var scriptPath = __FILE__.substring(0, __FILE__.lastIndexOf("\\"));

  Excel.open(scriptPath + "\\" + outputFileName, {}, function(excel) {
    var sheet = excel.getSheetByIndex(0);
    var currentRowIndex = 2;
    for(var i=1; i<recordsLength; i++) {
      for(var j=0; j<csvFileColumnNames.length; j++) {
        sheet.setValue(currentRowIndex, j+1, records[i][columnPosition[csvFileColumnNames[j]]]);
      }
      currentRowIndex++;
    }
    excel.save();
  });
});

echo("done");
