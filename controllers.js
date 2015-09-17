var ctrl = angular.module('testApp.controllers', []);

ctrl.controller('MyCtrl', ['$scope', '$q', 'pp', function($scope, $q, pp) {
  
  $scope.score = {};
  
  $q.all([
    pp.getScore('1'),
  ]).then(function(res) {
      $scope.score['1'] = res[0];
    });
  
  $scope.incScore = function(id) {
    pp.add(id)
      .then(function(res) {
        return pp.getScore(id);
      })
      .then(function(score) {
        $scope.score[id] = score;
      })
  }
  
}]);
