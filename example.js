/**
 * Feel free to explore, or check out the full documentation
 * https://docs.newrelic.com/docs/synthetics/new-relic-synthetics/scripting-monitors/writing-api-tests
 * for details.
 */
var $http = require('request');
var fs = require('fs');
var assert = require('assert');
//The Insights API Query Key for the account of the mobile app your concerned with
var insightsQueryKey = '{your insights query id}';
//The Account ID that contain the mobile app your concerned with
var accountId = '{your account id}';
//This should look like it would in a Insights 'where' statement for a specific app
var appName = '{your app name}';
//the threshold for crash rate percentage
var errorRateThreshold = 1.00;
//timePeriod is in minutes
var timePeriod = 30;
// this will be part of a where appVersion > x statment. So, put the lowest appVersion you want include in the crash Rate calculation
var minNumberOfTransactions = 500;
//30 minute crash count - Min number of crashes in 30 minutes for alert to be fired
var minNumberOfErrors = 15;

function errorCount(numberOfTransactions,errorRatePercentage) {
	timePeriod = timePeriod + 5;
	var errorCount = "SELECT count(*) FROM TransactionError where appName = '" + appName  + "' SINCE " + timePeriod + " minutes ago UNTIL 5 minutes ago";
  //console.log(crashCount);
	var uri = 'https://insights-api.newrelic.com/v1/accounts/';
	uri += accountId;
	uri += '/query';
	var options = {
	'uri': uri,
	'qs': {'nrql': errorCount},
	'headers': {'X-Query-Key': insightsQueryKey},
	'json': true
	};
	$http.get(options, function(error, response, body) {
	if (!error && response.statusCode == 200) {
		var numberOfErrors = body.results[0].uniqueCount;
    if (numberOfErrors > minNumberOfErrors) {
      console.log('error rate is too high ' + errorRatePercentage + ' number of transactions is ' + numberOfTransactions + ' and there were ' + numberOfErrors + ' errors');
      assert.equal(1, 2, 'Error Rate is above ' + errorRateThreshold);
    }else {
			var numberOfErrors = body.results[0].uniqueCount;
      console.log('not enough errors. Error rate is ' + errorRatePercentage + ', but were are only ' + numberOfErrors + ' errors');
    }
	} else {
		console.log('error count query error: ' + error);
		console.log(response.statusCode);
	}
	});
}

function checkThroughput(errorRatePercentage) {
  timePeriod = timePeriod + 5;
	var transactionCount = "SELECT count(*) FROM Transaction, TransactionError where appName = '" + appName  + "' SINCE " + timePeriod + " minutes ago UNTIL 5 minutes ago";
  //console.log(sessionCount);
	var uri = 'https://insights-api.newrelic.com/v1/accounts/';
	uri += accountId;
	uri += '/query';
	var options = {
	'uri': uri,
	'qs': {'nrql': transactionCount},
	'headers': {'X-Query-Key': insightsQueryKey},
	'json': true
	};
	$http.get(options, function(error, response, body) {
	if (!error && response.statusCode == 200) {
		var numberOfTransactions = body.results[0].uniqueCount;
    if (numberOfTransactions > minNumberOfTransactions) {
			errorCount(numberOfTransactions,errorRatePercentage);
    }else {
			var numberOfTransactions = body.results[0].result;
      console.log('not enough transactions. Error rate is ' + errorRatePercentage + ', but there are only ' + numberOfTransactions + ' transactions');
    }
	} else {
		console.log('throughput query error: ' + error);
		console.log(response.statusCode);
	}
	});

}


function 	runNow() {
  timePeriod = timePeriod + 5;
	var errorRate = "SELECT percentage(count(*), WHERE error is true) FROM Transaction, TransactionError where appName = '" + appName  + "' SINCE " + timePeriod + " minutes ago UNTIL 5 minutes ago";
	var uri = 'https://insights-api.newrelic.com/v1/accounts/';
	uri += accountId;
	uri += '/query';
	var options = {
	'uri': uri,
	'qs': {'nrql': errorRate},
	'headers': {'X-Query-Key': insightsQueryKey},
	'json': true
	};
	$http.get(options, function(error, response, body) {
	if (!error && response.statusCode == 200) {
		var errorRatePercentage = body.results[0].result;
    if (errorRatePercentage > errorRateThreshold) {
			checkThroughput(errorRatePercentage);
    }else {
      console.log('too low ' + errorRatePercentage);
    }
	} else {
		console.log('Error Rate Query: ' + error);
		console.log(response.statusCode);
	}
	});
}

runNow();
