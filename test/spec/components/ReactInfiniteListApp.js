'use strict';

describe('Main', function () {
  var React = require('react/addons');
  var ReactInfiniteListApp, component;

  beforeEach(function () {
    var container = document.createElement('div');
    container.id = 'content';
    document.body.appendChild(container);

    ReactInfiniteListApp = require('components/ReactInfiniteListApp.js');
    component = React.createElement(ReactInfiniteListApp);
  });

  it('should create a new instance of ReactInfiniteListApp', function () {
    expect(component).toBeDefined();
  });
});
