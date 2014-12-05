require(['lib/jsx!example-list-people', 'data/people-dataset'], function (ExampleList, data) {


  var mountNode = document.querySelector('#placeholder');

  React.render(React.createElement(ExampleList, { jsonList : data }) , mountNode);


});
